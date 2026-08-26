import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export const keys = {
  dashboardSummary: ["dashboard-summary"] as const,
  projects: ["projects"] as const,
  agents: (projectId?: string) => ["agents", projectId] as const,
  conversations: (projectId?: string, search = "") => ["conversations", projectId, search] as const,
  messages: (id?: string) => ["messages", id] as const,
  tickets: (projectId?: string) => ["tickets", projectId] as const,
  channels: (projectId?: string) => ["channels", projectId] as const,
  webhook: (projectId?: string) => ["webhook", projectId] as const,
  botConfig: (projectId?: string) => ["bot-config", projectId] as const
};

export function useProjects(enabled = true) {
  return useQuery({ queryKey: keys.projects, queryFn: api.projects, enabled });
}

export function useDashboardSummary(enabled = true) {
  return useQuery({ queryKey: keys.dashboardSummary, queryFn: api.dashboardSummary, enabled });
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

export function useWebhook(projectId?: string) {
  return useQuery({
    queryKey: keys.webhook(projectId),
    queryFn: () => api.webhook(projectId!),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.messages(id) })
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; key: string }) => api.createProject(v.name, v.key),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.projects })
  });
}

export function useCreateAgent(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; email: string }) => api.createAgent(projectId!, v.name, v.email),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.agents(projectId) })
  });
}

export function useUpdateWidget(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { welcomeMessage?: string; colorTheme?: string }) => api.updateWidget(projectId!, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.channels(projectId) })
  });
}
