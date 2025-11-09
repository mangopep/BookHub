import { BookCard } from "../BookCard";

export default function BookCardExample() {
  const book = {
    id: "1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic",
    year: 1925,
    price: 12.99,
    coverUrl: "https://covers.openlibrary.org/b/id/7883671-L.jpg",
  };

  return (
    <div className="max-w-xs">
      <BookCard book={book} onAddToCart={(b) => console.log("Added to cart:", b)} />
    </div>
  );
}
