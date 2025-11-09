import { useQuery } from "@tanstack/react-query";
import type { Settings } from "@shared/schema";

export function useSettings() {
  return useQuery<Settings>({
    queryKey: ["/api/settings"],
    staleTime: 5 * 60 * 1000,
  });
}
