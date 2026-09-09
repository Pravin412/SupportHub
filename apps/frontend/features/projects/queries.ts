import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  integrationCredentials: (projectId?: string) => [...projectKeys.all, "integration-credentials", projectId] as const
};

export function useProjects(enabled = true) {
  return useQuery({ queryKey: projectKeys.list(), queryFn: api.projects, enabled });
}

export function useIntegrationCredentials(projectId?: string) {
  return useQuery({
    queryKey: projectKeys.integrationCredentials(projectId),
    queryFn: () => api.integrationCredentials(projectId!),
    enabled: Boolean(projectId)
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; key?: string }) => api.createProject(v.name, v.key),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all })
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.deleteProject(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all })
  });
}
