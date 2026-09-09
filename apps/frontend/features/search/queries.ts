import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const searchKeys = {
  all: ["search"] as const,
  global: (query: string) => [...searchKeys.all, "global", query] as const
};

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: searchKeys.global(query),
    queryFn: () => api.search(query),
    enabled: query.trim().length > 1
  });
}
