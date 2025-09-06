import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Eye, Check, X, AlertCircle, Package, Bot, Sparkles, Edit3, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { useProducts } from '@/hooks/useProducts';

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
  status: 'pending' | 'validated' | 'error' | 'published' | 'suggested' | 'ready';
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
  const { categories, refetch } = useProducts();

  // Debug effect to track excelData changes
  useEffect(() => {
    console.log('📊 ExcelData state changed:', {
      length: excelData.length,
      data: excelData,
      firstProduct: excelData[0]
    });
  }, [excelData]);

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
  
  // Parse price - prefer USD over CRC
  let finalPrice = 0;
  let priceErrors = [];
  
  if (usdPrice && usdPrice !== '') {
    // Extract USD price with robust locale handling
    const m = usdPrice.match(/[\d.,]+/);
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
      } else {
        priceErrors.push(`Invalid USD price: ${usdPrice}`);
      }
    } else {
      priceErrors.push(`Could not parse USD price: ${usdPrice}`);
    }
  } else if (crcPrice && crcPrice !== '') {
    // Convert CRC to USD with robust locale handling
    const m = crcPrice.match(/[\d.,]+/);
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
      } else {
        priceErrors.push(`Invalid CRC price or exchange rate: ${crcPrice} (rate: ${exchangeRate})`);
      }
    } else {
      priceErrors.push(`Could not parse CRC price: ${crcPrice}`);
    }
  } else {
    priceErrors.push('No price found in USD or CRC columns');
  }
  
  // Extract unit from name (115g, 1L, etc.)
  let unit = 'each';
  // Enhanced unit extraction: supports decimals and common variants (g, kg, ml, L, oz, lb, pack)
  const unitMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|kg|ml|l|lt|oz|lb|lbs|pack|pk|unit|un|unid)\b/i);
  if (unitMatch) {
    const amount = unitMatch[1].replace(',', '.').trim();
    let u = unitMatch[2].toLowerCase();
    if (u === 'gr') u = 'g';
    if (u === 'lt') u = 'l';
    if (u === 'lbs') u = 'lb';
    if (u === 'pk') u = 'pack';
    if (u === 'un' || u === 'unid' || u === 'unit') u = 'each';

    if (u === 'each') {
      unit = 'each';
    } else {
      unit = `${amount}${['g','kg','ml','l','oz','lb'].includes(u) ? u : ` ${u}`}`.trim();
    }
  }
  
  const errors: string[] = [...priceErrors];
  if (!name || name.trim() === '') errors.push('Name is required (Column A)');
  if (!brand || brand.trim() === '') errors.push('Brand/description is required (Column B)');
  if (!finalPrice || finalPrice <= 0) errors.push('Valid price required (Column C or D)');
  
  return {
      name,
      description: brand || '', // Map column B to description field
      price: finalPrice,
      category_id: '', // Will be set by AI
      category_hint: categoryHint || undefined,
      unit,
      origin: brand,
      image_url: imageUrl,
      stock_quantity: 10, // Default
      rowIndex: index,
      status: errors.length > 0 ? 'error' : 'pending',
      errors,
      original_data: row
    };
};

  const extractEmbeddedImages = async (file: File): Promise<{ [rowIndex: number]: string }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);
      
      const imageMapping: { [rowIndex: number]: string } = {};
      
      // Look for embedded images in xl/media/ folder
      const mediaFolder = zip.folder('xl/media');
      if (!mediaFolder) {
        console.log('No media folder found in Excel file');
        return imageMapping;
      }
      
      // Get all image files
      const imageFiles = Object.keys(mediaFolder.files).filter(name => 
        name.match(/\.(jpg|jpeg|png|gif)$/i)
      );
      
      console.log(`Found ${imageFiles.length} embedded images`);
      
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = mediaFolder.files[imageFiles[i]];
        if (!imageFile) continue;
        
        const imageBlob = await imageFile.async('blob');
        const fileName = `excel-image-${Date.now()}-${i}.${imageFiles[i].split('.').pop()}`;
        
        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageBlob);
          
        if (error) {
          console.error('Error uploading image:', error);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        // Map to row index (starting from row 2, so i+2)
        imageMapping[i + 2] = publicUrl;
      }
      
      return imageMapping;
    } catch (error) {
      console.error('Error extracting embedded images:', error);
      return {};
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

    try {
      // First extract embedded images
      const imageMapping = await extractEmbeddedImages(file);
      console.log('Extracted image mapping:', imageMapping);

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

rawData.slice(1).forEach((rowArr: any, idx: number) => {
  const cells = Array.isArray(rowArr) ? rowArr : [];
  const nonEmpty = cells.filter((c: any) => c !== undefined && c !== null && String(c).trim() !== '');
  const firstCell = cells[0] ? String(cells[0]).trim() : '';
  const hasPriceLike = cells.some((c: any) => c && String(c).match(/[\$₡\d]/));

  // Category header detection: only first column has text, no price-like tokens
  const isCategoryHeader = firstCell && nonEmpty.length === 1 && !hasPriceLike;

  if (isCategoryHeader) {
    lastCategoryHint = firstCell;
    return; // Do not push header rows into products
  }

  // Skip empty rows
  if (nonEmpty.length === 0) return;

  // Only include rows that look like products (should have some price-like value)
  if (!hasPriceLike) return;

  // Build object with consistent keys and attach hint
  const obj: any = {};
  cells.forEach((cell: any, colIndex: number) => {
    obj[`col_${colIndex}`] = cell;
  });
  if (lastCategoryHint) obj._category_hint = lastCategoryHint;

  processedRows.push(obj);
});

const filteredData = processedRows;

console.log('Filtered data:', filteredData.length, 'product rows');

          const parsedProducts = filteredData.map((row, index) => {
            console.log(`Parsing A-E row ${index + 2}:`, row);
            const product = parseColumnAEData(row, index + 2, exchangeRate);
            
            // Check if this row has an embedded image
            const actualRowIndex = index + 2;
            const imageUrl = imageMapping[actualRowIndex];
            if (imageUrl) {
              product.image_url = imageUrl;
              product.hasEmbeddedImage = true;
            }
            
            return product;
          });

          console.log('Parsing complete:', parsedProducts);
          console.log('🚀 Setting excelData to:', parsedProducts.length, 'products');
          setExcelData(parsedProducts);
          
          const validCount = parsedProducts.filter(p => p.status !== 'error').length;
          const errorCount = parsedProducts.filter(p => p.status === 'error').length;
          const imageCount = Object.keys(imageMapping).length;
          
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

  const publishProducts = async () => {
    const validProducts = excelData.filter(p => p.status === 'validated' || p.status === 'ready');
    if (validProducts.length === 0) {
      toast({
        title: "No Valid Products",
        description: "Please fix validation errors before publishing.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const product of validProducts) {
      try {
        const { error } = await supabase
          .from('products')
          .insert({
            name: product.name,
            description: product.description,
            price: product.price,
            category_id: product.category_id,
            unit: product.unit,
            origin: product.origin || null,
            image_url: product.image_url || null,
            stock_quantity: product.stock_quantity,
            is_active: true
          });

        if (error) throw error;

        // Update status in UI
        setExcelData(prev => prev.map(p => 
          p.rowIndex === product.rowIndex 
            ? { ...p, status: 'published' as const }
            : p
        ));
        
        successCount++;
      } catch (error: any) {
        // Update status in UI
        setExcelData(prev => prev.map(p => 
          p.rowIndex === product.rowIndex 
            ? { ...p, status: 'error' as const, errors: [...p.errors, error.message] }
            : p
        ));
        
        errorCount++;
      }
    }

    setIsPublishing(false);
    
    toast({
      title: "Publishing Complete",
      description: `${successCount} products published successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    if (successCount > 0) {
      refetch(); // Refresh product list
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