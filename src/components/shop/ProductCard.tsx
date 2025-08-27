import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
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
    <Card className="group hover:shadow-tropical transition-all duration-300 border-border w-full max-w-full">
      <CardContent className="p-3 sm:p-4">
        <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden h-32 sm:h-40 md:h-48">
          <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-foreground line-clamp-2 text-sm sm:text-base">
              {product.name}
            </h3>
            <Badge variant="outline" className="text-xs shrink-0 ml-2">
              {product.unit}
            </Badge>
          </div>
          
          <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
            {product.description}
          </p>
          
          {product.origin && (
            <p className="text-xs text-primary font-medium">
              From: {product.origin}
            </p>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-lg sm:text-xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                  onClick={incrementQuantity}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
        <Button 
          onClick={handleAddToCart} 
          className="w-full bg-gradient-tropical hover:opacity-90 text-white border-0 text-sm sm:text-base"
          size="sm"
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}