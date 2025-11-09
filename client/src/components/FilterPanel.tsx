import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Filter, X } from "lucide-react";

interface FilterPanelProps {
  genres?: string[];
  selectedGenres?: string[];
  onGenreChange?: (genres: string[]) => void;
  yearRange?: [number, number];
  onYearRangeChange?: (range: [number, number]) => void;
  onClear?: () => void;
}

export function FilterPanel({
  genres = [],
  selectedGenres = [],
  onGenreChange,
  yearRange,
  onYearRangeChange,
  onClear,
}: FilterPanelProps) {
  const handleGenreToggle = (genre: string) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    onGenreChange?.(newGenres);
  };

  const activeFiltersCount = selectedGenres.length + (yearRange?.[0] !== 1900 || yearRange?.[1] !== 2024 ? 1 : 0);

  return (
    <Card className="p-4 border-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-semibold">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            data-testid="button-clear-filters"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Separator className="mb-4" />

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-semibold mb-3 block">Genre</Label>
          <div className="flex flex-wrap gap-2" data-testid="filter-genres">
            {genres.map((genre) => (
              <Badge
                key={genre}
                variant={selectedGenres.includes(genre) ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => handleGenreToggle(genre)}
                data-testid={`checkbox-genre-${genre.toLowerCase()}`}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-semibold mb-3 block">Year Range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="From"
              value={yearRange?.[0] || ""}
              onChange={(e) =>
                onYearRangeChange?.([
                  parseInt(e.target.value) || 0,
                  yearRange?.[1] || new Date().getFullYear(),
                ])
              }
              className="w-full"
              data-testid="input-year-from"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <Input
              type="number"
              placeholder="To"
              value={yearRange?.[1] || ""}
              onChange={(e) =>
                onYearRangeChange?.([
                  yearRange?.[0] || 1900,
                  parseInt(e.target.value) || new Date().getFullYear(),
                ])
              }
              className="w-full"
              data-testid="input-year-to"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
