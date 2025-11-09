import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

const SHIPPING_INFO_KEY = "checkout_shipping_info";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartData, setCartData] = useState<any>(null);
  const [shippingInfo, setShippingInfo] = useState(() => {
    const saved = localStorage.getItem(SHIPPING_INFO_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          name: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          phone: "",
        };
      }
    }
    return {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
    };
  });

  useEffect(() => {
    localStorage.setItem(SHIPPING_INFO_KEY, JSON.stringify(shippingInfo));
  }, [shippingInfo]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue",
        variant: "destructive",
        duration: 1000,
      });
      setLocation("/login");
      return;
    }

    const storedCartData = sessionStorage.getItem("checkout_cart") || localStorage.getItem("checkout_cart");
    if (!storedCartData) {
      const cartItems = localStorage.getItem("cart_items");
      if (!cartItems) {
        toast({
          title: "No cart data",
          description: "Please add items to your cart first",
          variant: "destructive",
          duration: 1000,
        });
        setLocation("/cart");
        return;
      }
      
      try {
        const items = JSON.parse(cartItems);
        if (items.length === 0) {
          toast({
            title: "Cart is empty",
            description: "Please add items to your cart first",
            variant: "destructive",
            duration: 1000,
          });
          setLocation("/cart");
          return;
        }
        
        const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        const shipping = subtotal > 999 ? 0 : 99;
        const tax = Math.round(subtotal * 0.18);
        const total = subtotal + shipping + tax;
        
        const checkoutData = { items, subtotal, shipping, tax, total };
        localStorage.setItem("checkout_cart", JSON.stringify(checkoutData));
        setCartData(checkoutData);
      } catch (error) {
        console.error("Failed to parse cart items:", error);
        toast({
          title: "Error loading cart",
          description: "Please try again from the cart page",
          variant: "destructive",
          duration: 1000,
        });
        setLocation("/cart");
        return;
      }
    } else {
      try {
        setCartData(JSON.parse(storedCartData));
      } catch (error) {
        console.error("Failed to parse checkout data:", error);
        setLocation("/cart");
      }
    }
  }, [isAuthenticated, isLoading, setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all shipping details",
        variant: "destructive",
        duration: 1000,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const orderResponse = await apiRequest("POST", "/api/orders/create", {
        items: cartData.items,
        shippingInfo,
        amount: cartData.total,
      });

      if (orderResponse.ok) {
        const order = await orderResponse.json();
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        sessionStorage.removeItem("checkout_cart");
        localStorage.removeItem("checkout_cart");
        localStorage.removeItem(SHIPPING_INFO_KEY);
        clearCart();
        toast({
          title: "Order placed successfully!",
          description: "You will receive a confirmation email shortly.",
          duration: 1000,
        });
        setLocation(`/order-confirmation/${order.id}`);
      } else {
        throw new Error("Failed to create order");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to place order. Please try again.",
        variant: "destructive",
        duration: 1000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !cartData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-8" data-testid="heading-checkout">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={shippingInfo.name}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                        required
                        data-testid="input-shipping-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                        required
                        data-testid="input-shipping-address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                          required
                          data-testid="input-shipping-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                          required
                          data-testid="input-shipping-state"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                          required
                          data-testid="input-shipping-zip"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                          required
                          data-testid="input-shipping-phone"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Pay when you receive your order
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                  data-testid="button-place-order"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartData.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.title} × {item.quantity}
                        </span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{cartData.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{cartData.shipping === 0 ? "Free" : `₹${cartData.shipping}`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>₹{cartData.tax}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{cartData.total}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
