"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCheck,
  CirclePlus,
  Folder,
  MessageSquare,
  Search,
  Send,
  Smile,
  Ticket,
  User
} from "lucide-react";
import { Badge, Button, Input } from "@support-hub/ui";
import { useState, useEffect, useRef } from "react";
import { useUiStore } from "../../../lib/store";
import { useConversations, useMessages, useProjects, useSendMessage, keys } from "../../../lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function InboxPage() {
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const ui = useUiStore();
  const queryClient = useQueryClient();
  const projects = useProjects(true);

  const selectedProjectId = ui.selectedProjectId;
  const selectedProject = projects.data?.find((p) => p.id === selectedProjectId);

  const conversations = useConversations(selectedProjectId, searchQuery);

  const activeConversation =
    conversations.data?.find((c) => c.id === ui.selectedConversationId) ??
    (ui.selectedConversationId ? undefined : conversations.data?.[0]);
  const activeId = activeConversation?.id;

  const messages = useMessages(activeId);
  const send = useSendMessage(activeId);

  const socketRef = useRef<Socket | null>(null);

  // Connect to realtime socket for instant inbox messages & conversation updates
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true
    });
    socketRef.current = socket;

    if (selectedProjectId) {
      socket.emit("project:subscribe", selectedProjectId);
    }
    if (activeId) {
      socket.emit("conversation:subscribe", activeId);
    }

    socket.on("message.created", (newMsg) => {
      // Invalidate messages for the affected conversation
      if (newMsg.conversationId) {
        queryClient.invalidateQueries({ queryKey: keys.messages(newMsg.conversationId) });
      }
      // Invalidate conversations list so last message / status updates
      if (selectedProjectId) {
        queryClient.invalidateQueries({ queryKey: keys.conversations(selectedProjectId, searchQuery) });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedProjectId, activeId, searchQuery, queryClient]);

  const sendDraft = () => {
    const content = draft.trim();
    if (!content || send.isPending || !activeId) return;
    send.mutate(content, { onSuccess: () => setDraft("") });
  };

  const handleSelectProject = (id: string) => {
    ui.setProject(id);
    setSearchQuery("");
  };

  const handleBackToProjects = () => {
    ui.setProject("");
  };

  return (
    <div className="grid h-main md:grid-cols-inbox">
      {/* Left Sidebar: Projects List OR Contacts List */}
      <section className="flex h-full flex-col border-r border-border bg-white">
        {!selectedProjectId ? (
          // 1. Projects View
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
              {projects.data?.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-teal-50/70"
                  onClick={() => handleSelectProject(p.id)}
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
        ) : (
          // 2. Contacts / Conversations View
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-border bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  title="Back to Projects"
                  className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-white p-0 text-secondary hover:bg-slate-100 hover:text-primary"
                  onClick={handleBackToProjects}
                >
                  <ArrowLeft size={16} />
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-primary">
                    {selectedProject?.name ?? "Project"}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.isLoading && (
                <div className="p-4 text-center text-xs text-muted">Loading contacts...</div>
              )}
              {conversations.data?.map((c) => {
                const isSelected = c.id === (activeId ?? ui.selectedConversationId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`block w-full border-b border-border/70 p-3.5 text-left transition-colors ${
                      isSelected ? "bg-teal-50/80 border-l-4 border-l-brand" : "bg-white hover:bg-slate-50"
                    }`}
                    onClick={() => ui.setConversation(c.id)}
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
                        {c.preview || "No message content"}
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
        )}
      </section>

      {/* Right Section: Active Chat View */}
      <section className="flex min-h-0 flex-col bg-[#f3f6f4]">
        {activeId ? (
          <>
            <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-brand">
                  <User size={16} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-secondary leading-tight">
                      {activeConversation?.contactName ?? "Customer"}
                    </strong>
                    {activeConversation?.contactPhone && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                        {activeConversation.contactPhone}
                      </span>
                    )}
                    {activeConversation?.externalUserId && (
                      <span className="rounded bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] text-teal-700">
                        ID: {activeConversation.externalUserId}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted block mt-0.5">
                    {selectedProject ? `${selectedProject.name} • ` : ""}Active Chat
                  </span>
                </div>
              </div>
              <Button
                className="h-7 gap-1.5 rounded border-slate-200 bg-white px-3 text-xs font-semibold text-secondary shadow-sm hover:bg-slate-50"
                onClick={() => activeId && api.createTicket(activeId, "Customer support follow-up")}
              >
                <Ticket size={14} />
                Ticket
              </Button>
            </div>

            <div className="flex-1 overflow-auto bg-[#f3f6f4] px-5 py-6">
              <AnimatePresence>
                {messages.data
                  ?.slice()
                  .reverse()
                  .map((m) => {
                    const isAgent = m.senderType === "AGENT";
                    const isBot = m.senderType === "BOT";
                    const time = formatMessageTime(m.createdAt);

                    // Parse option content if present
                    let contentText = m.content;
                    let optionsList: Array<{ title: string; value: string }> = [];
                    try {
                      if (typeof m.content === "string" && m.content.startsWith("{") && m.content.includes('"isOptions"')) {
                        const parsed = JSON.parse(m.content);
                        contentText = parsed.text || m.content;
                        optionsList = parsed.options || [];
                      }
                    } catch {
                      contentText = m.content;
                    }

                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={
                            isAgent
                              ? "max-w-[320px] rounded-2xl rounded-br-xs bg-[#0a6f66] px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm whitespace-pre-wrap"
                              : isBot
                              ? "max-w-[320px] rounded-2xl rounded-bl-xs bg-slate-100 px-4 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm border border-slate-200 whitespace-pre-wrap"
                              : "max-w-[320px] rounded-2xl rounded-bl-xs bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-700 shadow-sm border border-slate-100 whitespace-pre-wrap"
                          }
                        >
                          {isBot && (
                            <span className="block text-[10px] font-bold uppercase text-teal-700 mb-1">Bot</span>
                          )}
                          {contentText}
                          {optionsList.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                              {optionsList.map((opt, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200"
                                >
                                  {opt.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div
                          className={`mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-500 ${
                            isAgent ? "pr-1" : "pl-1"
                          }`}
                        >
                          <span>{time}</span>
                          {isAgent ? <CheckCheck size={12} className="text-[#0a6f66]" /> : null}
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
              {!messages.isLoading && !messages.data?.length && (
                <div className="grid h-full place-items-center text-center text-xs text-muted">
                  No messages in this conversation yet. Send a greeting below!
                </div>
              )}
            </div>

            <form
              className="border-t border-slate-100 bg-white px-4 py-3 sm:px-8 lg:px-12"
              onSubmit={(e) => {
                e.preventDefault();
                sendDraft();
              }}
            >
              <div className="flex h-12 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 shadow-sm">
                <Button
                  type="button"
                  title="Add attachment"
                  className="h-8 w-8 shrink-0 rounded-full border-0 px-0 text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <CirclePlus size={18} />
                </Button>
                <Input
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 border-none shadow-none focus:ring-0"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendDraft();
                    }
                  }}
                  placeholder="Type a message..."
                />
                <Button
                  type="button"
                  title="Add emoji"
                  className="h-8 w-8 shrink-0 rounded-full border-0 px-0 text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Smile size={18} />
                </Button>
                <Button
                  type="submit"
                  className="h-9 w-9 shrink-0 rounded-full border-0 bg-[#00594f] px-0 text-white shadow-sm transition-colors hover:bg-[#004a42] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!draft.trim() || send.isPending}
                >
                  <Send size={16} />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="grid h-full place-items-center bg-[#f8fafc] p-6 text-center">
            <div className="max-w-xs space-y-2">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-brand">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-sm font-semibold text-primary">
                {!selectedProjectId ? "Select a Project" : "Select a Conversation"}
              </h3>
              <p className="text-xs text-muted">
                {!selectedProjectId
                  ? "Click on any project on the left to browse contacts and conversation threads."
                  : "Choose a contact from the list on the left to start viewing and replying to their messages."}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}

