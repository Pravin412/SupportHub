"use client";
import { use } from "react";
import { AdminPanels } from "../../../../../components/admin-panels";
import { BackButton } from "../../../../../components/back-button";
import { LoadingIndicator } from "../../../../../components/loading-indicator";
import { useMe, useProjects } from "../../../../../lib/queries";

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const projects = useProjects(true);
  const me = useMe();
  const selectedProject = projects.data?.find((project) => project.id === projectId);
  const projectRole = me.data?.memberships.find((membership) => membership.projectId === projectId)?.role;
  const canManageSettings = me.data?.role === "ADMIN" || projectRole === "PROJECT_ADMIN";

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

  if (!canManageSettings) {
    return <div className="p-8 text-sm text-muted">You can view this project's inbox and tickets, but settings are available only to project admins.</div>;
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
