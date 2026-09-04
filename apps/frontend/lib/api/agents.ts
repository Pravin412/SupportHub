import { request } from "../api-client";

export const agentsApi = {
  agents: (projectId: string) =>
    request<Array<{ id: string; role: string; user: { id: string; name: string; email: string } }>>(
      `/projects/${projectId}/agents`
    ),
  lookupAgent: (projectId: string, email: string) =>
    request<{ exists: boolean; user?: { id: string; email: string; name: string } }>(
      `/projects/${projectId}/agents/lookup?email=${encodeURIComponent(email)}`
    ),
  createAgent: (projectId: string, name: string, email: string, password: string | undefined, role: "PROJECT_ADMIN" | "PROJECT_AGENT") =>
    request(`/projects/${projectId}/agents`, { method: "POST", body: JSON.stringify({ name, email, password, role }) }),
  updateAgentPassword: (projectId: string, memberId: string, password: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/agents/${memberId}/password`, {
      method: "PUT",
      body: JSON.stringify({ password })
    }),
  removeAgent: (projectId: string, memberId: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/agents/${memberId}`, { method: "DELETE" })
};
