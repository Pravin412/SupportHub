import { request } from "../api-client";

export const settingsApi = {
  webhooks: (projectId: string) =>
    request<{ id: string; name: string; url: string; isActive: boolean; enabled: boolean; events: string[]; secret: string }[]>(`/projects/${projectId}/webhooks`),
  createWebhook: (projectId: string, data: { name: string; url: string; isActive?: boolean }) =>
    request<{ id: string; name: string; url: string; isActive: boolean; enabled: boolean; events: string[]; signingSecret: string }>(`/projects/${projectId}/webhooks`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
  updateWebhook: (projectId: string, webhookId: string, data: { name?: string; url?: string; isActive?: boolean }) =>
    request<{ id: string; name: string; url: string; isActive: boolean; enabled: boolean; events: string[]; secret: string }>(`/projects/${projectId}/webhooks/${webhookId}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  deleteWebhook: (projectId: string, webhookId: string) =>
    request<{ success: boolean }>(`/projects/${projectId}/webhooks/${webhookId}`, {
      method: "DELETE"
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
    }),
  emailSettings: (projectId: string) =>
    request<{
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
      smtpUser: string;
      fromName?: string | null;
    } | null>(`/projects/${projectId}/email-settings`),
  updateEmailSettings: (
    projectId: string,
    data: {
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
      smtpUser: string;
      smtpPassword?: string;
      fromName?: string;
    }
  ) =>
    request(`/projects/${projectId}/email-settings`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  testEmailSettings: (projectId: string) =>
    request<{ success: boolean; message: string }>(`/projects/${projectId}/email-settings/test`, {
      method: "POST"
    }),
  whatsappSettings: (projectId: string) =>
    request<{
      id: string | null;
      projectId: string;
      enabled: boolean;
      ticketCreatedEnabled: boolean;
      recipientPhoneNumbers: string[];
      ticketCreatedTemplateId?: string | null;
      providerUrl?: string | null;
      vendorId?: string | null;
      accessToken?: string | null;
      hasCustomToken: boolean;
      isConfigured: boolean;
    }>(`/projects/${projectId}/whatsapp-settings`),
  updateWhatsappSettings: (
    projectId: string,
    data: {
      enabled?: boolean;
      ticketCreatedEnabled?: boolean;
      recipientPhoneNumbers?: string[];
      ticketCreatedTemplateId?: string | null;
      providerUrl?: string | null;
      vendorId?: string | null;
      accessToken?: string | null;
    }
  ) =>
    request(`/projects/${projectId}/whatsapp-settings`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  testWhatsappSettings: (projectId: string, data?: { phoneNumber?: string }) =>
    request<{ success: boolean; message: string }>(`/projects/${projectId}/whatsapp-settings/test`, {
      method: "POST",
      body: JSON.stringify(data ?? {})
    }),
  whatsappTemplates: (projectId: string) =>
    request<
      {
        id: string;
        projectId: string;
        name: string;
        displayName: string;
        language: string;
        description?: string | null;
      }[]
    >(`/projects/${projectId}/whatsapp-templates`),
  createWhatsappTemplate: (
    projectId: string,
    data: {
      name: string;
      displayName: string;
      language?: string;
      description?: string;
    }
  ) =>
    request<{ id: string }>(`/projects/${projectId}/whatsapp-templates`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
  updateWhatsappTemplate: (projectId: string, templateId: string, data: { name: string; displayName: string; language?: string; description?: string }) =>
    request<{ id: string }>(`/projects/${projectId}/whatsapp-templates/${templateId}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  deleteWhatsappTemplate: (projectId: string, templateId: string) =>
    request<{ success: boolean }>(`/projects/${projectId}/whatsapp-templates/${templateId}`, {
      method: "DELETE"
    })
};
