import { Folder, Inbox, MessageSquare, Radio, Ticket, Users } from "lucide-react";
import { Button } from "@support-hub/ui";
import { MetricCard } from "./shared";
import type { DashboardSummaryDto } from "../lib/types";

export function Overview({
  summary,
  isLoading,
  onInbox
}: {
  summary?: DashboardSummaryDto;
  isLoading?: boolean;
  onInbox: () => void;
}) {
  const data = summary ?? {
    projectsCount: 0,
    conversationsCount: 0,
    openConversationsCount: 0,
    unreadConversationsCount: 0,
    ticketsCount: 0,
    openTicketsCount: 0,
    agentsCount: 0,
    activeChannelsCount: 0
  };
  const loadingLabel = isLoading ? "Loading..." : "Live summary";

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-secondary">Summary from all available projects.</p>
        </div>
        <Button
          className="h-9 gap-2 rounded border-brand bg-brand px-4 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
          onClick={onInbox}
        >
          <Inbox size={14} />
          Open Inbox
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-6">
        <MetricCard
          title="Total Projects"
          value={data.projectsCount.toLocaleString()}
          delta={loadingLabel}
          icon={<Folder size={16} className="text-tertiary" />}
          neutral
        />
        <MetricCard
          title="Total Conversations"
          value={data.conversationsCount.toLocaleString()}
          delta={`${data.openConversationsCount.toLocaleString()} open`}
          icon={<MessageSquare size={16} className="text-tertiary" />}
          neutral
        />
        <MetricCard
          title="Total Tickets"
          value={data.ticketsCount.toLocaleString()}
          delta={`${data.openTicketsCount.toLocaleString()} open`}
          icon={<Ticket size={16} className="text-tertiary" />}
          neutral
        />
        <MetricCard
          title="Total Agents"
          value={data.agentsCount.toLocaleString()}
          delta={loadingLabel}
          icon={<Users size={16} className="text-tertiary" />}
          neutral
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:gap-6">
        <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-primary">Conversation Summary</h2>
              <p className="mt-1 text-xs text-secondary">Current workload across every project you can access.</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
              <MessageSquare size={18} />
            </span>
          </div>
          <SummaryRows
            rows={[
              ["All conversations", data.conversationsCount],
              ["Open conversations", data.openConversationsCount],
              ["Unread conversations", data.unreadConversationsCount]
            ]}
          />
        </section>

        <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-primary">Project Summary</h2>
              <p className="mt-1 text-xs text-secondary">Project coverage, team members, and active widget channels.</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
              <Radio size={18} />
            </span>
          </div>
          <SummaryRows
            rows={[
              ["Available projects", data.projectsCount],
              ["Agents and members", data.agentsCount],
              ["Active channels", data.activeChannelsCount]
            ]}
          />
        </section>
      </div>
    </main>
  );
}

function SummaryRows({ rows }: { rows: Array<[string, number]> }) {
  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="font-medium text-secondary">{label}</span>
          <span className="text-base font-bold text-primary">{value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
