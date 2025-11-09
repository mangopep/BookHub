import { Link } from "wouter";
import { ShoppingCart, BookOpen, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { ConnectionStatus } from "./ConnectionStatus";

interface HeaderProps {
  cartItemCount?: number;
  onSearch?: (query: string) => void;
  onAdminClick?: () => void;
  onSearchClick?: () => void;
}

export function Header({ cartItemCount = 0, onSearch, onAdminClick, onSearchClick }: HeaderProps) {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 px-2 py-1.5 rounded-md cursor-pointer" data-testid="link-home">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-serif text-lg font-bold hidden sm:block">BookHub</span>
            </div>
          </Link>

          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search books, authors, genres..."
                className="pl-10 h-10 text-sm w-full"
                onChange={(e) => onSearch?.(e.target.value)}
                onClick={onSearchClick}
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ConnectionStatus />
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative" data-testid="link-cart">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold"
                    data-testid="badge-cart-count"
                  >
                    {cartItemCount}
                  </span>
                )}
                <span className="sr-only">Shopping cart</span>
              </Button>
            </Link>
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" data-testid="link-admin" className="hidden sm:flex">
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/profile">
                  <Button variant="ghost" size="icon" data-testid="link-profile">
                    <User className="w-5 h-5" />
                    <span className="sr-only">Profile</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  data-testid="button-admin-login" 
                  className="hidden sm:flex"
                  onClick={onAdminClick}
                >
                  Admin
                </Button>
                <Link href="/login">
                  <Button variant="outline" size="sm" data-testid="link-login">
                    Log in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search books..."
              className="pl-10 h-10 text-sm w-full"
              onChange={(e) => onSearch?.(e.target.value)}
              onClick={onSearchClick}
              data-testid="input-search-mobile"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
