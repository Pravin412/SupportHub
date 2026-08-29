"use client";
import { use } from "react";
import { AdminPanels } from "../../../../../components/admin-panels";
import { LoadingIndicator } from "../../../../../components/loading-indicator";
import { useProjects } from "../../../../../lib/queries";

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const projects = useProjects(true);
  const selectedProject = projects.data?.find((p) => p.id === projectId);

  if (projects.isLoading) {
    return (
      <div className="grid min-h-[calc(100vh-56px)] place-items-center">
        <LoadingIndicator />
      </div>
    );
  }

  if (!selectedProject) {
    return <div className="p-8 text-sm text-red-500">Project not found.</div>;
  }

  return (
    <div>
      <div className="px-4 py-3 border-b bg-white/50 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{selectedProject.name} Settings</h1>
      </div>
      <AdminPanels project={selectedProject} />
    </div>
  );
}
