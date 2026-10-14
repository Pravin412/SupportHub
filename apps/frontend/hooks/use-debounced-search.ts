"use client";
import { useEffect, useState } from "react";

export function useDebouncedSearch(value: string, delay = 300) {
  const normalized = value.trim();
  const [search, setSearch] = useState(normalized);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(normalized), delay);
    return () => clearTimeout(timer);
  }, [normalized, delay]);
  return search;
}
