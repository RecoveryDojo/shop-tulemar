import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Trash2, Download, Eye, Check, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DuplicateResolutionDialog } from './DuplicateResolutionDialog';

interface ImportJob {
  id: string;
  source_filename: string;
  status: string;
  created_at: string;
  stats_total_rows: number;
  stats_valid_rows: number;
  stats_error_rows: number;
  file_hash?: string;
}

interface ImportItem {
  id: string;
  job_id: string;
  name: string;
  category_id: string;
  price: number;
  status: string;
  errors: string[];
  row_index: number;
}

interface DuplicateProduct {
  import_item: ImportItem;
  existing_product?: any;
  duplicate_type: 'exact' | 'similar' | 'none';
  similarity_score?: number;
}

const ImportJobManager = () => {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicates, setDuplicates] = useState<DuplicateProduct[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchImportJobs();
  }, []);

  const fetchImportJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImportJobs(data || []);
    } catch (error) {
      console.error('Error fetching import jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load import jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchImportItems = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('import_items')
        .select('*')
        .eq('job_id', jobId)
        .order('row_index');

      if (error) throw error;
      setImportItems(data || []);
      setSelectedJob(jobId);
    } catch (error) {
      console.error('Error fetching import items:', error);
      toast({
        title: "Error",
        description: "Failed to load import items",
        variant: "destructive",
      });
    }
  };

  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const checkForDuplicateJob = async (fileHash: string, filename: string): Promise<ImportJob | null> => {
    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .or(`file_hash.eq.${fileHash},source_filename.eq.${filename}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
  };

  const detectDuplicates = async (items: ImportItem[]): Promise<DuplicateProduct[]> => {
    const readyItems = items.filter(item => item.status === 'suggested' || item.status === 'validated');
    const duplicates: DuplicateProduct[] = [];

    // Check against existing products
    for (const item of readyItems) {
      if (!item.name || !item.category_id) continue;

      const { data: existingProducts } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', item.category_id)
        .eq('is_active', true);

      if (existingProducts) {
        const exactMatch = existingProducts.find(p => 
          p.name.toLowerCase() === item.name.toLowerCase()
        );

        if (exactMatch) {
          duplicates.push({
            import_item: item,
            existing_product: exactMatch,
            duplicate_type: 'exact',
            similarity_score: 100
          });
        } else {
          // Check for similar names (fuzzy matching)
          const similarMatch = existingProducts.find(p => {
            const similarity = calculateSimilarity(p.name.toLowerCase(), item.name.toLowerCase());
            return similarity > 80;
          });

          if (similarMatch) {
            duplicates.push({
              import_item: item,
              existing_product: similarMatch,
              duplicate_type: 'similar',
              similarity_score: calculateSimilarity(similarMatch.name.toLowerCase(), item.name.toLowerCase())
            });
          }
        }
      }
    }

    return duplicates;
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = levenshteinDistance(longer, shorter);
    return ((longer.length - editDistance) / longer.length) * 100;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const publishProducts = async (jobId: string) => {
    setIsPublishing(true);

    try {
      // First get all ready items
      const { data: items, error: itemsError } = await supabase
        .from('import_items')
        .select('*')
        .eq('job_id', jobId)
        .in('status', ['suggested', 'validated']);

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        toast({
          title: "No Items to Publish",
          description: "No validated or suggested items found in this job.",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicates
      const duplicatesList = await detectDuplicates(items);
      
      if (duplicatesList.length > 0) {
        setDuplicates(duplicatesList);
        setShowDuplicateDialog(true);
        return;
      }

      // Proceed with publishing if no duplicates
      await publishItemsToProducts(items);

    } catch (error) {
      console.error('Error publishing products:', error);
      toast({
        title: "Publishing Failed",
        description: "Failed to publish products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const publishItemsToProducts = async (items: ImportItem[]) => {
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        // Insert as test product by default
        const { error } = await supabase
          .from('products')
          .insert({
            name: item.name,
            description: item.name, // Will be improved with description field
            price: item.price,
            category_id: item.category_id,
            unit: 'each', // Default unit
            stock_quantity: 10,
            is_active: true,
            is_test_product: true // Mark as test product
          });

        if (error) throw error;

        // Update import item status
        await supabase
          .from('import_items')
          .update({ status: 'published' })
          .eq('id', item.id);

        successCount++;
      } catch (error: any) {
        console.error('Error publishing item:', error);
        
        // Update import item with error
        await supabase
          .from('import_items')
          .update({ 
            status: 'error',
            errors: [...(item.errors || []), error.message]
          })
          .eq('id', item.id);

        errorCount++;
      }
    }

    toast({
      title: "Publishing Complete",
      description: `${successCount} products published as test products${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    // Refresh items for selected job
    if (selectedJob) {
      fetchImportItems(selectedJob);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      // Delete import items first
      await supabase
        .from('import_items')
        .delete()
        .eq('job_id', jobId);

      // Delete import job
      await supabase
        .from('import_jobs')
        .delete()
        .eq('id', jobId);

      toast({
        title: "Job Deleted",
        description: "Import job and all its items have been deleted.",
      });

      // Refresh jobs list
      fetchImportJobs();

      // Clear selected job if it was deleted
      if (selectedJob === jobId) {
        setSelectedJob(null);
        setImportItems([]);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete import job.",
        variant: "destructive",
      });
    }
  };

  const retryFailedItems = async (jobId: string) => {
    try {
      await supabase
        .from('import_items')
        .update({ status: 'pending' })
        .eq('job_id', jobId)
        .eq('status', 'error');

      toast({
        title: "Items Reset",
        description: "Failed items have been reset to pending status.",
      });

      if (selectedJob === jobId) {
        fetchImportItems(jobId);
      }
    } catch (error) {
      console.error('Error retrying items:', error);
      toast({
        title: "Retry Failed",
        description: "Failed to reset error items.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'suggested':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">AI Suggested</Badge>;
      case 'validated':
        return <Badge variant="default" className="bg-green-100 text-green-800">Validated</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'published':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Published</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
        return <Badge variant="secondary">Created</Badge>;
      case 'processing':
        return <Badge variant="outline">Processing</Badge>;
      case 'processed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Processed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return <div className="p-6">Loading import jobs...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Import Job Manager
          </CardTitle>
          <CardDescription>
            Manage your bulk upload jobs and publish products to your store
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Import Jobs</TabsTrigger>
          <TabsTrigger value="current" disabled={!selectedJob}>Current Upload</TabsTrigger>
          <TabsTrigger value="publish">Publish Products</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Jobs History</CardTitle>
              <CardDescription>
                All your import jobs and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Rows</TableHead>
                    <TableHead>Valid/Error</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.source_filename}</TableCell>
                      <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                      <TableCell>{job.stats_total_rows}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {job.stats_valid_rows} valid
                          </Badge>
                          {job.stats_error_rows > 0 && (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              {job.stats_error_rows} errors
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fetchImportItems(job.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {job.stats_error_rows > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryFailedItems(job.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteJob(job.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          {selectedJob && (
            <Card>
              <CardHeader>
                <CardTitle>Current Upload Items</CardTitle>
                <CardDescription>
                  Items from the selected import job
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.row_index}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category_id}</TableCell>
                        <TableCell>${item.price?.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          {item.errors && item.errors.length > 0 && (
                            <div className="text-sm text-red-600">
                              {item.errors.join(', ')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="publish" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publish Products</CardTitle>
              <CardDescription>
                Publish validated items from import jobs to your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {importJobs.map((job) => {
                const hasValidItems = job.stats_valid_rows > 0;
                return (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{job.source_filename}</h3>
                      <p className="text-sm text-muted-foreground">
                        {job.stats_valid_rows} valid items ready to publish
                      </p>
                    </div>
                    <Button
                      disabled={!hasValidItems || isPublishing}
                      onClick={() => publishProducts(job.id)}
                    >
                      {isPublishing ? 'Publishing...' : 'Publish Products'}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DuplicateResolutionDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        duplicates={duplicates}
        onResolve={async (resolutions) => {
          // Process resolutions and publish
          const itemsToPublish = resolutions
            .filter(r => r.action === 'publish' || r.action === 'update')
            .map(r => r.duplicate.import_item);
          
          if (itemsToPublish.length > 0) {
            await publishItemsToProducts(itemsToPublish);
          }

          setShowDuplicateDialog(false);
          setDuplicates([]);
        }}
      />
    </div>
  );
};

export default ImportJobManager;