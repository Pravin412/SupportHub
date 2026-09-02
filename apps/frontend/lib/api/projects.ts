import { request } from "../api-client";
import type { ProjectDto } from "../types";

export const projectsApi = {
  projects: () => request<ProjectDto[]>("/projects"),
  createProject: (name: string, key?: string) =>
    request<ProjectDto & { integrationKey: string; integrationSecret: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, key: key || undefined })
    }),
  deleteProject: (projectId: string) =>
    request<{ ok: boolean; deletedId: string }>(`/projects/${projectId}`, { method: "DELETE" }),
  deleteContact: (projectId: string, contactId: string) =>
    request<{ ok: boolean; deletedId: string }>(`/projects/${projectId}/contacts/${contactId}`, { method: "DELETE" }),
  integrationCredentials: (projectId: string) =>
    request<{ integrationKey: string; integrationSecret: string; integrationRevokedAt?: string | null }>(
      `/projects/${projectId}/integration`
    ),
  rotateIntegrationSecret: (projectId: string) =>
    request<{ integrationKey: string; integrationSecret: string; integrationRevokedAt?: string | null }>(
      `/projects/${projectId}/integration/rotate-secret`,
      { method: "POST" }
    )
};
