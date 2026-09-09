import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const settingsKeys = {
  all: ["settings"] as const,
  agents: (projectId?: string) => [...settingsKeys.all, "agents", projectId] as const,
  channels: (projectId?: string) => [...settingsKeys.all, "channels", projectId] as const,
  webhook: (projectId?: string) => [...settingsKeys.all, "webhook", projectId] as const,
  notificationSettings: (projectId?: string) => [...settingsKeys.all, "notification-settings", projectId] as const,
  emailSettings: (projectId?: string) => [...settingsKeys.all, "email-settings", projectId] as const,
  botConfig: (projectId?: string) => [...settingsKeys.all, "bot-config", projectId] as const
};

export function useAgents(projectId?: string) {
  return useQuery({ queryKey: settingsKeys.agents(projectId), queryFn: () => api.agents(projectId!), enabled: Boolean(projectId) });
}

export function useChannels(projectId?: string) {
  return useQuery({ queryKey: settingsKeys.channels(projectId), queryFn: () => api.channels(projectId!), enabled: Boolean(projectId) });
}

export function useWebhooks(projectId?: string) {
  return useQuery({ queryKey: settingsKeys.webhook(projectId), queryFn: () => api.webhooks(projectId!), enabled: Boolean(projectId) });
}

export function useNotificationSettings(projectId?: string) {
  return useQuery({
    queryKey: settingsKeys.notificationSettings(projectId),
    queryFn: () => api.notificationSettings(projectId!),
    enabled: Boolean(projectId)
  });
}

export function useEmailSettings(projectId?: string) {
  return useQuery({ queryKey: settingsKeys.emailSettings(projectId), queryFn: () => api.emailSettings(projectId!), enabled: Boolean(projectId) });
}

export function useBotConfig(projectId?: string) {
  return useQuery({ queryKey: settingsKeys.botConfig(projectId), queryFn: () => api.botConfig(projectId!), enabled: Boolean(projectId) });
}

export function useCreateAgent(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; email: string; password?: string; role: "PROJECT_ADMIN" | "PROJECT_AGENT"; emailNotificationsEnabled: boolean }) =>
      api.createAgent(projectId!, v.name, v.email, v.password, v.role, v.emailNotificationsEnabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.agents(projectId) })
  });
}

export function useUpdateAgent(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { memberId: string; name: string; email: string; role: "PROJECT_ADMIN" | "PROJECT_AGENT"; emailNotificationsEnabled: boolean }) =>
      api.updateAgent(projectId!, v.memberId, { name: v.name, email: v.email, role: v.role, emailNotificationsEnabled: v.emailNotificationsEnabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.agents(projectId) })
  });
}

export function useUpdateWidget(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      welcomeMessage?: string;
      colorTheme?: string;
      logoUrl?: string;
      collectVisitorInfo?: boolean;
      visitorNameEnabled?: boolean;
      visitorEmailEnabled?: boolean;
      visitorPhoneEnabled?: boolean;
    }) => api.updateWidget(projectId!, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.channels(projectId) })
  });
}
