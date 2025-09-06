import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Eye, Trash2, ToggleLeft, ToggleRight, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  is_active: boolean;
  is_test_product: boolean;
  created_at: string;
  stock_quantity: number;
}

const TestProductManager = () => {
  const [testProducts, setTestProducts] = useState<Product[]>([]);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch test products
      const { data: testData, error: testError } = await supabase
        .from('products')
        .select('*')
        .eq('is_test_product', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (testError) throw testError;

      // Fetch live products
      const { data: liveData, error: liveError } = await supabase
        .from('products')
        .select('*')
        .or('is_test_product.eq.false,is_test_product.is.null')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (liveError) throw liveError;

      setTestProducts(testData || []);
      setLiveProducts(liveData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertToLive = async (productId: string) => {
    setConverting(prev => [...prev, productId]);
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_test_product: false })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product Converted",
        description: "Product is now live in your store",
      });

      fetchProducts(); // Refresh the lists
    } catch (error) {
      console.error('Error converting product:', error);
      toast({
        title: "Conversion Failed",
        description: "Failed to convert product to live",
        variant: "destructive",
      });
    } finally {
      setConverting(prev => prev.filter(id => id !== productId));
    }
  };

  const convertToTest = async (productId: string) => {
    setConverting(prev => [...prev, productId]);
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_test_product: true })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product Converted",
        description: "Product moved to test products",
      });

      fetchProducts(); // Refresh the lists
    } catch (error) {
      console.error('Error converting product:', error);
      toast({
        title: "Conversion Failed",
        description: "Failed to convert product to test",
        variant: "destructive",
      });
    } finally {
      setConverting(prev => prev.filter(id => id !== productId));
    }
  };

  const deactivateProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product Deactivated",
        description: "Product has been removed from your store",
      });

      fetchProducts(); // Refresh the lists
    } catch (error) {
      console.error('Error deactivating product:', error);
      toast({
        title: "Deactivation Failed",
        description: "Failed to deactivate product",
        variant: "destructive",
      });
    }
  };

  const bulkConvertToLive = async (productIds: string[]) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_test_product: false })
        .in('id', productIds);

      if (error) throw error;

      toast({
        title: "Bulk Conversion Complete",
        description: `${productIds.length} products converted to live`,
      });

      fetchProducts();
    } catch (error) {
      console.error('Error in bulk conversion:', error);
      toast({
        title: "Bulk Conversion Failed",
        description: "Failed to convert products",
        variant: "destructive",
      });
    }
  };

  const bulkDeactivate = async (productIds: string[]) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .in('id', productIds);

      if (error) throw error;

      toast({
        title: "Bulk Deactivation Complete",
        description: `${productIds.length} products deactivated`,
      });

      fetchProducts();
    } catch (error) {
      console.error('Error in bulk deactivation:', error);
      toast({
        title: "Bulk Deactivation Failed",
        description: "Failed to deactivate products",
        variant: "destructive",
      });
    }
  };

  const ProductTable = ({ products, isTestMode }: { products: Product[], isTestMode: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>${product.price.toFixed(2)}</TableCell>
            <TableCell>{product.category_id}</TableCell>
            <TableCell>{product.stock_quantity}</TableCell>
            <TableCell>{new Date(product.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                {isTestMode ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => convertToLive(product.id)}
                    disabled={converting.includes(product.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Go Live
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => convertToTest(product.id)}
                    disabled={converting.includes(product.id)}
                  >
                    <ToggleLeft className="h-4 w-4 mr-1" />
                    To Test
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deactivateProduct(product.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return <div className="p-6">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Management
          </CardTitle>
          <CardDescription>
            Manage test products and live products in your store
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">
            Test Products ({testProducts.length})
          </TabsTrigger>
          <TabsTrigger value="live">
            Live Products ({liveProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Products</CardTitle>
              <CardDescription>
                Products imported from bulk uploads (not visible to customers)
              </CardDescription>
              <div className="flex gap-2">
                <Button
                  onClick={() => bulkConvertToLive(testProducts.map(p => p.id))}
                  disabled={testProducts.length === 0}
                >
                  Convert All to Live
                </Button>
                <Button
                  variant="outline"
                  onClick={() => bulkDeactivate(testProducts.map(p => p.id))}
                  disabled={testProducts.length === 0}
                >
                  Deactivate All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ProductTable products={testProducts} isTestMode={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Products</CardTitle>
              <CardDescription>
                Products visible to customers in your store
              </CardDescription>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => bulkDeactivate(liveProducts.map(p => p.id))}
                  disabled={liveProducts.length === 0}
                >
                  Unlist All Products
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ProductTable products={liveProducts} isTestMode={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestProductManager;