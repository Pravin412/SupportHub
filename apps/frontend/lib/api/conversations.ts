import type { ConversationSummary, MessageDto } from "@support-hub/shared-types";
import { request } from "../api-client";

export const conversationsApi = {
  conversations: (projectId: string, search = "") =>
    request<ConversationSummary[]>(`/projects/${projectId}/conversations?search=${encodeURIComponent(search)}`),
  messages: (id: string) => request<MessageDto[]>(`/conversations/${id}/messages`),
  sendMessage: (id: string, content: string) =>
    request<MessageDto>(`/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
  updateConversationStatus: (id: string, status: "OPEN" | "PENDING" | "SNOOZED" | "RESOLVED") =>
    request<{ ok: boolean }>(`/conversations/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  createTicket: (id: string, title: string) =>
    request(`/conversations/${id}/ticket`, { method: "POST", body: JSON.stringify({ title }) })
};
