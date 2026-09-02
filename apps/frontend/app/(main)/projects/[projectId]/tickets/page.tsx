"use client";

import { use } from "react";
import { BackButton } from "../../../../../components/back-button";
import { LoadingIndicator } from "../../../../../components/loading-indicator";
import { TicketsView } from "../../../../../components/tickets-view";
import { useProjects } from "../../../../../lib/queries";

export default function ProjectTicketsPage({ params }: { params: Promise<{ projectId: string }> }) {
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
      <div className="flex items-center gap-3 border-b bg-white/50 px-4 py-3">
        <BackButton fallbackHref={`/projects/${projectId}/settings`} />
        <h1 className="truncate text-lg font-semibold">{selectedProject.name} Tickets</h1>
      </div>
      <TicketsView projectId={projectId} projectName={selectedProject.name} />
    </div>
  );
}
