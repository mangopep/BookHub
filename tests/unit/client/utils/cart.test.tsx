import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../../../../client/src/lib/cart';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../../../../client/src/lib/auth', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isAdmin: false,
  }),
}));

vi.mock('../../../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {children}
      </CartProvider>
    </QueryClientProvider>
  );
};

describe('useCart Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with empty cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.cartItems).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should add item to cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToCart({
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        price: 299,
      });
    });

    await waitFor(() => {
      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].title).toBe('Test Book');
      expect(result.current.cartItems[0].quantity).toBe(1);
    });
  });

  it('should not add duplicate item to cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const book = {
      id: '1',
      title: 'Test Book',
      author: 'Test Author',
      price: 299,
    };

    act(() => {
      result.current.addToCart(book);
    });

    await waitFor(() => {
      expect(result.current.cartItems).toHaveLength(1);
    });

    act(() => {
      result.current.addToCart(book);
    });

    await waitFor(() => {
      expect(result.current.cartItems).toHaveLength(1);
    });
  });

  it('should remove item from cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToCart({
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        price: 299,
      });
    });

    await waitFor(() => {
      expect(result.current.cartItems).toHaveLength(1);
    });

    act(() => {
      result.current.removeFromCart('1');
    });

    await waitFor(() => {
      expect(result.current.cartItems).toHaveLength(0);
    });
  });

  it('should update cart item quantity', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToCart({
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        price: 299,
      });
    });

    await waitFor(() => {
      expect(result.current.cartItems).toHaveLength(1);
    });

    act(() => {
      result.current.updateQuantity('1', 5);
    });

    await waitFor(() => {
      expect(result.current.cartItems[0].quantity).toBe(5);
    });
  });

  it('should clear cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToCart({
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        price: 299,
      });
    });

    await waitFor(() => {
      expect(result.current.cartItems).toHaveLength(1);
    });

    act(() => {
      result.current.clearCart();
    });

    await waitFor(() => {
      expect(result.current.cartItems).toHaveLength(0);
    });
  });

  it('should calculate correct cart total', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addToCart({
        id: '1',
        title: 'Book 1',
        author: 'Author 1',
        price: 299,
      });
    });

    act(() => {
      result.current.addToCart({
        id: '2',
        title: 'Book 2',
        author: 'Author 2',
        price: 499,
      });
    });

    await waitFor(() => {
      const total = result.current.cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      expect(total).toBe(798);
    });
  });
});
