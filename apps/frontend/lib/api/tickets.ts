import { request } from "../api-client";

export const ticketsApi = {
  updateTicketStatus: (id: string, status: "OPEN" | "IN_PROGRESS" | "ASSIGNED" | "WAITING" | "RESOLVED" | "CLOSED") =>
    request(`/tickets/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  tickets: (projectId?: string) =>
    request<
      Array<{
        id: string;
        projectId: string;
        conversationId: string;
        title: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        customerName: string;
        customerPhone?: string | null;
      }>
    >(`/tickets${projectId ? `?projectId=${projectId}` : ""}`)
};
