import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { CartItem } from "@/components/CartItem";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleQuantityChange = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    
    const checkoutData = {
      items: cartItems,
      subtotal,
      shipping,
      tax,
      total,
    };
    
    localStorage.setItem("checkout_cart", JSON.stringify(checkoutData));
    setLocation("/checkout");
  };
  
  const handleAuthSuccess = () => {
    const checkoutData = {
      items: cartItems,
      subtotal,
      shipping,
      tax,
      total,
    };
    
    localStorage.setItem("checkout_cart", JSON.stringify(checkoutData));
    
    setTimeout(() => {
      setLocation("/checkout");
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cartItems.length} />
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} onSuccess={handleAuthSuccess} />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Link href="/">
          <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 cursor-pointer" data-testid="link-continue-shopping">
            <ArrowLeft className="w-4 h-4" />
            Continue shopping
          </div>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-6 sm:mb-8" data-testid="heading-cart">
          Shopping Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Link href="/">
              <Button data-testid="link-browse">Browse Books</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  {...item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="p-4 sm:p-6 border-0 shadow-sm">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid="text-subtotal">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span data-testid="text-shipping">
                      {shipping === 0 ? "Free" : `₹${shipping}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (18%)</span>
                    <span data-testid="text-tax">₹{tax}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span className="text-foreground" data-testid="text-total">
                      ₹{total}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4 sm:mt-6"
                  size="lg"
                  onClick={handleCheckout}
                  data-testid="button-checkout"
                >
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Proceed to Checkout
                </Button>

                {subtotal < 999 && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Add ₹{999 - subtotal} more for free shipping
                  </p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
