import { Button } from '@/components/ui/button';
import { Minus, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityPickerProps {
  quantity: number;
  pickedQuantity: number;
  onQuantityChange: (qty: number) => void;
  onMarkFound: () => void;
  disabled?: boolean;
}

export function QuantityPicker({
  quantity,
  pickedQuantity,
  onQuantityChange,
  onMarkFound,
  disabled = false
}: QuantityPickerProps) {
  const progress = quantity > 0 ? (pickedQuantity / quantity) * 100 : 0;
  const isComplete = pickedQuantity >= quantity && quantity > 0;

  const handleIncrement = () => {
    if (pickedQuantity < quantity) {
      onQuantityChange(pickedQuantity + 1);
    }
  };

  const handleDecrement = () => {
    if (pickedQuantity > 0) {
      onQuantityChange(pickedQuantity - 1);
    }
  };

  return (
    <div className="space-y-3">
      {/* Large Quantity Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-12 w-12 rounded-full touch-manipulation"
          onClick={handleDecrement}
          disabled={disabled || pickedQuantity === 0}
        >
          <Minus className="h-6 w-6" />
        </Button>
        
        <div className="text-center min-w-[100px]">
          <div className="text-4xl font-bold tabular-nums">
            {pickedQuantity}
          </div>
          <div className="text-sm text-muted-foreground">
            of {quantity}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="lg"
          className="h-12 w-12 rounded-full touch-manipulation"
          onClick={handleIncrement}
          disabled={disabled || pickedQuantity >= quantity}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isComplete ? "bg-primary" : "bg-primary/60"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Mark Found Button */}
      <Button
        onClick={onMarkFound}
        disabled={disabled}
        className="w-full h-14 text-lg touch-manipulation"
        variant={isComplete ? "default" : "secondary"}
      >
        <CheckCircle2 className="mr-2 h-6 w-6" />
        Mark Found
      </Button>
    </div>
  );
}
