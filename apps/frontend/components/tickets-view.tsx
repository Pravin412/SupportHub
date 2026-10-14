"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, Search, TicketCheck, User } from "lucide-react";
import { Badge, Button, Input } from "@support-hub/ui";
import { api } from "../lib/api";
import { keys, useTickets } from "../lib/queries";
import { useInboxSelectionStore } from "../lib/inbox-selection-store";
import { displayToast } from "../lib/display-toast";
import { formatShortDate } from "../lib/format";
import { TicketStatus, TicketStatusFilter, ticketTabs, type TicketStatusFilterValue } from "../lib/ticket-status";
import { StatusDropdown } from "./ticket-status-dropdown";
import { useDebouncedSearch } from "../hooks/use-debounced-search";

export const TicketsView = ({ projectId, projectName }: { projectId: string; projectName: string }) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedSearch(search);
  const tickets = useTickets(projectId, debouncedSearch);
  const [activeStatus, setActiveStatus] = useState<TicketStatusFilterValue>(TicketStatus.Open);
  const queryClient = useQueryClient();
  const router = useRouter();
  const setProject = useInboxSelectionStore((state) => state.setProject);
  const setConversation = useInboxSelectionStore((state) => state.setConversation);


  useEffect(() => {
    setActiveStatus(TicketStatus.Open);
    setSearch("");
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
      displayToast("Ticket status updated successfully.", "success");
    } catch (err) {
      await queryClient.invalidateQueries({ queryKey: keys.tickets(projectId) });
      displayToast(err instanceof Error ? err.message : "Failed to update ticket status", "destructive");
    }
  };

  const ticketList = tickets.data ?? [];
  const filteredTickets =
    activeStatus === TicketStatusFilter.All ? ticketList : ticketList.filter((ticket) => ticket.status === activeStatus);
  const activeStatusLabel = ticketTabs.find((tab) => tab.value === activeStatus)?.label ?? "Tickets";
  const countByStatus = (status: TicketStatusFilterValue) =>
    status === TicketStatusFilter.All ? ticketList.length : ticketList.filter((ticket) => ticket.status === status).length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f7f9fc]">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-4 pt-6 lg:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-950">Tickets</h1>
          <p className="max-w-full truncate rounded border border-teal-200 bg-white px-2 py-0.5 text-xs text-teal-700">{projectName}</p>
        </div>
        <Badge className="shrink-0 border-teal-100 bg-teal-50 text-brand">{tickets.data?.length ?? 0}</Badge>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-8 lg:px-6">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          aria-label="Search tickets by ticket ID, customer name, or phone number"
          placeholder="Search ticket ID, customer name, or phone number"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-10 w-full rounded-lg border-slate-200 bg-white pl-9 text-xs shadow-none placeholder:text-slate-400"
        />
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
          {ticketTabs.map((tab) => {
            const active = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                className={`inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-medium transition-colors ${
                  active
                    ? "border-teal-500 text-teal-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
                onClick={() => setActiveStatus(tab.value)}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {countByStatus(tab.value)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <div className="min-w-[650px]">
          <div className="grid grid-cols-[minmax(220px,1fr)_140px_120px_110px] gap-3 border-b border-slate-200 bg-[#fbfcfe] px-4 py-3 text-[10px] font-semibold uppercase text-slate-500">
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
                <p className="mt-3 text-sm font-semibold text-slate-900">{debouncedSearch ? "No matching tickets" : "No tickets yet"}</p>
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
              className="grid grid-cols-[minmax(220px,1fr)_140px_120px_110px] items-center gap-3 border-b border-slate-100 bg-white px-4 py-4 text-sm last:border-b-0 hover:bg-teal-50/30"
            >
              <button
                type="button"
                className="flex min-w-0 items-center gap-3 text-left"
                onClick={() => openConversation(ticket.conversationId)}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-100/70 text-brand">
                  <User size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-slate-950">{ticket.customerName}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">{ticket.customerPhone ?? "Mobile not provided"}</span>
                  <span className="mt-1 block break-all font-mono text-[10px] text-teal-700">ID: {ticket.id}</span>
                </span>
              </button>

              <StatusDropdown value={ticket.status as TicketStatus} onChange={(status) => updateStatus(ticket.id, status)} />

              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Clock3 size={13} /> {formatShortDate(ticket.createdAt)}
              </span>

              <Button
                type="button"
                className="h-8 gap-1.5 rounded-md border-teal-100 bg-teal-50 px-2 text-xs text-teal-700 shadow-none hover:bg-teal-100"
                onClick={() => openConversation(ticket.conversationId)}
              >
                <CheckCircle2 size={14} /> Open chat
              </Button>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
};
