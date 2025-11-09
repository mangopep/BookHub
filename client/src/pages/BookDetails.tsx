import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, Loader2 } from "lucide-react";
import { BookCard, type Book } from "@/components/BookCard";
import type { Book as ApiBook } from "@shared/schema";
import { useCart } from "@/lib/cart";

export default function BookDetails() {
  const [, params] = useRoute("/book/:id");
  const { cartItems, addToCart } = useCart();
  const bookId = params?.id;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [bookId]);

  const { data: book, isLoading: bookLoading, error: bookError } = useQuery<ApiBook>({
    queryKey: ["/api/books", bookId],
    enabled: !!bookId,
  });

  const { data: allBooks = [] } = useQuery<ApiBook[]>({
    queryKey: ["/api/books"],
  });

  const relatedBooks: Book[] = allBooks
    .filter((b) => b.id !== bookId && b.genre === book?.genre)
    .slice(0, 4)
    .map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      genre: b.genre,
      year: b.year,
      price: b.price,
      coverUrl: b.coverUrl ?? undefined,
      isbn: b.isbn ?? undefined,
    }));

  const handleAddToCart = () => {
    if (!book) return;
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      coverUrl: book.coverUrl ?? undefined,
    });
  };

  if (!bookId || bookError || (book === null && !bookLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={cartItems.length} />
        <div className="container mx-auto px-4 py-16">
          <Link href="/">
            <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Back to catalog
            </div>
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Book Not Found</h1>
            <p className="text-muted-foreground">The book you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  if (bookLoading || !book) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemCount={cartItems.length} />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cartItems.length} />

      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 cursor-pointer" data-testid="link-back">
            <ArrowLeft className="w-4 h-4" />
            Back to catalog
          </div>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex justify-center lg:justify-start">
            <div className="aspect-[2/3] w-full max-w-sm lg:max-w-md bg-muted rounded-md overflow-hidden">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  data-testid="img-book-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No cover available
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" data-testid="text-book-title">
                {book.title}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-4" data-testid="text-book-author">
                by {book.author}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" data-testid="badge-genre">
                  {book.genre}
                </Badge>
                <span className="text-sm text-muted-foreground" data-testid="text-year">
                  Published {book.year}
                </span>
                {book.isbn && (
                  <span className="text-sm text-muted-foreground" data-testid="text-isbn">
                    ISBN: {book.isbn}
                  </span>
                )}
              </div>
            </div>

            <Card className="p-4 sm:p-6 border-0 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-price">
                    ₹{book.price}
                  </span>
                  <span className="text-sm text-muted-foreground">INR</span>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleAddToCart}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Free shipping on orders over ₹999
                </p>
              </div>
            </Card>

            {book.description && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3">About this book</h2>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base" data-testid="text-description">
                  {book.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {relatedBooks.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-serif font-bold mb-4 sm:mb-6">Related Books</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {relatedBooks.map((relatedBook) => (
                <BookCard
                  key={relatedBook.id}
                  book={relatedBook}
                  onAddToCart={() => addToCart({
                    id: relatedBook.id,
                    title: relatedBook.title,
                    author: relatedBook.author,
                    price: relatedBook.price,
                    coverUrl: relatedBook.coverUrl,
                  })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
