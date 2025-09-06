import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Eye, Check, X, AlertCircle, Package, Bot, Sparkles, Edit3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { useProducts } from '@/hooks/useProducts';

interface ExcelProduct {
  id?: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  unit: string;
  origin?: string;
  image_url?: string;
  stock_quantity?: number;
  rowIndex: number;
  status: 'pending' | 'validated' | 'error' | 'published' | 'suggested' | 'ready';
  errors: string[];
  suggestions?: string[];
  original_data?: any;
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

  const parseColumnAEData = (row: any, index: number): ExcelProduct => {
    // Handle A-E format: A=name, B=brand, C=CRC price, D=USD price, E=image
    const keys = Object.keys(row);
    
    let name = '';
    let brand = '';
    let crcPrice = '';
    let usdPrice = '';
    let imageUrl = '';
    
    // Extract values based on column position (A-E mapping)
    if (keys[0] && row[keys[0]]) name = String(row[keys[0]]).trim();
    if (keys[1] && row[keys[1]]) brand = String(row[keys[1]]).trim();
    if (keys[2] && row[keys[2]]) crcPrice = String(row[keys[2]]).trim();
    if (keys[3] && row[keys[3]]) usdPrice = String(row[keys[3]]).trim();
    if (keys[4] && row[keys[4]]) imageUrl = String(row[keys[4]]).trim();
    
    // Parse price - prefer USD over CRC
    let finalPrice = 0;
    if (usdPrice && usdPrice !== '') {
      // Extract USD price
      const usdMatch = usdPrice.match(/[\d.,]+/);
      if (usdMatch) {
        finalPrice = parseFloat(usdMatch[0].replace(',', ''));
      }
    } else if (crcPrice && crcPrice !== '') {
      // Convert CRC to USD
      const crcMatch = crcPrice.match(/[\d.,]+/);
      if (crcMatch) {
        const crcValue = parseFloat(crcMatch[0].replace(',', ''));
        finalPrice = Math.round((crcValue / exchangeRate) * 100) / 100;
      }
    }
    
    // Extract unit from name (115g, 1L, etc.)
    let unit = 'each';
    const unitMatch = name.match(/(\d+)\s*(g|kg|ml|l|oz|lb|lbs)\b/i);
    if (unitMatch) {
      unit = unitMatch[2].toLowerCase();
    }
    
    const errors: string[] = [];
    if (!name || name === '') errors.push('Name is required (Column A)');
    if (!finalPrice || finalPrice <= 0) errors.push('Valid price required (Column C or D)');
    
    return {
      name,
      description: brand ? `${brand} ${name}` : name,
      price: finalPrice,
      category_id: '', // Will be set by AI
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

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    setFileName(file.name);
    setIsUploading(true);

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

        // Convert to object format and skip header/empty rows
        const filteredData = rawData
          .slice(1) // Skip header row
          .filter((row: any) => {
            // Filter out empty rows and category header rows
            const hasData = row && Array.isArray(row) && row.some((cell: any) => 
              cell !== undefined && cell !== null && String(cell).trim() !== ''
            );
            
            // Skip if this looks like a category header (only has text in first column)
            if (hasData && row.length > 1) {
              const nonEmptyColumns = row.filter((cell: any) => 
                cell !== undefined && cell !== null && String(cell).trim() !== ''
              ).length;
              
              // If only one column has data, it's probably a category header
              if (nonEmptyColumns === 1) return false;
              
              // Check if this has price-like data (numbers, currency symbols)
              const hasPriceData = row.some((cell: any) => 
                cell && String(cell).match(/[\$₡\d]/));
              
              return hasPriceData;
            }
            return hasData;
          })
          .map((row: any, index: number) => {
            // Convert array to object with consistent keys
            const obj: any = {};
            row.forEach((cell: any, colIndex: number) => {
              obj[`col_${colIndex}`] = cell;
            });
            return obj;
          });

        console.log('Filtered data:', filteredData.length, 'product rows');

        const parsedProducts = filteredData.map((row, index) => {
          console.log(`Parsing A-E row ${index + 2}:`, row);
          return parseColumnAEData(row, index + 2);
        });

        console.log('Parsing complete:', parsedProducts);
        setExcelData(parsedProducts);
        
        const validCount = parsedProducts.filter(p => p.status !== 'error').length;
        const errorCount = parsedProducts.filter(p => p.status === 'error').length;
        
        console.log(`Processing complete: ${validCount} valid, ${errorCount} errors`);
        
        toast({
          title: "A-E Format Processed",
          description: `${validCount} products parsed, ${errorCount} with errors. Use AI processing for categorization.`,
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
      const { data, error } = await supabase.functions.invoke('ai-normalize-products', {
        body: { 
          rows: excelData.map(p => p.original_data),
          filename: fileName,
          settings: {
            columnFormat: 'A-E',
            exchangeRate,
            dryRun,
            preferUSD: true
          }
        }
      });

      if (error) throw error;

      const { jobId, summary, items } = data;
      
      // Transform AI results to match our interface
      const transformedItems = items.map((item: any, index: number) => ({
        ...item,
        rowIndex: index + 2, // Excel row numbering
        stock_quantity: item.stock_quantity || 10
      }));

      setExcelData(transformedItems);
      if (!dryRun) setImportJobId(jobId);

      toast({
        title: dryRun ? "Dry Run Complete" : "AI Processing Complete",
        description: `${summary.ready} ready, ${summary.suggested} need review, ${summary.errors} errors`,
        variant: summary.errors > 0 ? "destructive" : "default",
      });

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

      {excelData.length > 0 && (
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
                    const category = categories.find(cat => cat.id === product.category_id);
                    
                    return (
                      <TableRow key={index} className={product.status === 'error' ? 'bg-red-50' : ''}>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>{product.rowIndex}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {product.name}
                        </TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {category ? (
                            <div className="flex items-center gap-1">
                              <span>{category.icon}</span>
                              <span className="text-sm">{category.name}</span>
                            </div>
                          ) : (
                            <span className="text-red-500 text-sm">Invalid ID</span>
                          )}
                        </TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
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