import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Sparkles, RefreshCw } from "lucide-react";

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  year: number;
  price: number;
  coverUrl?: string;
  isbn?: string;
  isNew?: boolean;
  isUpdated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BookCardProps {
  book: Book;
  onAddToCart?: (book: Book) => void;
}

export function BookCard({ book, onAddToCart }: BookCardProps) {
  const handleCardClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Card className="overflow-visible hover-elevate group border-0 shadow-sm flex flex-col" data-testid={`card-book-${book.id}`}>
      <Link href={`/book/${book.id}`} className="block" onClick={handleCardClick}>
        <div className="aspect-[3/4] overflow-hidden rounded-t-md bg-muted cursor-pointer relative" data-testid={`link-book-${book.id}`}>
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              data-testid={`img-book-cover-${book.id}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-xs sm:text-sm">No cover</span>
            </div>
          )}
          {book.isNew && (
            <Badge 
              className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-primary text-primary-foreground shadow-md pointer-events-none text-xs"
              data-testid={`badge-new-${book.id}`}
            >
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">New Arrival</span>
              <span className="sm:hidden">New</span>
            </Badge>
          )}
          {book.isUpdated && !book.isNew && (
            <Badge 
              className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-blue-600 text-white shadow-md pointer-events-none text-xs"
              data-testid={`badge-updated-${book.id}`}
            >
              <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Updated</span>
              <span className="sm:hidden">New</span>
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2 flex-1 flex flex-col">
        <div className="space-y-0.5 flex-1">
          <Link href={`/book/${book.id}`} className="block" data-testid={`link-book-title-${book.id}`} onClick={handleCardClick}>
            <h3 className="font-serif font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors cursor-pointer">
              {book.title}
            </h3>
          </Link>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1" data-testid={`text-author-${book.id}`}>
            {book.author}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs" data-testid={`badge-genre-${book.id}`}>
            {book.genre}
          </Badge>
          <span className="text-xs text-muted-foreground">{book.year}</span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-base sm:text-lg font-bold text-foreground" data-testid={`text-price-${book.id}`}>
            ₹{book.price}
          </span>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(book);
            }}
            data-testid={`button-add-cart-${book.id}`}
            className="text-xs sm:text-sm"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
