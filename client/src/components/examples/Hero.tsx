import { Hero } from "../Hero";

export default function HeroExample() {
  return (
    <Hero
      onBrowse={() => console.log("Browse clicked")}
      onSearch={() => console.log("Search clicked")}
    />
  );
}
