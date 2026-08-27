import type { ConversationSummary, MessageDto } from "@support-hub/shared-types";
import type { ChannelDto, DashboardSummaryDto, ProjectDto } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
let accessToken = "";
let refreshPromise: Promise<{ accessToken: string }> | null = null;

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  const hasBody = Boolean(init?.body);
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(hasBody ? { "content-type": "application/json" } : {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers
      }
    });
  } catch {
    throw new Error(`Cannot reach the API at ${API}. Make sure the backend is running.`);
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    const message = Array.isArray(error.message) ? error.message.join(", ") : error.message;
    throw new Error(message ?? "Request failed");
  }
  const json = (await res.json()) as ApiResponse<T> | T;
  if (json && typeof json === "object" && "data" in json && "success" in json) {
    return json.data;
  }
  return json as T;
}

export const api = {
  setToken: (token: string) => {
    accessToken = token;
  },
  login: async (email: string, password: string) => {
    const data = await request<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    accessToken = data.accessToken;
    return data;
  },
  refresh: async () => {
    refreshPromise ??= request<{ accessToken: string }>("/auth/refresh", { method: "POST" })
      .then((data) => {
        accessToken = data.accessToken;
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
    return refreshPromise;
  },
  logout: async () => {
    const data = await request<{ ok: boolean }>("/auth/logout", { method: "POST" });
    accessToken = "";
    return data;
  },
  me: () => request<{ id: string; email: string; name: string }>("/auth/me"),
  dashboardSummary: () => request<DashboardSummaryDto>("/dashboard/summary"),
  projects: () => request<ProjectDto[]>("/projects"),
  createProject: (name: string, key?: string) =>
    request<ProjectDto & { integrationKey: string; integrationSecret: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, key: key || undefined })
    }),
  deleteProject: (projectId: string) =>
    request<{ ok: boolean; deletedId: string }>(`/projects/${projectId}`, { method: "DELETE" }),
  channels: (projectId: string) => request<ChannelDto[]>(`/projects/${projectId}/channels`),
  agents: (projectId: string) =>
    request<Array<{ id: string; role: string; user: { name: string; email: string } }>>(
      `/projects/${projectId}/agents`
    ),
  createAgent: (projectId: string, name: string, email: string) =>
    request(`/projects/${projectId}/agents`, { method: "POST", body: JSON.stringify({ name, email }) }),
  conversations: (projectId: string, search = "") =>
    request<ConversationSummary[]>(`/projects/${projectId}/conversations?search=${encodeURIComponent(search)}`),
  messages: (id: string) => request<MessageDto[]>(`/conversations/${id}/messages`),
  sendMessage: (id: string, content: string) =>
    request<MessageDto>(`/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
  createTicket: (id: string, title: string) =>
    request(`/conversations/${id}/ticket`, { method: "POST", body: JSON.stringify({ title, priority: "MEDIUM" }) }),
  tickets: (projectId?: string) =>
    request<Array<{ id: string; title: string; status: string; priority: string }>>(
      `/tickets${projectId ? `?projectId=${projectId}` : ""}`
    ),
  webhook: (projectId: string) =>
    request<{ url?: string; enabled?: boolean; events?: string[]; secret?: string } | null>(`/projects/${projectId}/webhook`),
  updateWebhook: (projectId: string, url: string) =>
    request<{ url: string; enabled: boolean; events: string[]; signingSecret: string }>(`/projects/${projectId}/webhook`, {
      method: "PUT",
      body: JSON.stringify({ url })
    }),
  botConfig: (projectId: string) =>
    request<{
      responseMode: "AUTOMATED" | "HUMAN" | "AI";
      botName: string;
      botAvatar?: string | null;
      enabled: boolean;
      fallbackMessage: string;
      handoffKeywords: string[];
    }>(`/projects/${projectId}/bot`),
  updateBotConfig: (
    projectId: string,
    data: { responseMode: "AUTOMATED" | "HUMAN" | "AI"; botName: string; fallbackMessage: string; botAvatar?: string }
  ) => request(`/projects/${projectId}/bot`, { method: "PUT", body: JSON.stringify(data) }),
  updateWidget: (projectId: string, data: { welcomeMessage?: string; colorTheme?: string; logoUrl?: string }) =>
    request(`/projects/${projectId}/widget`, { method: "PUT", body: JSON.stringify(data) })
};

export const widgetApi = {
  config: (channelId: string) => request<any>(`/widget/${channelId}/config`),
  messages: (channelId: string, profileId: string) => 
    request<MessageDto[]>(`/widget/${channelId}/messages?profileId=${profileId}`),
  sendMessage: (channelId: string, profileId: string, content: string, name?: string, number?: string) =>
    request<MessageDto>(`/widget/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ profileId, content, name, number })
    })
};
