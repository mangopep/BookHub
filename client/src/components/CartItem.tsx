import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";

interface CartItemProps {
  id: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  coverUrl?: string;
  onQuantityChange?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
}

export function CartItem({
  id,
  title,
  author,
  price,
  quantity,
  coverUrl,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  return (
    <div className="flex gap-4 p-4 border rounded-md hover-elevate" data-testid={`cart-item-${id}`}>
      <div className="w-20 h-28 flex-shrink-0 bg-muted rounded-md overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
            data-testid={`img-cart-cover-${id}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No cover
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-serif font-semibold text-base line-clamp-2" data-testid={`text-cart-title-${id}`}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1" data-testid={`text-cart-author-${id}`}>
          {author}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => onQuantityChange?.(id, Math.max(1, quantity - 1))}
              data-testid={`button-decrease-${id}`}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center font-medium" data-testid={`text-quantity-${id}`}>
              {quantity}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => onQuantityChange?.(id, quantity + 1)}
              data-testid={`button-increase-${id}`}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          <span className="font-bold text-primary" data-testid={`text-item-total-${id}`}>
            ₹{price * quantity}
          </span>
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => onRemove?.(id)}
        data-testid={`button-remove-${id}`}
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
}
