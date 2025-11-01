import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category_id: string;
  unit: string;
  origin?: string;
  stock_quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export const useProducts = (options?: { includeTest?: boolean; autoLoad?: boolean }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error loading categories",
        description: "Failed to load product categories. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async (categoryId?: string) => {
    try {
      // Set appropriate loading state
      if (categoryId) {
        setCategoryLoading(true);
      }
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (!options?.includeTest) {
        query = query.eq('is_test_product', false);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Sort by price (low to high) instead of alphabetical - more logical for shopping
      query = query.order('price', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      // Always set products state, even if empty
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Clear products on error
      toast({
        title: "Error loading products",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (categoryId) {
        setCategoryLoading(false);
      }
    }
  };

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    try {
      await fetchProducts();
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductsByCategory = useCallback(async (categoryId: string) => {
    setCategoryLoading(true);
    try {
      console.log('Fetching products for category:', categoryId);
      await fetchProducts(categoryId);
      console.log('Products loaded for category:', categoryId, products.length);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  const searchProducts = async (query: string) => {
    setSearchLoading(true);
    try {
      let queryBuilder = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`);

      if (!options?.includeTest) {
        queryBuilder = queryBuilder.eq('is_test_product', false);
      }

      const { data, error } = await queryBuilder.order('price', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]); // Clear products on error
      toast({
        title: "Search error",
        description: "Failed to search products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const getProductById = async (productId: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  };

  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.find(cat => cat.id === categoryId);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCategories();
      // Only auto-load products if autoLoad is not explicitly set to false
      if (options?.autoLoad !== false) {
        await fetchAllProducts();
      }
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    products,
    categories,
    loading,
    searchLoading,
    categoryLoading,
    fetchAllProducts,
    fetchProductsByCategory,
    searchProducts,
    getProductById,
    getCategoryById,
    refetch: async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchAllProducts()]);
      setLoading(false);
    }
  };
};