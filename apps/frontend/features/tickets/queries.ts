import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const ticketKeys = {
  all: ["tickets"] as const,
  list: (projectId?: string) => [...ticketKeys.all, "list", projectId] as const
};

export function useTickets(projectId?: string, search = "") {
  return useQuery({
    queryKey: search ? [...ticketKeys.list(projectId), search] : ticketKeys.list(projectId),
    queryFn: () => api.tickets(projectId, search),
    enabled: Boolean(projectId)
  });
}
