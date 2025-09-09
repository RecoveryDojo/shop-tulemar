import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Eye, Check, X, AlertCircle, Package, Bot, Sparkles, Edit3, Image, Trash2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { useProducts } from '@/hooks/useProducts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImportJobManager from './ImportJobManager';
import TestProductManager from './TestProductManager';

interface ExcelProduct {
  id?: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  category_hint?: string; // Derived from Excel category header rows (e.g., "Dairy")
  unit: string;
  origin?: string;
  image_url?: string;
  stock_quantity?: number;
  rowIndex: number;
  status: 'pending' | 'validated' | 'error' | 'published' | 'suggested' | 'ready' | 'duplicate';
  errors: string[];
  suggestions?: string[];
  original_data?: any;
  hasEmbeddedImage?: boolean;
  ai_suggestions?: {
    confidence_score?: number;
    learned_patterns?: string[];
    auto_fixes?: string[];
  };
  user_corrections?: any;
}

const BulkInventoryManager = () => {
  const [excelData, setExcelData] = useState<ExcelProduct[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);
  const [fileName, setFileName] = useState('');
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState(500); // CRC to USD default rate
  const [selectedCategoryForAll, setSelectedCategoryForAll] = useState<string>('');
  const [imageMapping, setImageMapping] = useState<any>(null); // Store image mapping data
  const { categories, refetch } = useProducts();
  const [isResetting, setIsResetting] = useState(false);

  // Debug effect to track excelData changes
  useEffect(() => {
    console.log('📊 ExcelData state changed:', {
      length: excelData.length,
      data: excelData,
      firstProduct: excelData[0]
    });
  }, [excelData]);

  const clearExcelData = () => {
    setExcelData([]);
    setFileName('');
    setImportJobId(null);
    setSelectedCategoryForAll('');
    setImageMapping(null); // Clear image mapping when clearing data
    console.log('🗑️ Cleared Excel data and reset state for new upload');
    toast({
      title: "Data Cleared",
      description: "Ready for new Excel upload.",
    });
  };

  const assignCategoryToAll = (categoryId: string) => {
    if (!categoryId) {
      toast({
        title: "No Category Selected",
        description: "Please select a category first.",
        variant: "destructive",
      });
      return;
    }

    setExcelData(prev => prev.map(product => ({
      ...product,
      category_id: categoryId,
      status: product.errors.filter(e => !e.includes('Category')).length === 0 ? 'validated' as const : 'error' as const,
      errors: product.errors.filter(e => !e.includes('Category')) // Remove category-related errors
    })));

    const selectedCategory = categories.find(cat => cat.id === categoryId);
    toast({
      title: "Category Assigned",
      description: `All products assigned to "${selectedCategory?.name}" category.`,
    });
  };

  const markAllAsValid = async () => {
    console.log('🔄 Starting markAllAsValid, available categories:', categories);
    let validCount = 0;
    let errorCount = 0;

    const updatedProducts = excelData.map(product => {
      console.log(`🔄 Processing product: ${product.name}, category_hint: ${product.category_hint}, current category_id: ${product.category_id}`);
      const errors: string[] = [];
      
      // Auto-assign category based on category_hint if not already set
      let categoryId = product.category_id;
      if (!categoryId && product.category_hint && categories.length > 0) {
        // Try exact match first
        let matchingCategory = categories.find(cat => 
          cat.name.toLowerCase() === product.category_hint.toLowerCase()
        );
        
        // If no exact match, try partial matching
        if (!matchingCategory) {
          matchingCategory = categories.find(cat => 
            cat.name.toLowerCase().includes(product.category_hint.toLowerCase()) ||
            product.category_hint.toLowerCase().includes(cat.name.toLowerCase())
          );
        }
        
        // If still no match, just use the first available category as fallback
        if (!matchingCategory && categories.length > 0) {
          matchingCategory = categories[0];
          console.log(`🔄 Using fallback category: ${matchingCategory.name} for ${product.category_hint}`);
        }
        
        if (matchingCategory) {
          categoryId = matchingCategory.id;
          console.log(`✅ Matched category: ${product.category_hint} -> ${matchingCategory.name} (${categoryId})`);
        } else {
          console.log(`❌ No category match found for: ${product.category_hint}`);
        }
      }
      
      // Validate required fields
      if (!product.name || product.name.trim() === '') errors.push('Name is required');
      if (!product.price || product.price <= 0) errors.push('Valid price is required');
      if (!categoryId || categoryId.trim() === '') {
        errors.push('Category is required');
        console.log(`❌ Category still missing for ${product.name}`);
      }
      if (!product.unit || product.unit.trim() === '') errors.push('Unit is required');
      
      const newStatus = errors.length === 0 ? 'validated' as const : 'error' as const;
      
      if (newStatus === 'validated') {
        validCount++;
      } else {
        errorCount++;
      }

      return {
        ...product,
        category_id: categoryId || product.category_id,
        status: newStatus,
        errors
      };
    });

    setExcelData(updatedProducts);

    console.log(`✅ Validation complete: ${validCount} valid, ${errorCount} errors`);
    
    toast({
      title: "Validation Complete", 
      description: `${validCount} products validated successfully${errorCount > 0 ? `, ${errorCount} have errors` : ''}`,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    // Auto-publish if all products are now validated
    if (validCount > 0 && errorCount === 0) {
      console.log('🚀 All products valid, auto-publishing...');
      setTimeout(() => publishProducts(), 500); // Small delay to let UI update
    }
  };

  const downloadTemplate = () => {
    console.log('Downloading template, categories available:', categories.length);
    
    if (!categories || categories.length === 0) {
      toast({
        title: "Categories Loading",
        description: "Please wait for categories to load before downloading the template.",
        variant: "destructive",
      });
      return;
    }

    // Create A-E format template matching user's structure
    const template = [
      ['Item Name', 'Brand', 'CRC Price', 'USD Price', 'Image URL'], // Headers in row 1
      ['Organic Bananas', 'Farm Fresh', '₡1,500', '$3.00', 'https://example.com/banana.jpg'],
      ['Premium Coffee', 'Café Oro', '₡8,000', '$16.00', 'https://example.com/coffee.jpg'],
      ['Fresh Milk', 'Dos Pinos', '₡1,200', '$2.40', 'https://example.com/milk.jpg']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    
    // Add categories reference sheet
    const categoriesSheet = XLSX.utils.json_to_sheet(
      categories.map(cat => ({ 
        ID: cat.id, 
        Name: cat.name, 
        Icon: cat.icon,
        'Use this ID': `Copy "${cat.id}" for category mapping`
      }))
    );
    XLSX.utils.book_append_sheet(wb, categoriesSheet, 'Categories');
    
    // Add instructions sheet
    const instructions = [
      ['Column A-E Template Instructions'],
      [''],
      ['Column A: Item Name (required)'],
      ['Column B: Brand (optional, used as origin)'],
      ['Column C: Costa Rica Colones Price (optional if USD provided)'],
      ['Column D: USD Price (preferred, will be used if available)'],
      ['Column E: Image URL (optional, will be processed by AI)'],
      [''],
      ['Notes:'],
      ['- USD prices (Column D) are preferred over CRC prices'],
      ['- AI will automatically categorize products if no category specified'],
      ['- Images will be downloaded and optimized automatically'],
      ['- Use "Dry Run" feature to test before publishing']
    ];
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');
    
    XLSX.writeFile(wb, 'product-upload-template-A-E.xlsx');
    
    toast({
      title: "A-E Template Downloaded",
      description: "Template matches your Column A-E format. Check Instructions sheet for details.",
    });
  };

  const validateProduct = (product: any, rowIndex: number): ExcelProduct => {
    const errors: string[] = [];
    
    if (!product.name || product.name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!product.price || isNaN(Number(product.price)) || Number(product.price) <= 0) {
      errors.push('Valid price is required');
    }
    
    if (!product.category_id || product.category_id.trim() === '') {
      errors.push('Category ID is required');
    } else if (!categories.find(cat => cat.id === product.category_id.trim())) {
      errors.push('Invalid category ID');
    }
    
    if (!product.unit || product.unit.trim() === '') {
      errors.push('Unit is required');
    }

    return {
      name: product.name?.toString().trim() || '',
      description: product.description?.toString().trim() || '',
      price: Number(product.price) || 0,
      category_id: product.category_id?.toString().trim() || '',
      unit: product.unit?.toString().trim() || '',
      origin: product.origin?.toString().trim() || '',
      image_url: product.image_url?.toString().trim() || '',
      stock_quantity: Number(product.stock_quantity) || 0,
      rowIndex,
      status: errors.length > 0 ? 'error' : 'validated',
      errors
    };
  };

// Global variable to track the last product name for carry-forward logic
let lastCarriedName = '';

const parseColumnAEData = (row: any, index: number, exchangeRate: number): ExcelProduct => {
  // Handle A-E format: A=name, B=brand, C=CRC price, D=USD price, E=image
  const keys = Object.keys(row);
  
  let name = '';
  let brand = '';
  let crcPrice = '';
  let usdPrice = '';
  let imageUrl = '';
  const categoryHint = (row._category_hint || row.category_hint || '').toString().trim();
  
  // Extract values based on column position (A-E mapping)
  if (keys[0] && row[keys[0]]) name = String(row[keys[0]]).trim();
  if (keys[1] && row[keys[1]]) brand = String(row[keys[1]]).trim();
  if (keys[2] && row[keys[2]]) crcPrice = String(row[keys[2]]).trim();
  if (keys[3] && row[keys[3]]) usdPrice = String(row[keys[3]]).trim();
  if (keys[4] && row[keys[4]]) imageUrl = String(row[keys[4]]).trim();
  
  // Carry-forward logic: If name is empty but we have a price, use the last carried name
  if (!name || name === '') {
    if ((crcPrice || usdPrice) && lastCarriedName) {
      name = lastCarriedName;
      console.log(`🔄 Row ${index}: Carrying forward name "${name}" (had price but no name)`);
    }
  } else {
    // Update the carried name when we encounter a new product name
    lastCarriedName = name;
    console.log(`📝 Row ${index}: Updated carried name to "${name}"`);
  }
  
  // Debug price parsing
  console.log(`💰 Row ${index}: Price parsing - USD:"${usdPrice}" CRC:"${crcPrice}" Rate:${exchangeRate}`);
  
  // Parse price - prefer USD over CRC
  let finalPrice = 0;
  let priceErrors = [];
  
  if (usdPrice && usdPrice !== '') {
    // Extract USD price with robust locale handling and currency symbol support
    const cleanUsd = usdPrice.replace(/[$€£¥₡\s]/g, ''); // Remove currency symbols and spaces
    const m = cleanUsd.match(/[\d.,]+/);
    if (m) {
      let s = m[0].replace(/\s/g, '');
      if (s.includes('.') && s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else if (s.includes(',')) {
        const parts = s.split(',');
        if (parts[1] && parts[1].length === 2) {
          s = s.replace(',', '.');
        } else {
          s = s.replace(/,/g, '');
        }
      } else {
        const parts = s.split('.');
        if (parts.length > 2) {
          const last = parts.pop() as string;
          s = parts.join('') + '.' + last;
        }
      }
      const parsedUsd = parseFloat(s);
      if (!isNaN(parsedUsd) && parsedUsd > 0) {
        finalPrice = parsedUsd;
        console.log(`✅ Row ${index}: USD parsed successfully: "${usdPrice}" → $${finalPrice}`);
      } else {
        priceErrors.push(`Invalid USD price: "${usdPrice}" → parsed as ${parsedUsd}`);
        console.log(`❌ Row ${index}: USD parsing failed: "${usdPrice}" → ${parsedUsd}`);
      }
    } else {
      priceErrors.push(`Could not extract numbers from USD price: "${usdPrice}"`);
      console.log(`❌ Row ${index}: No numbers found in USD: "${usdPrice}"`);
    }
  } else if (crcPrice && crcPrice !== '') {
    // Convert CRC to USD with robust locale handling and colones symbol support
    const cleanCrc = crcPrice.replace(/[₡$€£¥\s]/g, ''); // Remove currency symbols and spaces
    const m = cleanCrc.match(/[\d.,]+/);
    if (m) {
      let s = m[0].replace(/\s/g, '');
      if (s.includes('.') && s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else if (s.includes(',')) {
        const parts = s.split(',');
        if (parts[1] && parts[1].length === 2) {
          s = s.replace(',', '.');
        } else {
          s = s.replace(/,/g, '');
        }
      } else {
        const parts = s.split('.');
        if (parts.length > 2) {
          const last = parts.pop() as string;
          s = parts.join('') + '.' + last;
        }
      }
      const crcValue = parseFloat(s);
      if (!isNaN(crcValue) && crcValue > 0 && exchangeRate > 0) {
        finalPrice = Math.round((crcValue / exchangeRate) * 100) / 100;
        console.log(`✅ Row ${index}: CRC converted successfully: "${crcPrice}" → ₡${crcValue} → $${finalPrice} (rate: ${exchangeRate})`);
      } else if (exchangeRate <= 0) {
        priceErrors.push(`Invalid exchange rate: ${exchangeRate}. Please set a valid CRC→USD rate.`);
        console.log(`❌ Row ${index}: Invalid exchange rate: ${exchangeRate}`);
      } else {
        priceErrors.push(`Invalid CRC price: "${crcPrice}" → parsed as ${crcValue}`);
        console.log(`❌ Row ${index}: CRC parsing failed: "${crcPrice}" → ${crcValue}`);
      }
    } else {
      priceErrors.push(`Could not extract numbers from CRC price: "${crcPrice}"`);
      console.log(`❌ Row ${index}: No numbers found in CRC: "${crcPrice}"`);
    }
  } else {
    priceErrors.push('No price found in USD (Column D) or CRC (Column C)');
    console.log(`❌ Row ${index}: No price data - USD:"${usdPrice}" CRC:"${crcPrice}"`);
  }
  
  // Extract unit from name (115g, 1L, etc.)
  let unit = 'each';
  if (name) {
    const unitMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|kg|ml|l|lt|oz|lb|lbs|pack|pk|unit|un|unid|bottle|btl)\b/i);
    if (unitMatch) {
      const amount = unitMatch[1].replace(',', '.').trim();
      let u = unitMatch[2].toLowerCase();
      if (u === 'gr') u = 'g';
      if (u === 'lt') u = 'l';
      if (u === 'lbs') u = 'lb';
      if (u === 'pk') u = 'pack';
      if (u === 'btl') u = 'bottle';
      if (u === 'un' || u === 'unid' || u === 'unit') u = 'each';

      if (u === 'each') {
        unit = 'each';
      } else {
        unit = `${amount}${['g','kg','ml','l','oz','lb'].includes(u) ? u : ` ${u}`}`.trim();
      }
      console.log(`📏 Row ${index}: Unit extracted: "${unitMatch[0]}" → "${unit}"`);
    }
  }
  
  const errors: string[] = [...priceErrors];
  if (!name || name.trim() === '') errors.push('Product name is required (Column A) or could not be carried forward');
  // Column B (brand/description) is now optional - user said it can be empty
  if (!finalPrice || finalPrice <= 0) errors.push('Valid price required in Column C (CRC) or D (USD)');
  
  console.log(`🏁 Row ${index}: Final result - Name:"${name}" Price:$${finalPrice} Errors:${errors.length}`);
  
  return {
      name,
      description: brand || '', // Column B is now optional
      price: finalPrice,
      category_id: '', // Will be set by AI or bulk assignment
      category_hint: categoryHint || undefined,
      unit,
      origin: brand || '', // Use brand as origin if available
      image_url: imageUrl,
      stock_quantity: 10, // Default
      rowIndex: index,
      status: errors.length > 0 ? 'error' : 'pending',
      errors,
      original_data: row
    };
};

  const extractEmbeddedImages = async (file: File): Promise<{ __imageRowMapping: any[], __debugInfo: any }> => {
    // STEP 1: Establish Ground Truth - Comprehensive image-to-row mapping
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      // STEP 2: Create Robust Mapping Logic - Get Excel drawing relationships
      const mediaFolder = zip.folder('xl/media');
      const drawingsFolder = zip.folder('xl/drawings');
      
      if (!mediaFolder) {
        console.log('🔍 DEBUG: No media folder found in Excel file');
        return { __imageRowMapping: [], __debugInfo: { totalImages: 0, mappingMethod: 'none' } };
      }

      // Parse drawing relationships to get precise row positions
      let drawingRelationships = {};
      if (drawingsFolder) {
        try {
          const drawingFiles = Object.keys(drawingsFolder.files).filter(name => name.endsWith('.xml'));
          for (const drawingFile of drawingFiles) {
            const drawingXml = await drawingsFolder.files[drawingFile].async('text');
            // Parse XML to extract image positions and row relationships
            const rowMatches = drawingXml.match(/row="(\d+)"/g) || [];
            const imageMatches = drawingXml.match(/r:embed="rId(\d+)"/g) || [];
            
            rowMatches.forEach((rowMatch, index) => {
              const row = parseInt(rowMatch.match(/row="(\d+)"/)?.[1] || '0') + 1; // Convert to 1-based
              const imageId = imageMatches[index]?.match(/r:embed="rId(\d+)"/)?.[1];
              if (imageId) {
                drawingRelationships[imageId] = row;
              }
            });
          }
        } catch (error) {
          console.log('⚠️ Could not parse drawing relationships, falling back to sequential mapping');
        }
      }

      const imageFiles = Object.keys(mediaFolder.files)
        .filter((name) => name.match(/\.(jpg|jpeg|png|gif)$/i))
        .sort((a, b) => {
          // Extract number from filename (e.g., image1.jpg, image34.jpg)
          const numA = parseInt(a.match(/image(\d+)/)?.[1] || '0');
          const numB = parseInt(b.match(/image(\d+)/)?.[1] || '0');
          return numA - numB;
        });
      
      console.log(`🔍 GROUND TRUTH: Found ${imageFiles.length} images in Excel:`, imageFiles.map(f => f.split('/').pop()));
      console.log(`🔍 DRAWING RELATIONSHIPS:`, drawingRelationships);
      
      const imageRowMapping = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const fileName = imageFiles[i];
        const imageNumber = parseInt(fileName.match(/image(\d+)/)?.[1] || '0');
        
        // STEP 3: Handle Edge Cases - Determine Excel row for this image
        let excelRow;
        if (Object.keys(drawingRelationships).length > 0 && drawingRelationships[imageNumber]) {
          // Use drawing relationship if available
          excelRow = drawingRelationships[imageNumber];
          console.log(`📍 PRECISE MAPPING: Image ${imageNumber} → Excel row ${excelRow} (from drawing XML)`);
        } else {
          // Fallback: Sequential mapping starting from row 3 (row 1 is header, row 2 might be empty/header)
          excelRow = i + 3;
          console.log(`📍 SEQUENTIAL MAPPING: Image ${imageNumber} → Excel row ${excelRow} (fallback - first product at row 3)`);
        }
        
        try {
          const imageFile = mediaFolder.files[fileName];
          const imageData = await imageFile.async('arraybuffer');
          const imageBlob = new Blob([imageData], { type: 'image/jpeg' });
          
          const uploadName = `bulk-upload/${Date.now()}-${i}-${fileName.split('/').pop()}`;
          
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(uploadName, imageBlob, { upsert: true });
            
          if (uploadError) {
            console.error(`❌ Error uploading image ${i + 1}:`, uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(uploadName);

          // STEP 2 CONTINUED: Store the mapping with Excel row number
          imageRowMapping.push({
            excelRow: excelRow,
            imageUrl: publicUrl,
            fileName: fileName.split('/').pop(),
            imageIndex: i,
            mappingMethod: Object.keys(drawingRelationships).length > 0 ? 'drawing-xml' : 'sequential'
          });
          
          console.log(`✅ MAPPED: Image ${i + 1} → Excel row ${excelRow} → ${publicUrl.split('/').pop()}`);
        } catch (error) {
          console.error(`❌ Error processing image ${i + 1}:`, error);
        }
      }
      
      // STEP 4: Add Debugging Tools - Comprehensive mapping report
      console.log(`🗺️ FINAL IMAGE MAPPING TABLE:`);
      imageRowMapping.forEach(mapping => {
        console.log(`  Excel Row ${mapping.excelRow} → ${mapping.fileName} (${mapping.mappingMethod})`);
      });
      
      const debugInfo = {
        totalImages: imageRowMapping.length,
        mappingMethod: Object.keys(drawingRelationships).length > 0 ? 'drawing-xml' : 'sequential',
        drawingRelationships: drawingRelationships,
        imageRowMapping: imageRowMapping
      };
      
      console.log(`✅ EXTRACTION COMPLETE: ${imageRowMapping.length} images mapped with ${debugInfo.mappingMethod} method`);
      return { __imageRowMapping: imageRowMapping, __debugInfo: debugInfo };
    } catch (error) {
      console.error('❌ Error extracting embedded images:', error);
      return { __imageRowMapping: [], __debugInfo: { totalImages: 0, mappingMethod: 'error', error: error.message } };
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    setFileName(file.name);
    setIsUploading(true);

    // Calculate file hash to prevent duplicates
    const fileHash = await calculateFileHash(file);
    const existingJob = await checkForDuplicateJob(fileHash, file.name);

    if (existingJob) {
      toast({
        title: "Duplicate File Detected",
        description: `This file was already uploaded on ${new Date(existingJob.created_at).toLocaleDateString()}. Would you like to load the existing data instead?`,
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    try {
      // Extract embedded images from Column E and upload them
      const extractedImageMapping = await extractEmbeddedImages(file);
      console.log('Extracted embedded images from Column E:', extractedImageMapping);
      
      // STEP 5: Store mapping in state for debugging
      setImageMapping(extractedImageMapping);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log('File reader loaded, processing...');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          console.log('Workbook created, sheet names:', workbook.SheetNames);
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
          console.log('Raw data extracted:', rawData.length, 'rows');

// Convert to object format, track category headers, and attach context hints
const processedRows: any[] = [];
let lastCategoryHint = '';

// Reset carry-forward name at the start of processing
lastCarriedName = '';

rawData.slice(1).forEach((rowArr: any, idx: number) => {
  const cells = Array.isArray(rowArr) ? rowArr : [];
  const nonEmpty = cells.filter((c: any) => c !== undefined && c !== null && String(c).trim() !== '');
  const firstCell = cells[0] ? String(cells[0]).trim() : '';
  const hasPriceLike = cells.some((c: any) => c && String(c).match(/[\$₡\d]/));

  // Category header detection: only first column has text, no price-like tokens
  const isCategoryHeader = firstCell && nonEmpty.length === 1 && !hasPriceLike;

  if (isCategoryHeader) {
    lastCategoryHint = firstCell;
    console.log(`📁 Row ${idx + 2}: Category header detected: "${firstCell}"`);
    return; // Do not push header rows into products
  }

  // Skip completely empty rows
  if (nonEmpty.length === 0) {
    console.log(`⬜ Row ${idx + 2}: Skipping empty row`);
    return;
  }

  // Include rows that have price-like values OR could be carry-forward candidates
  // (rows with only brand/description but no name, if they have a price)
  const couldBeCarryForward = !firstCell && hasPriceLike && cells[1]; // No name but has brand/price
  
  if (!hasPriceLike && !couldBeCarryForward) {
    console.log(`⏭️ Row ${idx + 2}: Skipping non-product row (no price data)`);
    return;
  }

  // Build object with consistent keys and attach hint
  const obj: any = {};
  cells.forEach((cell: any, colIndex: number) => {
    obj[`col_${colIndex}`] = cell;
  });
  if (lastCategoryHint) obj._category_hint = lastCategoryHint;
  
  // CRITICAL: Preserve original Excel row number for image mapping
  obj.__rowNum__ = idx + 2; // Convert to 1-based row number (idx starts at 0, +1 for header)

  console.log(`➕ Row ${idx + 2}: Added to processing - Name:"${firstCell}" Price-like:${hasPriceLike} Carry-forward:${couldBeCarryForward}`);
  processedRows.push(obj);
});

const filteredData = processedRows;

console.log('Filtered data:', filteredData.length, 'product rows');

          const parsedProducts = filteredData.map((row, index) => {
            const originalRowIndex = (row.__rowNum__ || (index + 2));
            console.log(`🔍 Processing product ${index + 1}/${filteredData.length}: ${row.col_0 || 'unnamed'} (Excel row ${originalRowIndex})`);
            
            const product = parseColumnAEData(row, originalRowIndex, exchangeRate);
            
            // STEP 5: Lock in the Solution - Use robust row-based mapping
            // Find the image that corresponds to this Excel row using our mapping table
            if ('__imageRowMapping' in extractedImageMapping) {
              const imageRowMapping = (extractedImageMapping as any).__imageRowMapping as any[];
              const debugInfo = (extractedImageMapping as any).__debugInfo;
              
              console.log(`🔍 ROBUST MAPPING: Looking for image for Excel row ${originalRowIndex}`);
              console.log(`📋 DEBUG: Available mappings:`, imageRowMapping.map(m => `Row ${m.excelRow} → ${m.fileName}`));
              console.log(`🎯 DEBUG: Searching for excelRow === ${originalRowIndex}`);
              
              // Use product sequence to find image (first product → row 3, second → row 4, etc.)
              const imageRowToFind = index + 3; // index 0 → row 3, index 1 → row 4, etc.
              const mappedImage = imageRowMapping.find(mapping => {
                console.log(`🔍 Product ${index + 1} (${product.name}) looking for image row ${imageRowToFind} (Excel row ${originalRowIndex})`);
                return mapping.excelRow === imageRowToFind;
              });
              
              if (mappedImage) {
                product.image_url = mappedImage.imageUrl;
                product.hasEmbeddedImage = true;
                console.log(`✅ PERFECT MATCH: Excel row ${originalRowIndex} → ${mappedImage.fileName} (${mappedImage.mappingMethod})`);
              } else {
                console.log(`❌ NO MAPPING: Excel row ${originalRowIndex} has no corresponding image`);
                console.log(`📋 AVAILABLE MAPPINGS:`, imageRowMapping.map(m => `Row ${m.excelRow} → ${m.fileName}`));
              }
              
              // STEP 4: Add Debugging Tools - Show mapping validation
              console.log(`🛠️ MAPPING DEBUG for row ${originalRowIndex}:`, {
                productName: product.name,
                foundImage: !!mappedImage,
                imageName: mappedImage?.fileName || 'none',
                mappingMethod: debugInfo.mappingMethod,
                totalMappings: imageRowMapping.length
              });
            }
            
            // Fallback to old sequential method if new mapping not available
            else if ('__sequentialImages' in extractedImageMapping) {
              console.log(`⚠️ FALLBACK: Using legacy sequential mapping for row ${originalRowIndex}`);
              const sequentialImages = (extractedImageMapping as any).__sequentialImages as string[];
              const imageIndex = originalRowIndex - 3; // Fixed offset: row 3 is first product, image 0
              
              if (imageIndex >= 0 && imageIndex < sequentialImages.length) {
                product.image_url = sequentialImages[imageIndex];
                product.hasEmbeddedImage = true;
                console.log(`📦 LEGACY: Excel row ${originalRowIndex} → image ${imageIndex + 1} (offset -3) → ${sequentialImages[imageIndex].split('/').pop()}`);
              }
            }
            
            return product;
          });

          console.log('Parsing complete:', parsedProducts);
          console.log('🚀 Setting excelData to:', parsedProducts.length, 'products');
          setExcelData(parsedProducts);
          
          const validCount = parsedProducts.filter(p => p.status !== 'error').length;
          const errorCount = parsedProducts.filter(p => p.status === 'error').length;
          const imageCount = parsedProducts.filter(p => p.image_url).length;
          
          console.log(`Processing complete: ${validCount} valid, ${errorCount} errors, ${imageCount} images`);
          
          toast({
            title: "A-E Format Processed",
            description: `${validCount} products parsed${imageCount > 0 ? `, ${imageCount} embedded images` : ''}, ${errorCount} with errors. Use AI processing for categorization.`,
          });
        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            title: "Error",
            description: `Failed to process Excel file: ${error instanceof Error ? error.message : 'Please check the A-E format.'}`,
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('File reader error:', error);
        setIsUploading(false);
        toast({
          title: "Error",
          description: "Failed to read the file. Please try again.",
          variant: "destructive",
        });
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error during file upload:', error);
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    }
  }, [exchangeRate]);

  const processWithAI = async (dryRun = false) => {
    if (!excelData || excelData.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload an Excel file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingAI(true);
    if (dryRun) setIsDryRun(true);
    
    try {
      // Use the new enhanced AI processor with external enrichment
      const { data, error } = await supabase.functions.invoke('ai-enhanced-processor', {
        body: {
          products: excelData.map(p => ({
            name: p.name,
            brand: p.origin,
            price: p.price,
            image_url: p.image_url,
            original_data: p.original_data,
            category_hint: p.category_hint,
            stock_quantity: p.stock_quantity || 0,
            processing_context: {
              upload_timestamp: Date.now(),
              user_corrections: p.user_corrections || {},
              previous_suggestions: p.ai_suggestions || null
            }
          })),
          jobId: null,
          enableExternalEnrichment: true,
          processingStages: ['cleanup', 'enrichment', 'validation']
        }
      });

      if (error) throw error;

      if (data.success) {
        const processedProducts = data.products;
      
        // Transform enhanced AI results to match our interface
        const transformedItems = processedProducts.map((item: any, index: number) => ({
        ...item,
        rowIndex: index + 2, // Excel row numbering
        stock_quantity: item.stock_quantity || 10,
        ai_suggestions: {
          confidence_score: item.confidence_score || 0,
          learned_patterns: item.learned_patterns_applied || [],
          auto_fixes: item.auto_fixes || []
        }
      }));

      setExcelData(transformedItems);

      const validCount = transformedItems.filter(p => p.quality_score >= 50).length;
      const errorCount = transformedItems.filter(p => p.quality_score < 50).length;
      
      toast({
        title: dryRun ? "Enhanced AI Analysis Complete" : "Enhanced AI Processing Complete", 
        description: `${validCount} validated, ${errorCount} need review. Enhanced with external data sources.`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

        toast({
          title: dryRun ? "Enhanced AI Processing Complete" : "Enhanced AI Processing Complete",
          description: `Processed ${processedProducts.length} products with enhanced AI learning.`,
        });
      } else {
        throw new Error(data.error || 'Enhanced AI processing failed');
      }

    } catch (error: any) {
      console.error('AI processing error:', error);
      toast({
        title: "AI Processing Failed",
        description: error.message || "Please try again or check your data format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAI(false);
      setIsDryRun(false);
    }
  };

  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const checkForDuplicateJob = async (fileHash: string, filename: string) => {
    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .or(`file_hash.eq.${fileHash},source_filename.eq.${filename}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
  };

  const checkForDuplicateProducts = async (products: ExcelProduct[]) => {
    const duplicates = [];
    
    for (const product of products.filter(p => p.status === 'suggested' || p.status === 'validated')) {
      if (!product.name || !product.category_id) continue;

      const { data: existingProducts } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .eq('is_active', true);

      if (existingProducts) {
        const exactMatch = existingProducts.find(p => 
          p.name.toLowerCase() === product.name.toLowerCase()
        );

        if (exactMatch) {
          duplicates.push({
            import_product: product,
            existing_product: exactMatch,
            type: 'exact'
          });
        }
      }
    }

    return duplicates;
  };

  const publishProducts = async () => {
    const validProducts = excelData.filter(product => product.status === 'validated');
    
    if (validProducts.length === 0) {
      toast({
        title: "No Valid Products",
        description: "Please validate some products before publishing",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    let publishedCount = 0;
    let skippedCount = 0;
    
    try {
      // Check for existing products and handle duplicates
      const updatedExcelData = [...excelData];
      
      for (let i = 0; i < validProducts.length; i++) {
        const product = validProducts[i];
        const productIndex = excelData.findIndex(p => p.rowIndex === product.rowIndex);
        
        // Check if product already exists by name
        const { data: existingProduct, error: checkError } = await supabase
          .from('products')
          .select('id, name')
          .eq('name', product.name)
          .eq('is_active', true)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking for duplicate:', checkError);
        }

        if (existingProduct) {
          // Mark as duplicate in our local data
          updatedExcelData[productIndex] = {
            ...product,
            status: 'duplicate' as const,
            errors: ['Product already exists in catalog']
          };
          skippedCount++;
          console.log(`⏭️ Skipping duplicate product: ${product.name}`);
        } else {
          // Try to insert the new product
          const productData = {
            name: product.name,
            description: product.description,
            price: product.price,
            category_id: product.category_id,
            unit: product.unit,
            origin: product.origin,
            stock_quantity: product.stock_quantity || 0,
            image_url: product.image_url,
            is_active: true,
            is_test_product: true
          };

          const { error: insertError } = await supabase
            .from('products')
            .insert([productData]);

          if (insertError) {
            console.error(`Error inserting ${product.name}:`, insertError);
            // Mark as error
            updatedExcelData[productIndex] = {
              ...product,
              status: 'error' as const,
              errors: [insertError.message || 'Failed to insert product']
            };
          } else {
            publishedCount++;
            console.log(`✅ Published product: ${product.name}`);
            // Mark as published
            updatedExcelData[productIndex] = {
              ...product,
              status: 'published' as const,
              errors: []
            };
          }
        }
      }

      // Update the Excel data with duplicate/error statuses
      setExcelData(updatedExcelData);

      toast({
        title: "Publishing Complete",
        description: `${publishedCount} products published, ${skippedCount} duplicates skipped`,
        variant: publishedCount > 0 ? "default" : "destructive",
      });

      if (publishedCount > 0) {
        refetch(); // Refresh product list
      }
      
    } catch (error) {
      console.error('Error publishing products:', error);
      toast({
        title: "Publishing Error",
        description: error instanceof Error ? error.message : "Failed to publish products",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Admin action: clear cached images from product-images/bulk-upload
  const clearCachedImages = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-bulk-images', {
        body: { prefix: 'bulk-upload/' },
      });
      if (error) throw error;
      toast({
        title: 'Cached Images Cleared',
        description: `${data?.deletedCount ?? 0} images removed from storage.`,
      });
      // Reset local state to avoid stale references
      setExcelData([]);
      setImageMapping(null);
      setFileName('');
    } catch (err: any) {
      console.error('Error clearing cached images:', err);
      toast({
        title: 'Cleanup Failed',
        description: err?.message || 'Could not delete cached images.',
        variant: 'destructive',
      });
    }
  };

  const resetCatalog = async () => {
    const confirmed = window.confirm('This will disable all products and remove cached bulk-upload images. Continue?');
    if (!confirmed) return;
    try {
      setIsResetting(true);
      const { data, error } = await supabase.functions.invoke('reset-product-catalog', {
        body: { delete_categories: false, prefix: 'bulk-upload/' },
      });
      if (error) throw error;
      toast({
        title: 'Catalog Reset',
        description: `${data?.productsUpdated ?? 0} products disabled, ${data?.imagesDeleted ?? 0} images removed.`,
      });
      setExcelData([]);
      setImageMapping(null);
      setFileName('');
      refetch?.();
    } catch (err: any) {
      console.error('Error resetting catalog:', err);
      toast({
        title: 'Reset Failed',
        description: err?.message || 'Could not reset catalog.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const getStatusBadge = (status: ExcelProduct['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'validated':
        return <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>;
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Ready
        </Badge>;
      case 'suggested':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Bot className="h-3 w-3 mr-1" />
          AI Suggested
        </Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'published':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Published</Badge>;
      case 'duplicate':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Duplicate (skipped)</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bulk Product Import
          </CardTitle>
          <CardDescription>
            Upload an Excel file to import multiple products at once. Download the template to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download A-E Template
              </Button>
              <Button onClick={clearCachedImages} variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Clear Cached Images
              </Button>
              <Button onClick={resetCatalog} variant="destructive" disabled={isResetting} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                {isResetting ? 'Resetting…' : 'Reset Catalog'}
              </Button>
              
              <div className="flex items-center gap-2">
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="default" 
                  className="flex items-center gap-2" 
                  disabled={isUploading}
                  onClick={() => {
                    console.log('Upload button clicked');
                    const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
                    if (fileInput) {
                      fileInput.click();
                    } else {
                      console.error('File input not found');
                    }
                  }}
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Processing...' : 'Upload A-E Excel File'}
                </Button>
              </div>
            </div>

            {/* Exchange Rate Setting */}
            <div className="flex items-center gap-4">
              <Label htmlFor="exchange-rate" className="text-sm">CRC to USD Rate:</Label>
              <Input
                id="exchange-rate"
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value) || 500)}
                className="w-24"
                min="300"
                max="800"
              />
              <span className="text-sm text-muted-foreground">₡{exchangeRate} = $1.00</span>
            </div>

            {excelData.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {excelData.length} products loaded from {fileName}
                </span>
                <Button 
                  onClick={clearExcelData}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  Clear Data
                </Button>
              </div>
            )}

            {excelData.length > 0 && (
              <div className="space-y-4">
                {/* Bulk Actions Section */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Bulk Actions
                  </h4>
                  <div className="flex gap-4 flex-wrap items-center">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="category-select" className="text-sm">Assign category to all:</Label>
                      <Select value={selectedCategoryForAll} onValueChange={setSelectedCategoryForAll}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.icon} {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => assignCategoryToAll(selectedCategoryForAll)}
                        disabled={!selectedCategoryForAll}
                        variant="outline"
                        size="sm"
                      >
                        Apply to All
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={markAllAsValid}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                      Validate & Publish All
                    </Button>
                  </div>
                </div>

                {/* STEP 4: Visual Image Mapping Debug Tool */}
                {imageMapping && '__imageRowMapping' in imageMapping && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                      🗺️ Image Mapping Debug Tool
                    </h4>
                    <div className="text-sm text-blue-700 mb-3">
                      Mapping Method: <span className="font-mono font-bold">{(imageMapping as any).__debugInfo?.mappingMethod}</span> | 
                      Total Images: <span className="font-mono font-bold">{(imageMapping as any).__debugInfo?.totalImages}</span>
                    </div>
                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {((imageMapping as any).__imageRowMapping as any[]).map((mapping, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-mono bg-blue-100 px-2 py-1 rounded">Row {mapping.excelRow}</span>
                            <span className="text-gray-600">→</span>
                            <span className="font-mono">{mapping.fileName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={mapping.mappingMethod === 'drawing-xml' ? 'default' : 'secondary'}>
                              {mapping.mappingMethod}
                            </Badge>
                            {mapping.imageUrl && (
                              <img 
                                src={mapping.imageUrl} 
                                alt={mapping.fileName}
                                className="w-8 h-8 object-cover rounded border"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Processing Actions */}
                <div className="flex gap-4 flex-wrap">
                  <Button 
                    onClick={() => processWithAI(true)}
                    disabled={isProcessingAI}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {isDryRun ? 'Testing...' : 'Dry Run (Test)'}
                  </Button>

                  <Button 
                    onClick={() => processWithAI(false)}
                    disabled={isProcessingAI}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isProcessingAI ? 'AI Processing...' : 'Process with AI'}
                  </Button>

                  <Button 
                    onClick={publishProducts} 
                    disabled={isPublishing || excelData.filter(p => p.status === 'validated' || p.status === 'ready').length === 0}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {isPublishing ? 'Publishing...' : `Publish ${excelData.filter(p => p.status === 'validated' || p.status === 'ready').length} Products`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {fileName && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>File: {fileName} ({excelData.length} rows)</span>
              {importJobId && (
                <span className="flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  AI Job: {importJobId.slice(0, 8)}...
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {(() => {
        console.log('🔍 Debug: excelData length:', excelData.length);
        console.log('🔍 Debug: excelData:', excelData);
        return excelData.length > 0;
      })() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview & Validation
            </CardTitle>
            <CardDescription>
              Review the imported data and fix any validation errors before publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>AI Suggestions</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelData.map((product, index) => {
                    console.log('🔄 Rendering product row:', index, product);
                    const category = categories.find(cat => cat.id === product.category_id);
                    
                    return (
                      <TableRow key={index} className={product.status === 'error' ? 'bg-red-50' : ''}>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>{product.rowIndex}</TableCell>
                         <TableCell className="font-medium max-w-[200px] truncate">
                          <div className="flex items-center gap-2">
                            {product.image_url && (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-8 h-8 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            {product.hasEmbeddedImage && !product.image_url && (
                              <Image className="h-4 w-4 text-blue-600" />
                            )}
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                          {product.description || 'None'}
                        </TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {product.category_hint ? (
                            <Badge variant="secondary" className="text-xs">
                              {product.category_hint}
                            </Badge>
                          ) : product.category_id ? (
                            <Badge variant="default" className="text-xs">
                              {categories.find(cat => cat.id === product.category_id)?.name || 'Unknown'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {product.unit || 'each'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{product.stock_quantity || 0}</span>
                        </TableCell>
<TableCell>
  {product.suggestions && product.suggestions.length > 0 && (
    <div className="flex items-center gap-1 text-blue-600">
      <Sparkles className="h-3 w-3" />
      <span className="text-xs">{product.suggestions.join(', ')}</span>
    </div>
  )}
</TableCell>
                        <TableCell>
                          {product.errors.length > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">{product.errors.join(', ')}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkInventoryManager;