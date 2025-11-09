import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
  };
  saleInfo?: {
    listPrice?: {
      amount: number;
      currencyCode: string;
    };
  };
}

interface ImportBooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportBooksDialog({ open, onOpenChange, onSuccess }: ImportBooksDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "success" | "error">("idle");
  const [importSuccessCount, setImportSuccessCount] = useState<number>(0);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/books/search?q=${encodeURIComponent(query)}`);
      const data = await response.json() as { items: GoogleBook[] };
      return data;
    },
    onSuccess: (data) => {
      setSearchResults(data.items || []);
      setIsSearching(false);
      if (!data.items || data.items.length === 0) {
        toast({
          title: "No results",
          description: "No books found. Try a different search term.",
          variant: "destructive",
          duration: 1000,
        });
      }
    },
    onError: () => {
      setIsSearching(false);
      toast({
        title: "Search failed",
        description: "Failed to search for books. Please try again.",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (bookIds: string[]) => {
      setImportStatus("importing");
      setImportProgress(0);
      
      const results = [];
      for (let i = 0; i < bookIds.length; i++) {
        const book = searchResults.find(b => b.id === bookIds[i]);
        if (book) {
          try {
            const response = await apiRequest("POST", "/api/books/import", {
              googleBookId: book.id,
              volumeInfo: book.volumeInfo,
              saleInfo: book.saleInfo,
            });
            const result = await response.json();
            results.push({ 
              success: true, 
              book: result,
              title: book.volumeInfo.title 
            });
          } catch (error: any) {
            const errorMessage = error?.body?.error || error?.message || "Unknown error";
            const isDuplicate = error?.status === 409 || 
                               errorMessage.includes("already exists");
            results.push({ 
              success: false, 
              error: errorMessage,
              title: book.volumeInfo.title,
              isDuplicate 
            });
          }
        }
        setImportProgress(((i + 1) / bookIds.length) * 100);
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      const duplicateCount = results.filter((r: any) => !r.success && r.isDuplicate).length;
      const realFailureCount = failCount - duplicateCount;
      
      setImportSuccessCount(successCount);
      
      if (successCount === 0 && realFailureCount > 0) {
        setImportStatus("error");
        toast({
          title: "Import failed",
          description: `Failed to import ${realFailureCount} book${realFailureCount !== 1 ? 's' : ''}${duplicateCount > 0 ? `, ${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped` : ''}`,
          variant: "destructive",
          duration: 1000,
        });
      } else if (successCount > 0 && realFailureCount > 0) {
        setImportStatus("success");
        toast({
          title: "Import completed with warnings",
          description: `Successfully imported ${successCount} book${successCount !== 1 ? 's' : ''}${duplicateCount > 0 ? `, ${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped` : ''}${realFailureCount > 0 ? `, ${realFailureCount} failed` : ''}`,
          duration: 1000,
        });
      } else {
        setImportStatus("success");
        let description = `Successfully imported ${successCount} book${successCount !== 1 ? 's' : ''}`;
        if (duplicateCount > 0) {
          description = `${successCount > 0 ? description + ', ' : ''}${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped${successCount === 0 ? ' (already in catalog)' : ''}`;
        }
        toast({
          title: "Import completed",
          description,
          duration: 1000,
        });
      }
      
      setTimeout(() => {
        if (successCount > 0) {
          onSuccess();
        }
        handleClose();
      }, 1500);
    },
    onError: () => {
      setImportStatus("error");
      toast({
        title: "Import failed",
        description: "Failed to import books. Please try again.",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a search term",
        variant: "destructive",
        duration: 1000,
      });
      return;
    }
    setIsSearching(true);
    setSearchResults([]);
    setSelectedBooks(new Set());
    searchMutation.mutate(searchQuery);
  };

  const toggleBookSelection = (bookId: string) => {
    const newSelection = new Set(selectedBooks);
    if (newSelection.has(bookId)) {
      newSelection.delete(bookId);
    } else {
      newSelection.add(bookId);
    }
    setSelectedBooks(newSelection);
  };

  const handleImport = () => {
    if (selectedBooks.size === 0) {
      toast({
        title: "No books selected",
        description: "Please select at least one book to import",
        variant: "destructive",
        duration: 1000,
      });
      return;
    }
    importMutation.mutate(Array.from(selectedBooks));
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedBooks(new Set());
    setImportProgress(0);
    setImportStatus("idle");
    setImportSuccessCount(0);
    onOpenChange(false);
  };

  const getISBN = (book: GoogleBook): string => {
    const isbn13 = book.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13');
    const isbn10 = book.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10');
    return isbn13?.identifier || isbn10?.identifier || 'N/A';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Import Books from Google Books API
          </DialogTitle>
          <DialogDescription>
            Search for books and import them into your catalog
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
                disabled={isSearching || importStatus === "importing"}
                data-testid="input-search-api-books"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || importStatus === "importing"}
              data-testid="button-search-api-books"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {importStatus === "importing" && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Importing books...</span>
                <span className="text-muted-foreground">{Math.round(importProgress)}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}

          {importStatus === "success" && (
            <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                {importSuccessCount > 0 
                  ? `Successfully imported ${importSuccessCount} book${importSuccessCount !== 1 ? 's' : ''}!`
                  : "No new books imported (duplicates skipped)"}
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto border rounded-lg">
            {searchResults.length > 0 ? (
              <div className="divide-y">
                {searchResults.map((book) => {
                  const isSelected = selectedBooks.has(book.id);
                  const year = book.volumeInfo.publishedDate
                    ? new Date(book.volumeInfo.publishedDate).getFullYear()
                    : null;

                  return (
                    <div
                      key={book.id}
                      className={`p-4 flex gap-4 hover-elevate ${
                        isSelected ? "bg-accent/50" : ""
                      }`}
                      data-testid={`book-result-${book.id}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleBookSelection(book.id)}
                        disabled={importStatus === "importing"}
                        data-testid={`checkbox-book-${book.id}`}
                      />
                      
                      {book.volumeInfo.imageLinks?.thumbnail && (
                        <img
                          src={book.volumeInfo.imageLinks.thumbnail}
                          alt={book.volumeInfo.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-semibold line-clamp-2">
                          {book.volumeInfo.title}
                        </h4>
                        {book.volumeInfo.authors && (
                          <p className="text-sm text-muted-foreground">
                            {book.volumeInfo.authors.join(", ")}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {book.volumeInfo.categories?.[0] && (
                            <Badge variant="secondary" className="text-xs">
                              {book.volumeInfo.categories[0]}
                            </Badge>
                          )}
                          {year && (
                            <Badge variant="outline" className="text-xs">
                              {year}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            ISBN: {getISBN(book)}
                          </Badge>
                        </div>
                        {book.volumeInfo.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {book.volumeInfo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {isSearching
                    ? "Searching..."
                    : "Search for books to import into your catalog"}
                </p>
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedBooks.size} book{selectedBooks.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={importStatus === "importing"}
                  data-testid="button-cancel-import"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedBooks.size === 0 || importStatus === "importing"}
                  data-testid="button-confirm-import"
                >
                  {importStatus === "importing" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import {selectedBooks.size > 0 && `(${selectedBooks.size})`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
