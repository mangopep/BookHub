import { FilterPanel } from "../FilterPanel";
import { useState } from "react";

export default function FilterPanelExample() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Fiction"]);
  const [yearRange, setYearRange] = useState<[number, number]>([1900, 2024]);

  return (
    <div className="max-w-xs">
      <FilterPanel
        genres={["Fiction", "Non-Fiction", "Science", "History", "Biography"]}
        selectedGenres={selectedGenres}
        onGenreChange={setSelectedGenres}
        yearRange={yearRange}
        onYearRangeChange={setYearRange}
        onClear={() => {
          setSelectedGenres([]);
          setYearRange([1900, 2024]);
        }}
      />
    </div>
  );
}
