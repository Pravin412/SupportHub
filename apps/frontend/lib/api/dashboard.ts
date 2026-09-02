import { request } from "../api-client";
import type { DashboardRange, DashboardSummaryDto } from "../types";

export const dashboardApi = {
  dashboardSummary: (range: DashboardRange = "all") => request<DashboardSummaryDto>(`/dashboard/summary?range=${range}`)
};
