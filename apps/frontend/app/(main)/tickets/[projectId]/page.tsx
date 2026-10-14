"use client";

import { use } from "react";
import { Folder, TicketCheck } from "lucide-react";
import { Badge } from "@support-hub/ui";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "../../../../components/loading-indicator";
import { TicketsView } from "../../../../components/tickets-view";
import { useProjects, useTickets } from "../../../../lib/queries";

export default function ProjectTicketsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const projects = useProjects(true);
  const selectedProject = projects.data?.find((project) => project.id === projectId);

  if (projects.isLoading) {
    return (
      <div className="grid min-h-[calc(100vh-56px)] place-items-center">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="flex h-main flex-col bg-[#f7f9fc] md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex max-h-48 shrink-0 flex-col border-b border-slate-200 bg-white md:max-h-none md:min-h-0 md:border-b-0 md:border-r">
        <div className="flex shrink-0 items-center gap-2 px-4 pb-4 pt-6">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-blue-50 text-brand">
            <TicketCheck size={17} />
          </span>
          <div>
            <h1 className="text-sm font-bold text-slate-950">Tickets</h1>
            <p className="text-[11px] text-muted">Select a project</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-4">
          {projects.data?.map((project) => (
            <ProjectTicketNavItem
              key={project.id}
              project={project}
              active={project.id === projectId}
              onClick={() => router.push(`/tickets/${project.id}`)}
            />
          ))}
          {!projects.data?.length && <div className="p-6 text-center text-xs text-muted">No projects found.</div>}
        </div>
      </aside>

      <section className="min-h-0 min-w-0 flex-1">
        {selectedProject ? (
          <TicketsView projectId={selectedProject.id} projectName={selectedProject.name} />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">Project not found.</div>
        )}
      </section>
    </div>
  );
}

function ProjectTicketNavItem({
  project,
  active,
  onClick
}: {
  project: { id: string; name: string; key: string };
  active: boolean;
  onClick: () => void;
}) {
  const tickets = useTickets(project.id);
  const openTickets = tickets.data?.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length ?? 0;

  return (
    <button
      type="button"
      className={`relative flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-3 text-left transition-colors ${
        active ? "border-blue-100 bg-blue-50/70 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-blue-500" : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
          <Folder size={15} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-slate-950">{project.name}</span>
          <span className="block truncate font-mono text-[10px] text-muted">{project.key}</span>
        </span>
      </span>
      <Badge className={active ? "shrink-0 border-blue-100 bg-blue-100 text-brand" : "shrink-0 border-slate-100 bg-slate-100 text-slate-500"}>
        {openTickets}
      </Badge>
    </button>
  );
}
