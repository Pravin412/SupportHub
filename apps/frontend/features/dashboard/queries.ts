import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardRange } from "@/lib/types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (range: DashboardRange = "all") => [...dashboardKeys.all, "summary", range] as const
};

export function useDashboardSummary(range: DashboardRange = "all", enabled = true) {
  return useQuery({ queryKey: dashboardKeys.summary(range), queryFn: () => api.dashboardSummary(range), enabled });
}
