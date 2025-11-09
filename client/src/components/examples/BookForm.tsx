import { BookForm } from "../BookForm";

export default function BookFormExample() {
  return (
    <div className="max-w-2xl p-6">
      <BookForm
        onSubmit={(data) => console.log("Form submitted:", data)}
        onCancel={() => console.log("Cancelled")}
      />
    </div>
  );
}
