import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/lazy-image';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';

const getProductImage = (product: Product): string => {
  if (product.image_url && product.image_url.trim() !== '') {
    return product.image_url;
  }
  
  const categoryImages: Record<string, string> = {
    'fresh-produce': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop',
    'coffee-beverages': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
    'fresh-seafood': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
    'meat-poultry': 'https://images.unsplash.com/photo-1588347818481-ca5ad9039cea?w=400&h=400&fit=crop',
    'bakery-grains': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    'wines-spirits': 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop',
  };
  
  return categoryImages[product.category_id] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop';
};

interface ProductCardLargeProps {
  product: Product;
}

export function ProductCardLarge({ product }: ProductCardLargeProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} added to your cart`,
    });
    setQuantity(1);
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <Card className="group hover:shadow-elegant transition-all duration-300 border-border">
      <CardContent className="p-6">
        <div className="aspect-square bg-muted rounded-xl mb-4 overflow-hidden">
          <LazyImage
            src={getProductImage(product)}
            alt={`${product.name} - ${product.description || 'Product image'}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-foreground text-lg leading-tight">
              {product.name}
            </h3>
            <Badge variant="outline" className="shrink-0">
              {product.unit}
            </Badge>
          </div>
          
          {product.description && (
            <p className="text-muted-foreground text-base line-clamp-3">
              {product.description}
            </p>
          )}
          
          {product.origin && (
            <p className="text-sm text-primary font-medium">
              Origin: {product.origin}
            </p>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            
            <div className="flex items-center border border-border rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-3 text-base font-medium min-w-[2.5rem] text-center">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={incrementQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <Button 
          onClick={handleAddToCart} 
          className="w-full h-12 bg-gradient-tropical hover:opacity-90 text-white text-base font-semibold"
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
