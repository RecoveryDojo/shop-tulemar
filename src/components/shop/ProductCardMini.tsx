import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { Plus } from 'lucide-react';
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

interface ProductCardMiniProps {
  product: Product;
}

export function ProductCardMini({ product }: ProductCardMiniProps) {
  const [quantity, setQuantity] = useState(0);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAdd = () => {
    if (quantity === 0) {
      setQuantity(1);
      addToCart(product, 1);
      toast({
        title: "Added to cart",
        description: `${product.name} added`,
      });
    } else {
      setQuantity(prev => prev + 1);
      addToCart(product, 1);
    }
  };

  return (
    <Card className="group overflow-hidden border-border hover:shadow-md transition-all">
      <div className="relative aspect-[3/4]">
        <LazyImage
          src={getProductImage(product)}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className="text-lg font-bold mb-1">
            {formatCurrency(product.price)}
          </div>
          <h3 className="font-medium text-sm line-clamp-2 mb-2">
            {product.name}
          </h3>
          
          <Button
            onClick={handleAdd}
            size="sm"
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            {quantity === 0 ? 'Add' : `${quantity} in cart`}
          </Button>
        </div>
      </div>
    </Card>
  );
}
