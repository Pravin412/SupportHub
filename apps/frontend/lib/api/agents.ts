import { request } from "../api-client";

export const agentsApi = {
  agents: (projectId: string) =>
    request<Array<{ id: string; role: string; user: { name: string; email: string } }>>(
      `/projects/${projectId}/agents`
    ),
  createAgent: (projectId: string, name: string, email: string) =>
    request(`/projects/${projectId}/agents`, { method: "POST", body: JSON.stringify({ name, email }) })
};
