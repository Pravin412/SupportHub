import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { DashboardRange } from "./types";

export const keys = {
  me: ["me"] as const,
  dashboardSummary: (range: DashboardRange = "all") => ["dashboard-summary", range] as const,
  projects: ["projects"] as const,
  agents: (projectId?: string) => ["agents", projectId] as const,
  conversations: (projectId?: string, search = "") => ["conversations", projectId, search] as const,
  messages: (id?: string) => ["messages", id] as const,
  tickets: (projectId?: string) => ["tickets", projectId] as const,
  channels: (projectId?: string) => ["channels", projectId] as const,
  integrationCredentials: (projectId?: string) => ["integration-credentials", projectId] as const,
  webhook: (projectId?: string) => ["webhook", projectId] as const,
  notificationSettings: (projectId?: string) => ["notification-settings", projectId] as const,
  emailSettings: (projectId?: string) => ["email-settings", projectId] as const,
  botConfig: (projectId?: string) => ["bot-config", projectId] as const,
  globalSearch: (query: string) => ["global-search", query] as const
};

export function useMe(enabled = true) {
  return useQuery({ queryKey: keys.me, queryFn: api.me, enabled });
}

export function useProjects(enabled = true) {
  return useQuery({ queryKey: keys.projects, queryFn: api.projects, enabled });
}

export function useDashboardSummary(range: DashboardRange = "all", enabled = true) {
  return useQuery({ queryKey: keys.dashboardSummary(range), queryFn: () => api.dashboardSummary(range), enabled });
}

export function useConversations(projectId?: string, search = "") {
  return useQuery({
    queryKey: keys.conversations(projectId, search),
    queryFn: () => api.conversations(projectId!, search),
    enabled: Boolean(projectId)
  });
}

export function useMessages(id?: string) {
  return useQuery({ queryKey: keys.messages(id), queryFn: () => api.messages(id!), enabled: Boolean(id) });
}

export function useAgents(projectId?: string) {
  return useQuery({
    queryKey: keys.agents(projectId),
    queryFn: () => api.agents(projectId!),
    enabled: Boolean(projectId)
  });
}

export function useTickets(projectId?: string) {
  return useQuery({
    queryKey: keys.tickets(projectId),
    queryFn: () => api.tickets(projectId),
    enabled: Boolean(projectId)
  });
}

export function useChannels(projectId?: string) {
  return useQuery({
    queryKey: keys.channels(projectId),
    queryFn: () => api.channels(projectId!),
    enabled: Boolean(projectId)
  });
}

export function useIntegrationCredentials(projectId?: string) {
  return useQuery({
    queryKey: keys.integrationCredentials(projectId),
    queryFn: () => api.integrationCredentials(projectId!),
    enabled: Boolean(projectId)
  });
}

export function useWebhooks(projectId?: string) {
  return useQuery({
    queryKey: keys.webhook(projectId),
    queryFn: () => api.webhooks(projectId!),
    enabled: Boolean(projectId)
  });
}

export function useNotificationSettings(projectId?: string) {
  return useQuery({
    queryKey: keys.notificationSettings(projectId),
    queryFn: () => api.notificationSettings(projectId!),
    enabled: Boolean(projectId)
  });
}

export function useEmailSettings(projectId?: string) {
  return useQuery({
    queryKey: keys.emailSettings(projectId),
    queryFn: () => api.emailSettings(projectId!),
    enabled: Boolean(projectId)
  });
}

export function useBotConfig(projectId?: string) {
  return useQuery({
    queryKey: keys.botConfig(projectId),
    queryFn: () => api.botConfig(projectId!),
    enabled: Boolean(projectId)
  });
}

export function useSendMessage(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.sendMessage(id!, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.messages(id) });
      qc.invalidateQueries({ predicate: (query) => query.queryKey[0] === "conversations" });
    }
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "OPEN" | "PENDING" | "SNOOZED" | "RESOLVED" }) =>
      api.updateConversationStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "conversations" });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "tickets" });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "dashboard-summary" });
      queryClient.invalidateQueries({ queryKey: keys.messages(id) });
    }
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; key?: string }) => api.createProject(v.name, v.key),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects })
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.deleteProject(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects })
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, contactId }: { projectId: string; contactId: string }) => api.deleteContact(projectId, contactId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: keys.conversations(variables.projectId) });
    }
  });
}

export function useCreateAgent(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; email: string; password?: string; role: "PROJECT_ADMIN" | "PROJECT_AGENT" }) =>
      api.createAgent(projectId!, v.name, v.email, v.password, v.role),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.agents(projectId) })
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
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.channels(projectId) })
  });
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: keys.globalSearch(query),
    queryFn: () => api.search(query),
    enabled: query.trim().length > 1
  });
}
