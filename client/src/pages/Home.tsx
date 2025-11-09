import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BookCard, type Book } from "@/components/BookCard";
import { FilterPanel } from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { Library, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import type { Book as ApiBook } from "@shared/schema";
import { AdminLoginDialog } from "@/components/AdminLoginDialog";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/hooks/use-settings";
import { getSocket } from "@/lib/socket";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Section = "all" | "new" | "updated";

export default function Home() {
  const { toast } = useToast();
  const { cartItems, addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<[number, number]>([1000, 3000]);
  const [activeSection, setActiveSection] = useState<Section>("all");
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const { data: booksData = [], isLoading } = useQuery<ApiBook[]>({
    queryKey: ["/api/books"],
  });

  const { data: settings } = useSettings();

  const convertToMilliseconds = (duration: number, unit: string): number => {
    const multipliers: Record<string, number> = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      months: 30 * 24 * 60 * 60 * 1000,
    };
    return duration * (multipliers[unit] || multipliers.days);
  };

  const newArrivalMs = convertToMilliseconds(
    settings?.newArrivalDuration ?? 30,
    settings?.newArrivalUnit ?? "days"
  );
  const recentlyUpdatedMs = convertToMilliseconds(
    settings?.recentlyUpdatedDuration ?? 14,
    settings?.recentlyUpdatedUnit ?? "days"
  );

  const books: Book[] = booksData.map(book => {
    const now = new Date();
    const createdAt = new Date(book.createdAt);
    const updatedAt = new Date(book.updatedAt);
    const msSinceCreated = now.getTime() - createdAt.getTime();
    const msSinceUpdated = now.getTime() - updatedAt.getTime();
    
    const isNew = msSinceCreated <= newArrivalMs;
    const isUpdated = updatedAt.getTime() > createdAt.getTime() && msSinceUpdated <= recentlyUpdatedMs;
    
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      year: book.year,
      price: book.price,
      coverUrl: book.coverUrl ?? undefined,
      isbn: book.isbn ?? undefined,
      isNew,
      isUpdated,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    };
  }).sort((a, b) => {
    const aDate = new Date(a.updatedAt).getTime() > new Date(a.createdAt).getTime() 
      ? new Date(a.updatedAt).getTime() 
      : new Date(a.createdAt).getTime();
    const bDate = new Date(b.updatedAt).getTime() > new Date(b.createdAt).getTime() 
      ? new Date(b.updatedAt).getTime() 
      : new Date(b.createdAt).getTime();
    return bDate - aDate;
  });

  const minYear = books.length > 0 ? Math.min(...books.map(b => b.year)) : 1000;
  const maxYear = books.length > 0 ? Math.max(...books.map(b => b.year)) : 3000;

  useEffect(() => {
    if (books.length > 0) {
      setYearRange([minYear, maxYear]);
    }
  }, [books.length, minYear, maxYear]);

  useEffect(() => {
    const socket = getSocket();

    const handleBookCreated = (newBook: ApiBook) => {
      console.log('[Real-time] New book created:', newBook.title);
      
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      
      toast({
        title: 'Catalog Updated',
        description: `"${newBook.title}" by ${newBook.author} has been added to the catalog`,
        duration: 1000,
      });
    };

    const handleBookUpdated = (updatedBook: ApiBook) => {
      console.log('[Real-time] Book updated:', updatedBook.title);
      
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      
      toast({
        title: 'Book Information Updated',
        description: `"${updatedBook.title}" by ${updatedBook.author}`,
        duration: 1000,
      });
    };

    const handleBookDeleted = ({ id, title, author }: { id: string; title?: string; author?: string }) => {
      console.log('[Real-time] Book deleted:', title || id);
      
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      
      const bookInfo = title && author ? `"${title}" by ${author}` : 'A book';
      toast({
        title: 'Book Removed',
        description: `${bookInfo} is no longer available in the catalog`,
        duration: 1000,
      });
    };

    socket.on('book:created', handleBookCreated);
    socket.on('book:updated', handleBookUpdated);
    socket.on('book:deleted', handleBookDeleted);

    socket.on('reconnect', () => {
      console.log('[Real-time] Reconnected - refreshing data...');
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    });

    return () => {
      socket.off('book:created', handleBookCreated);
      socket.off('book:updated', handleBookUpdated);
      socket.off('book:deleted', handleBookDeleted);
      socket.off('reconnect');
    };
  }, [toast]);

  const genres = Array.from(new Set(books.map((b) => b.genre)));

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      !searchQuery ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      selectedGenres.length === 0 || selectedGenres.includes(book.genre);
    const matchesYear =
      book.year >= yearRange[0] && book.year <= yearRange[1];
    const matchesSection =
      activeSection === "all" ||
      (activeSection === "new" && book.isNew) ||
      (activeSection === "updated" && book.isUpdated);
    return matchesSearch && matchesGenre && matchesYear && matchesSection;
  });

  const handleAddToCart = (book: Book) => {
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      coverUrl: book.coverUrl,
    });
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setYearRange([minYear, maxYear]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setTimeout(() => {
        const catalogSection = document.getElementById("catalog-section");
        catalogSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemCount={cartItems.length} 
        onSearch={handleSearch} 
        onAdminClick={() => setShowAdminLogin(true)}
        onSearchClick={() => {
          const catalogSection = document.getElementById("catalog-section");
          catalogSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
      <AdminLoginDialog open={showAdminLogin} onOpenChange={setShowAdminLogin} />
      <Hero
        onBrowse={() => {
          const catalogSection = document.getElementById("catalog-section");
          catalogSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onSearch={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => {
            const searchInput = document.querySelector<HTMLInputElement>("[data-testid='input-search']");
            searchInput?.focus();
            searchInput?.select();
          }, 500);
        }}
      />

      <div className="container mx-auto px-4 py-8" id="catalog-section">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="lg:col-span-1">
            <div className="sticky top-20">
              <FilterPanel
                genres={genres}
                selectedGenres={selectedGenres}
                onGenreChange={setSelectedGenres}
                yearRange={yearRange}
                onYearRangeChange={setYearRange}
                onClear={handleClearFilters}
              />
            </div>
          </aside>

          <main className="lg:col-span-1">
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Button
                  variant={activeSection === "all" ? "default" : "outline"}
                  onClick={() => setActiveSection("all")}
                  data-testid="button-section-all"
                  className="flex items-center gap-2"
                >
                  <Library className="w-4 h-4" />
                  All Books
                </Button>
                <Button
                  variant={activeSection === "new" ? "default" : "outline"}
                  onClick={() => setActiveSection("new")}
                  data-testid="button-section-new"
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  New Arrivals
                </Button>
                <Button
                  variant={activeSection === "updated" ? "default" : "outline"}
                  onClick={() => setActiveSection("updated")}
                  data-testid="button-section-updated"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recently Updated
                </Button>
              </div>

              <div>
                <h2 className="text-2xl font-serif font-bold">
                  {searchQuery 
                    ? `Search results for "${searchQuery}"` 
                    : activeSection === "new" 
                      ? "New Arrivals" 
                      : activeSection === "updated" 
                        ? "Recently Updated" 
                        : "All Books"}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"} found
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No books found matching your filters.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    handleClearFilters();
                    setActiveSection("all");
                  }}
                  data-testid="button-clear-filters-empty"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
