"use client";
import { use } from "react";
import { AdminPanels } from "../../../../../components/admin-panels";
import { BackButton } from "../../../../../components/back-button";
import { LoadingIndicator } from "../../../../../components/loading-indicator";
import { useProjects } from "../../../../../lib/queries";

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const projects = useProjects(true);
  const selectedProject = projects.data?.find((project) => project.id === projectId);

  if (projects.isLoading) {
    return (
      <div className="grid min-h-[calc(100vh-56px)] place-items-center">
        <LoadingIndicator />
      </div>
    );
  }

  if (!selectedProject) {
    return <div className="p-8 text-sm text-muted">No project selected.</div>;
  }

  return (
    <div>
      <div className="px-4 py-3 border-b bg-white/50 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton fallbackHref="/projects" />
          <h1 className="truncate text-lg font-semibold">{selectedProject.name} Settings</h1>
        </div>
      </div>
      <AdminPanels project={selectedProject} />
    </div>
  );
}
