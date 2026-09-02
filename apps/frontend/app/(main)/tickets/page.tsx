"use client";

import { Folder, TicketCheck } from "lucide-react";
import { Badge } from "@support-hub/ui";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "../../../components/loading-indicator";
import { useProjects, useTickets } from "../../../lib/queries";

export default function TicketsPage() {
  const router = useRouter();
  const projects = useProjects(true);

  if (projects.isLoading) {
    return (
      <div className="grid min-h-[calc(100vh-56px)] place-items-center">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="grid h-main bg-slate-50 md:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-teal-50 text-brand">
            <TicketCheck size={17} />
          </span>
          <div>
            <h1 className="text-sm font-bold text-slate-950">Tickets</h1>
            <p className="text-[11px] text-muted">Select a project</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {projects.data?.map((project) => (
            <ProjectTicketNavItem
              key={project.id}
              project={project}
              active={false}
              onClick={() => router.push(`/tickets/${project.id}`)}
            />
          ))}
          {!projects.data?.length && (
            <div className="p-6 text-center text-xs text-muted">No projects found.</div>
          )}
        </div>
      </aside>

      <section className="min-h-0">
        <div className="grid h-full place-items-center text-sm text-muted">Select a project to view tickets.</div>
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
      className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors ${
        active ? "border-l-4 border-l-brand bg-teal-50" : "border-l-4 border-l-transparent bg-white hover:bg-slate-50"
      }`}
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600">
          <Folder size={15} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-950">{project.name}</span>
          <span className="block truncate font-mono text-[10px] text-muted">{project.key}</span>
        </span>
      </span>
      <Badge className={active ? "border-teal-200 bg-white text-brand" : "border-slate-200 bg-slate-50 text-slate-600"}>
        {openTickets}
      </Badge>
    </button>
  );
}
