"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, TicketCheck, User } from "lucide-react";
import { Badge, Button, Card } from "@support-hub/ui";
import { api } from "../lib/api";
import { keys, useTickets } from "../lib/queries";
import { useUiStore } from "../lib/store";
import { formatShortDate } from "../lib/format";
import { TicketStatus, TicketStatusFilter, ticketTabs, type TicketStatusFilterValue } from "../lib/ticket-status";
import { StatusDropdown } from "./ticket-status-dropdown";

export const TicketsView = ({ projectId, projectName }: { projectId: string; projectName: string }) => {
  const tickets = useTickets(projectId);
  const [activeStatus, setActiveStatus] = useState<TicketStatusFilterValue>(TicketStatus.Open);
  const queryClient = useQueryClient();
  const router = useRouter();
  const setProject = useUiStore((state) => state.setProject);
  const setConversation = useUiStore((state) => state.setConversation);
  const showToast = useUiStore((state) => state.showToast);

  useEffect(() => {
    setActiveStatus(TicketStatus.Open);
  }, [projectId]);

  const openConversation = (conversationId: string) => {
    setProject(projectId);
    setConversation(conversationId);
    router.push("/inbox");
  };

  const updateStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      queryClient.setQueryData(keys.tickets(projectId), (current: typeof ticketList | undefined) =>
        current?.map((ticket) => (ticket.id === ticketId ? { ...ticket, status } : ticket))
      );
      setActiveStatus(status);
      await api.updateTicketStatus(ticketId, status);
      await queryClient.invalidateQueries({ queryKey: keys.tickets(projectId) });
      await queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "conversations" });
      await queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "dashboard-summary" });
      showToast("Ticket status updated successfully.", "success");
    } catch (err) {
      await queryClient.invalidateQueries({ queryKey: keys.tickets(projectId) });
      showToast(err instanceof Error ? err.message : "Failed to update ticket status", "error");
    }
  };

  const ticketList = tickets.data ?? [];
  const filteredTickets =
    activeStatus === TicketStatusFilter.All ? ticketList : ticketList.filter((ticket) => ticket.status === activeStatus);
  const activeStatusLabel = ticketTabs.find((tab) => tab.value === activeStatus)?.label ?? "Tickets";
  const countByStatus = (status: TicketStatusFilterValue) =>
    status === TicketStatusFilter.All ? ticketList.length : ticketList.filter((ticket) => ticket.status === status).length;

  return (
    <div className="flex h-main flex-col bg-slate-50">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-950">Tickets</h1>
          <p className="truncate text-xs text-muted">{projectName}</p>
        </div>
        <Badge className="border-teal-100 bg-teal-50 text-brand">{tickets.data?.length ?? 0}</Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-48 space-y-3">
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          {ticketTabs.map((tab) => {
            const active = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                className={`inline-flex h-9 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
                  active
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
                onClick={() => setActiveStatus(tab.value)}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {countByStatus(tab.value)}
                </span>
              </button>
            );
          })}
        </div>

        <Card className="overflow-visible border-slate-200">
          <div className="grid grid-cols-[minmax(220px,1fr)_160px_150px_130px] gap-3 border-b bg-white px-4 py-3 text-xs font-semibold text-slate-500">
            <span>Customer</span>
            <span>Status</span>
            <span>Created</span>
            <span>Action</span>
          </div>

          {tickets.isLoading && (
            <div className="grid min-h-56 place-items-center text-sm text-muted">
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading tickets
              </span>
            </div>
          )}

          {!tickets.isLoading && !ticketList.length && (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-brand">
                  <TicketCheck size={22} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">No tickets yet</p>
                <p className="mt-1 text-xs text-muted">Raised tickets for this project will appear here.</p>
              </div>
            </div>
          )}

          {!tickets.isLoading && ticketList.length > 0 && !filteredTickets.length && (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <TicketCheck size={22} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">No {activeStatusLabel.toLowerCase()} tickets</p>
                <p className="mt-1 text-xs text-muted">Tickets with this status will appear here.</p>
              </div>
            </div>
          )}

          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="grid grid-cols-[minmax(220px,1fr)_160px_150px_130px] items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50"
            >
              <button
                type="button"
                className="flex min-w-0 items-center gap-3 text-left"
                onClick={() => openConversation(ticket.conversationId)}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-50 text-brand">
                  <User size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-950">{ticket.customerName}</span>
                  <span className="block truncate text-xs text-muted">{ticket.customerPhone ?? "Mobile not provided"}</span>
                </span>
              </button>

              <StatusDropdown value={ticket.status as TicketStatus} onChange={(status) => updateStatus(ticket.id, status)} />

              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Clock3 size={13} /> {formatShortDate(ticket.createdAt)}
              </span>

              <Button
                type="button"
                className="h-8 gap-1.5 border-slate-200 bg-white px-2 text-xs text-slate-700 hover:bg-slate-100"
                onClick={() => openConversation(ticket.conversationId)}
              >
                <CheckCircle2 size={14} /> Open chat
              </Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};
