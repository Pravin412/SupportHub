import { request } from "../api-client";

export const settingsApi = {
  webhook: (projectId: string) =>
    request<{ url?: string; enabled?: boolean; events?: string[]; secret?: string } | null>(`/projects/${projectId}/webhook`),
  updateWebhook: (projectId: string, url: string) =>
    request<{ url: string; enabled: boolean; events: string[]; signingSecret: string }>(`/projects/${projectId}/webhook`, {
      method: "PUT",
      body: JSON.stringify({ url })
    }),
  notificationSettings: (projectId: string) =>
    request<{
      notificationEmail: string;
      ticketCreatedEnabled: boolean;
      ticketAssignedEnabled: boolean;
      conversationAssignedEnabled: boolean;
      messageReceivedEnabled: boolean;
      notificationEmails?: string[];
    } | null>(`/projects/${projectId}/notifications`),
  updateNotificationSettings: (
    projectId: string,
    data: {
      notificationEmail: string;
      ticketCreatedEnabled?: boolean;
      ticketAssignedEnabled?: boolean;
      conversationAssignedEnabled?: boolean;
      messageReceivedEnabled?: boolean;
    }
  ) =>
    request(`/projects/${projectId}/notifications`, {
      method: "PUT",
      body: JSON.stringify(data)
    })
};
