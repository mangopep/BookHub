import { Header } from "../Header";

export default function HeaderExample() {
  return <Header cartItemCount={3} onSearch={(q) => console.log("Search:", q)} />;
}
