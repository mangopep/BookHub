import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { format } from "date-fns";

export default function Orders() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [cartCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: user?.role === 'admin' ? ['/api/orders'] : ['/api/orders/me'],
    enabled: isAuthenticated,
  });

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cartCount} />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Link href="/">
          <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 cursor-pointer" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to store
          </div>
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">
              View and track your order history
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start browsing our collection to place your first order
                </p>
                <Link href="/">
                  <span className="text-primary hover:underline cursor-pointer">
                    Browse books
                  </span>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-base font-semibold">
                        Order {order.orderNumber}
                      </CardTitle>
                      <Badge variant={getStatusVariant(order.status)} data-testid={`badge-order-status-${order.id}`}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Customer</div>
                        <div className="font-medium" data-testid={`text-customer-${order.id}`}>
                          {order.customerName}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Date</div>
                        <div className="font-medium" data-testid={`text-date-${order.id}`}>
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Book</div>
                        <div className="font-medium" data-testid={`text-book-${order.id}`}>
                          {order.bookTitle}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Amount</div>
                        <div className="font-medium" data-testid={`text-amount-${order.id}`}>
                          ₹{order.amount}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
