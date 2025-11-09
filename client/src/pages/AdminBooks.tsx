import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { BookForm } from "@/components/BookForm";
import { ImportBooksDialog } from "@/components/ImportBooksDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Download, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Book } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getSocket } from "@/lib/socket";

export default function AdminBooks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const { toast } = useToast();

  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/books", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Book added successfully",
        duration: 1000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add book",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/books/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsDialogOpen(false);
      setEditingBook(null);
      toast({
        title: "Success",
        description: "Book updated successfully",
        duration: 1000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update book",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success",
        description: "Book deleted successfully",
        duration: 1000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBook = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEditBook = (data: any) => {
    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data });
    }
  };

  const handleDeleteBook = (id: string) => {
    if (confirm("Are you sure you want to delete this book?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/top-books"] });
  };

  useEffect(() => {
    const socket = getSocket();

    const handleBookCreated = (newBook: Book) => {
      console.log('[Admin Real-time] New book created:', newBook.title);
      
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-books'] });
      
      toast({
        title: 'Catalog Updated',
        description: `"${newBook.title}" by ${newBook.author} has been added`,
        duration: 1000,
      });
    };

    const handleBookUpdated = (updatedBook: Book) => {
      console.log('[Admin Real-time] Book updated:', updatedBook.title);
      
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-books'] });
      
      toast({
        title: 'Book Updated',
        description: `"${updatedBook.title}" by ${updatedBook.author}`,
        duration: 1000,
      });
    };

    const handleBookDeleted = ({ id, title, author }: { id: string; title?: string; author?: string }) => {
      console.log('[Admin Real-time] Book deleted:', title || id);
      
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-books'] });
      
      const bookInfo = title && author ? `"${title}" by ${author}` : 'A book';
      toast({
        title: 'Book Removed',
        description: `${bookInfo} has been removed from the catalog`,
        duration: 1000,
      });
    };

    socket.on('book:created', handleBookCreated);
    socket.on('book:updated', handleBookUpdated);
    socket.on('book:deleted', handleBookDeleted);

    socket.on('reconnect', () => {
      console.log('[Admin Real-time] Reconnected - refreshing data...');
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/top-books'] });
    });

    return () => {
      socket.off('book:created', handleBookCreated);
      socket.off('book:updated', handleBookUpdated);
      socket.off('book:deleted', handleBookDeleted);
      socket.off('reconnect');
    };
  }, [toast]);

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="heading-manage-books">
              Manage Books
            </h1>
            <p className="text-muted-foreground">
              Add, edit, or remove books from your catalog
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              data-testid="button-import-books"
            >
              <Download className="w-4 h-4 mr-2" />
              Import from API
            </Button>
            <Button
              onClick={() => {
                setEditingBook(null);
                setIsDialogOpen(true);
              }}
              data-testid="button-add-book"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-books"
          />
        </div>

        <div className="border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No books found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBooks.map((book) => (
                    <TableRow key={book.id} data-testid={`row-book-${book.id}`}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{book.genre}</Badge>
                      </TableCell>
                      <TableCell>{book.year}</TableCell>
                      <TableCell className="text-right">₹{book.price}</TableCell>
                      <TableCell className="text-right">{book.stock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingBook(book);
                              setIsDialogOpen(true);
                            }}
                            data-testid={`button-edit-${book.id}`}
                            disabled={deleteMutation.isPending}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteBook(book.id)}
                            data-testid={`button-delete-${book.id}`}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBook ? "Edit Book" : "Add New Book"}
              </DialogTitle>
            </DialogHeader>
            <BookForm
              defaultValues={editingBook ? {
                ...editingBook,
                isbn: editingBook.isbn ?? "",
                coverUrl: editingBook.coverUrl ?? "",
                description: editingBook.description ?? "",
              } : undefined}
              onSubmit={editingBook ? handleEditBook : handleAddBook}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingBook(null);
              }}
              submitLabel={editingBook ? "Update Book" : "Add Book"}
            />
          </DialogContent>
        </Dialog>

        <ImportBooksDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onSuccess={handleImportSuccess}
        />
      </div>
    </AdminLayout>
  );
}
