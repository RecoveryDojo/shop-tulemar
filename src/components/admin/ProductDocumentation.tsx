import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Image, 
  DollarSign,
  FileText,
  Lightbulb
} from 'lucide-react';

export const ProductDocumentation: React.FC = () => {
  const downloadTemplate = () => {
    // Create a simple Excel template with proper headers
    const templateData = [
      ['BULK IMPORT TEMPLATE - PRODUCT INVENTORY', '', '', '', ''],
      ['', '', '', '', ''],
      ['Product Name', 'Price (CAD)', 'Category', 'Description', 'Stock Quantity'],
      ['Example Product 1', '29.99', 'Electronics', 'High-quality electronic device', '50'],
      ['Example Product 2', '15.50', 'Home & Garden', 'Durable garden tool', '25'],
    ];
    
    // Simple CSV download since we don't have XLSX here
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Management Documentation</h2>
          <p className="text-muted-foreground">Complete guide for bulk import processes</p>
        </div>
        <Button onClick={downloadTemplate} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Tabs defaultValue="format" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="format">Excel Format</TabsTrigger>
          <TabsTrigger value="process">Import Process</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          <TabsTrigger value="practices">Best Practices</TabsTrigger>
          <TabsTrigger value="exchange">Exchange Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="format" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Excel File Format Protocol
              </CardTitle>
              <CardDescription>
                Follow these exact specifications for 100% successful bulk imports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Critical:</strong> All formatting rules must be followed exactly for successful imports.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Column Layout (A-E)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <Badge variant="outline">A: Product Name</Badge>
                    <Badge variant="outline">B: Price (CAD)</Badge>
                    <Badge variant="outline">C: Category</Badge>
                    <Badge variant="outline">D: Description</Badge>
                    <Badge variant="outline">E: Stock Quantity</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Row Structure</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Row 1:</strong> Title/Header (optional)</li>
                    <li><strong>Row 2:</strong> Empty (reserved for formatting)</li>
                    <li><strong>Row 3:</strong> Column headers</li>
                    <li><strong>Row 4+:</strong> Product data (starts here)</li>
                  </ul>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="formatting-rules">
                    <AccordionTrigger>Critical Formatting Rules</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div>
                        <h5 className="font-medium">Product Names</h5>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>No special characters: @#$%^&*</li>
                          <li>Avoid quotes unless part of official name</li>
                          <li>Maximum 100 characters</li>
                          <li>Use standard alphanumeric + spaces, hyphens, periods</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium">Pricing</h5>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Format: 29.99 (no currency symbols)</li>
                          <li>Use period for decimal separator</li>
                          <li>Maximum 2 decimal places</li>
                          <li>No commas in numbers</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium">Categories</h5>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Use existing categories when possible</li>
                          <li>New categories will be created automatically</li>
                          <li>Use title case: "Home & Garden"</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="image-embedding">
                    <AccordionTrigger className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Image Embedding Guidelines
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Images must be embedded in Excel, not linked externally.
                        </AlertDescription>
                      </Alert>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li><strong>Start Position:</strong> Images must begin at Row 3 (same as data)</li>
                        <li><strong>Column Placement:</strong> Any column F and beyond</li>
                        <li><strong>Sequential Order:</strong> Images align with product rows in order</li>
                        <li><strong>File Types:</strong> JPG, PNG, WebP supported</li>
                        <li><strong>Size Limit:</strong> Max 5MB per image</li>
                        <li><strong>Dimensions:</strong> Recommended 800x600px minimum</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Import Process</CardTitle>
              <CardDescription>Follow this workflow for reliable bulk imports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Prepare Excel File",
                    description: "Format data according to protocol",
                    details: ["Use A-E column layout", "Start data at Row 3", "Embed images sequentially"]
                  },
                  {
                    step: 2,
                    title: "Pre-Import Validation", 
                    description: "Check file before upload",
                    details: ["Verify all required columns", "Check pricing format", "Confirm image embedding"]
                  },
                  {
                    step: 3,
                    title: "Clear Previous Cache",
                    description: "Clean old import data",
                    details: ["Click 'Clear Cached Images'", "Confirm deletion", "Wait for completion"]
                  },
                  {
                    step: 4,
                    title: "Upload & Process",
                    description: "Import your file",
                    details: ["Select Excel file", "Wait for processing", "Review import preview"]
                  },
                  {
                    step: 5,
                    title: "Review & Confirm",
                    description: "Validate before saving",
                    details: ["Check product details", "Verify image matching", "Confirm import"]
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {item.details.map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Troubleshooting Guide
              </CardTitle>
              <CardDescription>Common issues and their solutions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="import-fails">
                  <AccordionTrigger>Import Completely Fails</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm"><strong>Causes:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Data doesn't start at Row 3</li>
                      <li>Missing required columns (A-E)</li>
                      <li>Invalid Excel format</li>
                    </ul>
                    <p className="text-sm"><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Ensure headers are in Row 3</li>
                      <li>Check all columns A-E are present</li>
                      <li>Save as .xlsx format</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="images-missing">
                  <AccordionTrigger>Images Not Importing</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm"><strong>Causes:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Images not embedded properly</li>
                      <li>Images don't start at Row 3</li>
                      <li>File size too large</li>
                    </ul>
                    <p className="text-sm"><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Copy/paste images into Excel (don't insert)</li>
                      <li>Align first image with Row 3</li>
                      <li>Compress images under 5MB</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pricing-errors">
                  <AccordionTrigger>Pricing Format Errors</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm"><strong>Causes:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Currency symbols in price</li>
                      <li>Comma separators in numbers</li>
                      <li>More than 2 decimal places</li>
                    </ul>
                    <p className="text-sm"><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Use format: 29.99 (no $ symbol)</li>
                      <li>Replace commas with periods</li>
                      <li>Round to 2 decimal places</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="partial-import">
                  <AccordionTrigger>Only Some Products Import</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm"><strong>Causes:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Empty rows in data</li>
                      <li>Invalid characters in names</li>
                      <li>Missing required fields</li>
                    </ul>
                    <p className="text-sm"><strong>Solutions:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Remove empty rows between products</li>
                      <li>Clean special characters from names</li>
                      <li>Fill all required columns</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Best Practices
              </CardTitle>
              <CardDescription>Tips for efficient bulk imports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">File Preparation</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Start with small test batches (10-20 products)</li>
                    <li>Use consistent naming conventions</li>
                    <li>Keep backup copies of your original file</li>
                    <li>Optimize images before embedding (800x600px recommended)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Import Workflow</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Always clear cached images between imports</li>
                    <li>Review preview carefully before confirming</li>
                    <li>Import during low-traffic periods</li>
                    <li>Verify inventory counts after import</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Data Quality</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Use standardized category names</li>
                    <li>Include detailed product descriptions</li>
                    <li>Set realistic stock quantities</li>
                    <li>Double-check pricing accuracy</li>
                  </ul>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Create a master template with your most common categories and formatting, then duplicate it for each new import batch.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exchange" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Exchange Rate Management
              </CardTitle>
              <CardDescription>Managing currency conversions for imports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  All prices should be entered in CAD. The system will handle conversions automatically when needed.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Current Settings</h4>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">Base Currency: <Badge>CAD</Badge></p>
                    <p className="text-sm">Display Currency: <Badge>CAD</Badge></p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Pricing Guidelines</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Enter all prices in Canadian Dollars (CAD)</li>
                    <li>Use decimal format: 29.99 (not $29.99)</li>
                    <li>Round to nearest cent (2 decimal places)</li>
                    <li>Consider tax implications for pricing strategy</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Multi-Currency Support</h4>
                  <p className="text-sm text-muted-foreground">
                    If you need to import products with prices in other currencies, convert them to CAD before uploading. 
                    Future updates may include automatic currency conversion during import.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};