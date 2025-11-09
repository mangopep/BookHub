import { CartItem } from "../CartItem";

export default function CartItemExample() {
  return (
    <CartItem
      id="1"
      title="The Great Gatsby"
      author="F. Scott Fitzgerald"
      price={12.99}
      quantity={2}
      coverUrl="https://covers.openlibrary.org/b/id/7883671-L.jpg"
      onQuantityChange={(id, q) => console.log("Quantity changed:", id, q)}
      onRemove={(id) => console.log("Removed:", id)}
    />
  );
}
