import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookCard, type Book } from '../../../../client/src/components/BookCard';

describe('BookCard Component', () => {
  const mockBook: Book = {
    id: '1',
    title: 'Test Book',
    author: 'Test Author',
    genre: 'Fiction',
    year: 2024,
    price: 299,
    coverUrl: 'https://example.com/cover.jpg',
    isNew: true,
    isUpdated: false,
  };

  const mockOnAddToCart = vi.fn();

  it('should render book information', () => {
    render(<BookCard book={mockBook} onAddToCart={mockOnAddToCart} />);
    
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('₹299')).toBeInTheDocument();
  });

  it('should call onAddToCart when Add to Cart button is clicked', () => {
    render(<BookCard book={mockBook} onAddToCart={mockOnAddToCart} />);
    
    const addButton = screen.getByTestId('button-add-cart-1');
    fireEvent.click(addButton);
    
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockBook);
  });

  it('should show "New Arrival" badge for new books', () => {
    render(<BookCard book={mockBook} onAddToCart={mockOnAddToCart} />);
    
    const badge = screen.getByTestId('badge-new-1');
    expect(badge).toBeInTheDocument();
  });

  it('should show "Updated" badge for updated books', () => {
    const updatedBook = { ...mockBook, isNew: false, isUpdated: true };
    render(<BookCard book={updatedBook} onAddToCart={mockOnAddToCart} />);
    
    const badge = screen.getByTestId('badge-updated-1');
    expect(badge).toBeInTheDocument();
  });

  it('should display book cover image when coverUrl is provided', () => {
    render(<BookCard book={mockBook} onAddToCart={mockOnAddToCart} />);
    
    const img = screen.getByTestId('img-book-cover-1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('should display "No cover" text when coverUrl is not provided', () => {
    const bookWithoutCover = { ...mockBook, coverUrl: undefined };
    render(<BookCard book={bookWithoutCover} onAddToCart={mockOnAddToCart} />);
    
    expect(screen.getByText('No cover')).toBeInTheDocument();
  });

  it('should render card with correct test id', () => {
    render(<BookCard book={mockBook} onAddToCart={mockOnAddToCart} />);
    
    const card = screen.getByTestId('card-book-1');
    expect(card).toBeInTheDocument();
  });

  it('should have a link to book details page', () => {
    render(<BookCard book={mockBook} onAddToCart={mockOnAddToCart} />);
    
    const link = screen.getByTestId('link-book-1');
    expect(link).toBeInTheDocument();
  });

  it('should display genre information', () => {
    render(<BookCard book={mockBook} onAddToCart={mockOnAddToCart} />);
    
    expect(screen.getByText('Fiction')).toBeInTheDocument();
  });

  it('should not call onAddToCart when onAddToCart is not provided', () => {
    const localMock = vi.fn();
    render(<BookCard book={mockBook} onAddToCart={undefined} />);
    
    const addButton = screen.getByTestId('button-add-cart-1');
    fireEvent.click(addButton);
    
    expect(localMock).not.toHaveBeenCalled();
  });
});
