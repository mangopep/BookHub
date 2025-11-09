import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  coverUrl?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      localStorage.setItem("cart_data", JSON.stringify({ items: [], userId: null }));
      setCartItems([]);
    }
    
    wasAuthenticatedRef.current = isAuthenticated;
    
    const savedCartData = localStorage.getItem("cart_data");
    let localItems: CartItem[] = [];
    let localUserId: string | null = null;
    
    if (savedCartData) {
      try {
        const parsed = JSON.parse(savedCartData);
        localItems = parsed.items || [];
        localUserId = parsed.userId || null;
      } catch (error) {
        console.error("Failed to parse cart data:", error);
        localStorage.removeItem("cart_data");
      }
    }
    
    const currentUserId = user?.id || null;
    
    if (isAuthenticated && user?.cart && Array.isArray(user.cart)) {
      if (localUserId === currentUserId) {
        setCartItems(localItems);
      } else {
        const mergedCart = [...(user.cart as CartItem[])];
        localItems.forEach((localItem: CartItem) => {
          const existingIndex = mergedCart.findIndex(item => item.id === localItem.id);
          if (existingIndex >= 0) {
            mergedCart[existingIndex].quantity += localItem.quantity;
          } else {
            mergedCart.push(localItem);
          }
        });
        setCartItems(mergedCart);
        localStorage.setItem("cart_data", JSON.stringify({ items: mergedCart, userId: currentUserId }));
      }
    } else if (!isAuthenticated) {
      setCartItems(localItems);
    }
    
    if (!hasInitialized) {
      setHasInitialized(true);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, authLoading, hasInitialized]);

  useEffect(() => {
    if (!hasInitialized) return;
    
    const userId = user?.id || null;
    localStorage.setItem("cart_data", JSON.stringify({ items: cartItems, userId }));
    
    if (isAuthenticated && user) {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: cartItems }),
        credentials: "include",
      }).catch(err => console.error("Failed to sync cart:", err));
    }
  }, [cartItems, isAuthenticated, user, hasInitialized]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems((prev) => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        toast({
          title: "Already in cart",
          description: `"${item.title}" is already in your cart.`,
          duration: 1000,
        });
        return prev;
      }
      
      toast({
        title: "Added to cart",
        description: `"${item.title}" has been added to your cart.`,
        duration: 1000,
      });
      
      const newItem: CartItem = { ...item, quantity: 1 };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter(item => item.id !== id));
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart",
      duration: 1000,
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    const userId = user?.id || null;
    localStorage.setItem("cart_data", JSON.stringify({ items: [], userId }));
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
