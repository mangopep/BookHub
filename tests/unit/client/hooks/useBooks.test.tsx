import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Books Query Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use correct query key for books list', async () => {
    const mockBooks = [
      { id: '1', title: 'Book 1', author: 'Author 1', price: 299 },
      { id: '2', title: 'Book 2', author: 'Author 2', price: 399 },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooks,
    });

    const { result } = renderHook(
      () => useQuery({ 
        queryKey: ['/api/books'],
        queryFn: async ({ queryKey }) => {
          const response = await fetch(queryKey[0] as string);
          if (!response.ok) throw new Error('Network error');
          return response.json();
        }
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual(mockBooks);
    expect(global.fetch).toHaveBeenCalledWith('/api/books');
  });

  it('should use correct query key for single book', async () => {
    const mockBook = {
      id: '123',
      title: 'Test Book',
      author: 'Test Author',
      genre: 'Fiction',
      year: 2024,
      price: 299,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBook,
    });

    const bookId = '123';
    const { result } = renderHook(
      () => useQuery({ 
        queryKey: ['/api/books', bookId],
        queryFn: async ({ queryKey }) => {
          const [base, id] = queryKey;
          const response = await fetch(`${base}/${id}`);
          if (!response.ok) throw new Error('Network error');
          return response.json();
        }
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual(mockBook);
    expect(global.fetch).toHaveBeenCalledWith('/api/books/123');
  });

  it('should handle network errors correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(
      () => useQuery({ 
        queryKey: ['/api/books'],
        queryFn: async ({ queryKey }) => {
          const response = await fetch(queryKey[0] as string);
          if (!response.ok) throw new Error('Failed to fetch');
          return response.json();
        }
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('should handle empty books list', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(
      () => useQuery({ 
        queryKey: ['/api/books'],
        queryFn: async ({ queryKey }) => {
          const response = await fetch(queryKey[0] as string);
          if (!response.ok) throw new Error('Network error');
          return response.json();
        }
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual([]);
  });

  it('should properly type book data', async () => {
    const mockBooks = [
      { 
        id: '1', 
        title: 'Book 1', 
        author: 'Author 1', 
        genre: 'Fiction',
        year: 2024,
        price: 299,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooks,
    });

    const { result } = renderHook(
      () => useQuery({ 
        queryKey: ['/api/books'],
        queryFn: async ({ queryKey }) => {
          const response = await fetch(queryKey[0] as string);
          if (!response.ok) throw new Error('Network error');
          return response.json();
        }
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    const books = result.current.data;
    expect(books[0]).toHaveProperty('id');
    expect(books[0]).toHaveProperty('title');
    expect(books[0]).toHaveProperty('author');
    expect(books[0]).toHaveProperty('genre');
    expect(books[0]).toHaveProperty('price');
  });
});
