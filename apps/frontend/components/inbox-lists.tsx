"use client";
import { Folder, Search, User } from "lucide-react";
import { Badge, Button, Input } from "@support-hub/ui";
import { displayMessageContent } from "../lib/messages";
import { BackButton } from "./back-button";

export function InboxProjectsList({
  projects,
  onSelectProject
}: {
  projects: any;
  onSelectProject: (id: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border bg-slate-50 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded bg-teal-100 text-brand">
              <Folder size={15} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-primary">Projects</h2>
              <p className="text-[11px] text-muted">Select a project to view contacts</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {projects.data?.length ?? 0}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {projects.isLoading && (
          <div className="p-4 text-center text-xs text-muted">Loading projects...</div>
        )}
        {projects.data?.map((p: any) => (
          <button
            key={p.id}
            type="button"
            className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-teal-50/70"
            onClick={() => onSelectProject(p.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-sm text-primary group-hover:text-brand">
                  {p.name}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                  {p.key}
                </span>
                <span className="truncate">Click to view contacts</span>
              </div>
            </div>
            <div className="ml-2 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
              Open &rarr;
            </div>
          </button>
        ))}
        {!projects.isLoading && !projects.data?.length && (
          <div className="p-6 text-center text-xs text-muted">
            No projects found. Create one in the Projects tab.
          </div>
        )}
      </div>
    </div>
  );
}

export function InboxConversationsList({
  projectName,
  searchQuery,
  onSearchChange,
  onBack,
  conversations,
  activeId,
  onSelectConversation
}: {
  projectName?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onBack: () => void;
  conversations: any;
  activeId?: string;
  onSelectConversation: (id: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border bg-slate-50 p-3">
        <div className="flex items-center gap-2">
          <BackButton title="Back to projects" className="h-8 w-8" onClick={onBack} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-primary">
              {projectName ?? "Project"}
            </div>
            <div className="text-[11px] text-muted">Contacts & Conversations</div>
          </div>
        </div>

        <div className="relative mt-2.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-dark" size={13} />
          <Input
            className="h-8 w-full rounded border border-slate-200 bg-white pl-8 pr-2 text-xs placeholder:text-slate-400 focus:border-brand"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.isLoading && (
          <div className="p-4 text-center text-xs text-muted">Loading contacts...</div>
        )}
        {conversations.data?.map((c: any) => {
          const isSelected = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              className={`block w-full border-b border-border/70 p-3.5 text-left transition-colors ${
                isSelected ? "bg-teal-50/80 border-l-4 border-l-brand" : "bg-white hover:bg-slate-50"
              }`}
              onClick={() => onSelectConversation(c.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
                    <User size={14} />
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-xs font-semibold text-primary leading-tight">
                      {c.contactName ?? "Customer"}
                    </strong>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                      {c.contactPhone && (
                        <span className="truncate text-slate-600 font-mono text-[10px]">
                          {c.contactPhone}
                        </span>
                      )}
                      {c.externalUserId && !c.contactPhone && (
                        <span className="truncate text-slate-500 font-mono text-[10px]">
                          ID: {c.externalUserId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {Boolean(c.unreadCount && c.unreadCount > 0 && !isSelected) && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white shadow-xs">
                      {c.unreadCount}
                    </span>
                  )}
                  <Badge className="text-[10px] uppercase tracking-wider">{c.status}</Badge>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 pl-9">
                <p className={`truncate text-xs ${c.unreadCount && c.unreadCount > 0 && !isSelected ? "font-semibold text-slate-900" : "text-muted"}`}>
                  {displayMessageContent(c.preview) || "No message content"}
                </p>
              </div>
            </button>
          );
        })}
        {!conversations.isLoading && !conversations.data?.length && (
          <div className="p-6 text-center text-xs text-muted">
            {searchQuery ? "No contacts matching search." : "No contacts/conversations in this project yet."}
          </div>
        )}
      </div>
    </div>
  );
}
