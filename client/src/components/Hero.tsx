import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";
import heroImage from "@assets/generated_images/Warm_library_bookshelf_hero_31b4b451.png";

interface HeroProps {
  onBrowse?: () => void;
  onSearch?: () => void;
}

export function Hero({ onBrowse, onSearch }: HeroProps) {
  return (
    <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      <div className="relative h-full flex items-center justify-center text-center px-4">
        <div className="max-w-3xl space-y-6">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            Discover Your Next Great Read
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Browse thousands of books from classic literature to contemporary bestsellers.
            Find the perfect book for every moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border border-white/30 px-8"
              onClick={onBrowse}
              data-testid="button-browse-books"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Browse Books
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border-white/40 px-8"
              onClick={onSearch}
              data-testid="button-search-books"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Catalog
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
