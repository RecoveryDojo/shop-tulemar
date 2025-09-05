import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProducts, Product } from '@/hooks/useProducts';
import BulkInventoryManager from './BulkInventoryManager';

const ProductManager = () => {
  const { products, categories, loading, refetch } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    unit: '',
    origin: '',
    image_url: '',
    stock_quantity: ''
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          description: newProduct.description || null,
          price: parseFloat(newProduct.price),
          category_id: newProduct.category_id,
          unit: newProduct.unit,
          origin: newProduct.origin || null,
          image_url: newProduct.image_url || null,
          stock_quantity: parseInt(newProduct.stock_quantity) || 0,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product created successfully!",
      });

      setNewProduct({
        name: '',
        description: '',
        price: '',
        category_id: '',
        unit: '',
        origin: '',
        image_url: '',
        stock_quantity: ''
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          category_id: editingProduct.category_id,
          unit: editingProduct.unit,
          origin: editingProduct.origin,
          image_url: editingProduct.image_url,
          stock_quantity: editingProduct.stock_quantity,
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully!",
      });

      setEditingProduct(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const ProductForm = ({ 
    product, 
    onChange, 
    onSubmit, 
    submitLabel 
  }: { 
    product: any; 
    onChange: (updates: any) => void; 
    onSubmit: (e: React.FormEvent) => void; 
    submitLabel: string;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={product.name}
            onChange={(e) => onChange({ ...product, name: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={product.price}
            onChange={(e) => onChange({ ...product, price: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={product.category_id} onValueChange={(value) => onChange({ ...product, category_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={product.unit}
            onChange={(e) => onChange({ ...product, unit: e.target.value })}
            placeholder="e.g., lb, each, bag"
            required
          />
        </div>

        <div>
          <Label htmlFor="origin">Origin (Optional)</Label>
          <Input
            id="origin"
            value={product.origin}
            onChange={(e) => onChange({ ...product, origin: e.target.value })}
            placeholder="e.g., Costa Rica"
          />
        </div>

        <div>
          <Label htmlFor="stock">Stock Quantity</Label>
          <Input
            id="stock"
            type="number"
            value={product.stock_quantity}
            onChange={(e) => onChange({ ...product, stock_quantity: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={product.description}
          onChange={(e) => onChange({ ...product, description: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="image_url">Image URL (Optional)</Label>
        <Input
          id="image_url"
          type="url"
          value={product.image_url}
          onChange={(e) => onChange({ ...product, image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );

  if (loading) {
    return <div className="flex justify-center py-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Product Management
          </h2>
          <p className="text-muted-foreground">
            Manage your store inventory and product catalog
          </p>
        </div>
      </div>

      <Tabs defaultValue="bulk" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          <TabsTrigger value="individual">Individual Products</TabsTrigger>
          <TabsTrigger value="manage">Manage Existing</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk">
          <BulkInventoryManager />
        </TabsContent>

        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
              <CardDescription>
                Create a single product manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductForm
                product={newProduct}
                onChange={setNewProduct}
                onSubmit={handleCreateProduct}
                submitLabel="Create Product"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Existing Products</CardTitle>
              <CardDescription>
                View and manage your current product inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const category = categories.find(cat => cat.id === product.category_id);
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.image_url && (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">{product.unit}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {category && (
                              <div className="flex items-center gap-1">
                                <span>{category.icon}</span>
                                <span>{category.name}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>{product.stock_quantity}</TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {editingProduct && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Product</CardTitle>
                <CardDescription>
                  Update product information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductForm
                  product={editingProduct}
                  onChange={setEditingProduct}
                  onSubmit={handleUpdateProduct}
                  submitLabel="Update Product"
                />
                <Button
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  className="mt-4"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManager;