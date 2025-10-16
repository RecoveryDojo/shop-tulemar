import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/lazy-image';
import { QuantityPicker } from './QuantityPicker';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileProductCardProps {
  name: string;
  imageUrl?: string;
  quantity: number;
  pickedQuantity: number;
  unit?: string;
  shoppingStatus?: string;
  onQuantityChange: (qty: number) => void;
  onMarkFound: () => void;
  disabled?: boolean;
}

export function MobileProductCard({
  name,
  imageUrl,
  quantity,
  pickedQuantity,
  unit,
  shoppingStatus,
  onQuantityChange,
  onMarkFound,
  disabled = false
}: MobileProductCardProps) {
  const isComplete = pickedQuantity >= quantity && quantity > 0;
  const isPending = pickedQuantity === 0 || !shoppingStatus;
  const needsAttention = shoppingStatus === 'substitution_needed';

  return (
    <Card className="overflow-hidden touch-manipulation">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0">
          {/* Product Image */}
          <div className="relative h-48 md:h-full bg-muted">
            <LazyImage
              src={imageUrl || ''}
              alt={name}
              className="w-full h-full"
              fallbackSrc="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop"
              loading="eager"
            />
            
            {/* Status Badge Overlay */}
            <div className="absolute top-3 right-3">
              {isComplete && (
                <Badge className="bg-primary text-primary-foreground shadow-lg">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Found
                </Badge>
              )}
              {needsAttention && (
                <Badge variant="destructive" className="shadow-lg">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Issue
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info & Actions */}
          <div className="p-6 space-y-4">
            {/* Product Name */}
            <div>
              <h3 className="text-2xl font-bold leading-tight">
                {name}
              </h3>
              {unit && (
                <p className="text-base text-muted-foreground mt-1">
                  Unit: {unit}
                </p>
              )}
            </div>

            {/* Quantity Picker */}
            <QuantityPicker
              quantity={quantity}
              pickedQuantity={pickedQuantity}
              onQuantityChange={onQuantityChange}
              onMarkFound={onMarkFound}
              disabled={disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
