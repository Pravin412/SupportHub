import { request } from "../api-client";

export type ProjectAccessMember = {
  id: string;
  role: string;
  emailNotificationsEnabled: boolean;
  user: { id: string; name: string; email: string };
};

export const agentsApi = {
  agents: (projectId: string) =>
    request<Array<ProjectAccessMember>>(
      `/projects/${projectId}/agents`
    ),
  lookupAgent: (projectId: string, email: string) =>
    request<{ exists: boolean; user?: { id: string; email: string; name: string } }>(
      `/projects/${projectId}/agents/lookup?email=${encodeURIComponent(email)}`
    ),
  createAgent: (
    projectId: string,
    name: string,
    email: string,
    password: string | undefined,
    role: "PROJECT_ADMIN" | "PROJECT_AGENT",
    emailNotificationsEnabled: boolean
  ) =>
    request(`/projects/${projectId}/agents`, {
      method: "POST",
      body: JSON.stringify({ name, email, password, role, emailNotificationsEnabled })
    }),
  updateAgent: (
    projectId: string,
    memberId: string,
    data: { name: string; email: string; role: "PROJECT_ADMIN" | "PROJECT_AGENT"; emailNotificationsEnabled: boolean }
  ) =>
    request<ProjectAccessMember>(`/projects/${projectId}/agents/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  updateAgentPassword: (projectId: string, memberId: string, password: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/agents/${memberId}/password`, {
      method: "PUT",
      body: JSON.stringify({ password })
    }),
  removeAgent: (projectId: string, memberId: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/agents/${memberId}`, { method: "DELETE" })
};
