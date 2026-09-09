import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const ticketKeys = {
  all: ["tickets"] as const,
  list: (projectId?: string) => [...ticketKeys.all, "list", projectId] as const
};

export function useTickets(projectId?: string) {
  return useQuery({
    queryKey: ticketKeys.list(projectId),
    queryFn: () => api.tickets(projectId),
    enabled: Boolean(projectId)
  });
}
