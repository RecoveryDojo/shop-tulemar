import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Eye, Check, X, AlertCircle, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { useProducts } from '@/hooks/useProducts';

interface ExcelProduct {
  name: string;
  description: string;
  price: number;
  category_id: string;
  unit: string;
  origin?: string;
  image_url?: string;
  stock_quantity?: number;
  rowIndex: number;
  status: 'pending' | 'validated' | 'error' | 'published';
  errors: string[];
}

const BulkInventoryManager = () => {
  const [excelData, setExcelData] = useState<ExcelProduct[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [fileName, setFileName] = useState('');
  const { categories, refetch } = useProducts();

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Organic Bananas',
        description: 'Fresh organic bananas from local farms',
        price: 2.99,
        category_id: 'Select category ID from categories list',
        unit: 'lb',
        origin: 'Costa Rica',
        image_url: 'https://example.com/banana.jpg',
        stock_quantity: 100
      },
      {
        name: 'Premium Coffee Beans',
        description: 'Single-origin Arabica coffee beans',
        price: 15.99,
        category_id: 'Select category ID from categories list',
        unit: 'bag',
        origin: 'Colombia',
        image_url: 'https://example.com/coffee.jpg',
        stock_quantity: 50
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    
    // Add categories sheet for reference
    const categoriesSheet = XLSX.utils.json_to_sheet(
      categories.map(cat => ({ id: cat.id, name: cat.name, icon: cat.icon }))
    );
    XLSX.utils.book_append_sheet(wb, categoriesSheet, 'Categories');
    
    XLSX.writeFile(wb, 'product-upload-template.xlsx');
    
    toast({
      title: "Template Downloaded",
      description: "Use this template to format your product data correctly.",
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

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const validatedProducts = jsonData.map((row, index) => 
          validateProduct(row, index + 2) // +2 because Excel is 1-indexed and has header
        );

        setExcelData(validatedProducts);
        
        const validCount = validatedProducts.filter(p => p.status === 'validated').length;
        const errorCount = validatedProducts.filter(p => p.status === 'error').length;
        
        toast({
          title: "File Processed",
          description: `${validCount} valid products, ${errorCount} with errors`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process Excel file. Please check the format.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  }, [categories]);

  const publishProducts = async () => {
    const validProducts = excelData.filter(p => p.status === 'validated');
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
          <div className="flex gap-4 flex-wrap">
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="excel-upload" className="cursor-pointer">
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="default" className="flex items-center gap-2" disabled={isUploading}>
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Processing...' : 'Upload Excel File'}
                </Button>
              </Label>
            </div>

            {excelData.length > 0 && (
              <Button 
                onClick={publishProducts} 
                disabled={isPublishing || excelData.filter(p => p.status === 'validated').length === 0}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {isPublishing ? 'Publishing...' : `Publish ${excelData.filter(p => p.status === 'validated').length} Products`}
              </Button>
            )}
          </div>

          {fileName && (
            <div className="text-sm text-muted-foreground">
              File: {fileName} ({excelData.length} rows)
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