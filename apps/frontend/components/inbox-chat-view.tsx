"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCheck, CirclePlus, Loader2, MessageSquare, Send, Smile, User, ChevronDown, Trash2 } from "lucide-react";
import { Button, Input } from "@support-hub/ui";
import { useUiStore } from "../lib/store";
import { api } from "../lib/api";
import { useUpdateConversationStatus, useDeleteContact } from "../lib/queries";
import { parseMessageOptions } from "../lib/messages";
import { ConfirmationModal } from "./confirmation-modal";

export function InboxChatView({
  activeConversation,
  selectedProject,
  botName,
  messages,
  draft,
  onDraftChange,
  onSend,
  isSending
}: {
  activeConversation: any;
  selectedProject: any;
  botName?: string;
  messages: any;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
}) {
  const ui = useUiStore();
  const activeId = activeConversation?.id;
  const updateStatus = useUpdateConversationStatus();
  const deleteContact = useDeleteContact();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isResolved = activeConversation?.status === "RESOLVED";
  const isAssignedToAgent = activeConversation?.automationMode === "HUMAN" || activeConversation?.status === "OPEN";
  const chatStateLabel = isResolved ? "Resolved" : isAssignedToAgent ? "Assigned to agent" : "Bot active";

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLength = useRef(messages.data?.length ?? 0);
  const currentUserIsSender = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceToBottom < 100;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const currentLength = messages.data?.length ?? 0;
    if (currentLength > prevMessagesLength.current) {
      const newMessages = currentLength - prevMessagesLength.current;
      if (isAtBottom || currentUserIsSender.current) {
        requestAnimationFrame(() => scrollToBottom("smooth"));
      } else {
        setUnreadCount((prev) => prev + newMessages);
      }
    }
    prevMessagesLength.current = currentLength;
    currentUserIsSender.current = false;
  }, [messages.data?.length, isAtBottom]);

  useEffect(() => {
    setIsAtBottom(true);
    setUnreadCount(0);
    prevMessagesLength.current = messages.data?.length ?? 0;
    requestAnimationFrame(() => scrollToBottom("auto"));
  }, [activeId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shrink-0">
        <div className="flex flex-1 min-w-0 items-center gap-3">
          <button 
            type="button"
            className="md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200" 
            onClick={() => ui.setConversation("")}
            title="Back to inbox"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-100 text-brand">
            <User size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <strong className="truncate text-xs font-bold text-secondary leading-tight">
                {activeConversation?.contactName ?? "Customer"}
              </strong>
              {activeConversation?.contactPhone && (
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                  {activeConversation.contactPhone}
                </span>
              )}
              {activeConversation?.externalUserId && (
                <span className="hidden md:inline-block shrink-0 max-w-[120px] truncate rounded bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] text-teal-700" title={activeConversation.externalUserId}>
                  ID: {activeConversation.externalUserId}
                </span>
              )}
            </div>
            <span className="truncate text-[10px] text-muted block mt-0.5">
              {selectedProject ? `${selectedProject.name} - ` : ""}{chatStateLabel}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 ml-2">
          {activeConversation?.status === "OPEN" && (
            <Button
              className="h-7 gap-1.5 rounded border border-teal-600 bg-teal-50 px-3 text-xs font-semibold text-teal-700 shadow-sm hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => activeId && updateStatus.mutate({ id: activeId, status: "RESOLVED" })}
              disabled={!activeId || updateStatus.isPending}
            >
              {updateStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              {updateStatus.isPending ? "Resolving..." : "Resolve"}
            </Button>
          )}
          <Button
            className="h-7 w-7 p-0 text-muted hover:text-red-600 hover:bg-red-50 bg-transparent border-none shadow-none"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteContact.isPending}
            title="Delete contact"
          >
            {deleteContact.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-chat-pane">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-auto px-5 py-6"
        >
        <AnimatePresence>
          {messages.data?.slice().reverse().map((m: any) => {
            const isAgent = m.senderType === "AGENT";
            const isBot = m.senderType === "BOT";
            const isOutgoing = isAgent || isBot;
            const time = formatMessageTime(m.createdAt);

            const { text: contentText, options: optionsList } = parseMessageOptions(m.content);

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 flex flex-col ${isOutgoing ? "items-end" : "items-start"}`}
              >
                <div
                  className={
                    isOutgoing
                      ? "max-w-chat-bubble rounded-2xl rounded-br-xs bg-chat-bubble-bg px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm whitespace-pre-wrap"
                      : "max-w-chat-bubble rounded-2xl rounded-bl-xs bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-700 shadow-sm border border-slate-100 whitespace-pre-wrap"
                  }
                >
                  {isBot && (
                    <span className="mb-1 block text-[10px] font-bold uppercase text-white/80">
                      {botName?.trim() || "Support Bot"}
                    </span>
                  )}
                  {contentText}
                  {optionsList.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                      {optionsList.map((opt, i) => (
                        <span key={i} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                          {opt.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-500 ${isOutgoing ? "pr-1" : "pl-1"}`}>
                  <span>{time}</span>
                  {isOutgoing ? <CheckCheck size={12} className="text-chat-bubble-bg" /> : null}
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
        <AnimatePresence>
          {!isAtBottom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-4 right-6 z-10"
            >
              <Button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50 p-0"
                onClick={() => scrollToBottom()}
              >
                <ChevronDown size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0a6f66] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form
        className="border-t border-slate-100 bg-white px-4 py-3 sm:px-8 lg:px-12"
        onSubmit={(e) => {
          e.preventDefault();
          currentUserIsSender.current = true;
          onSend();
        }}
      >
        <div className="flex h-12 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 shadow-sm">
          <Button type="button" title="Add attachment" className="h-8 w-8 shrink-0 rounded-full border-0 px-0 text-slate-600 hover:bg-slate-100">
            <CirclePlus size={18} />
          </Button>
          <Input
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 border-none shadow-none focus:ring-0"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                currentUserIsSender.current = true;
                onSend();
              }
            }}
            placeholder="Type a message..."
          />
          <Button type="button" title="Add emoji" className="h-8 w-8 shrink-0 rounded-full border-0 px-0 text-slate-600 hover:bg-slate-100">
            <Smile size={18} />
          </Button>
          <Button
            type="submit"
            className="h-9 w-9 shrink-0 rounded-full border-0 bg-[#00594f] px-0 text-white shadow-sm hover:bg-[#004a42] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!draft.trim() || isSending}
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
      <ConfirmationModal
        open={showDeleteConfirm}
        title="Delete contact"
        message="Are you sure you want to permanently delete this contact and all their conversations? This cannot be undone."
        confirmLabel={deleteContact.isPending ? "Deleting..." : "Delete Contact"}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (activeConversation?.contactId && activeConversation?.projectId) {
            deleteContact.mutate({ projectId: activeConversation.projectId, contactId: activeConversation.contactId }, {
              onSuccess: () => {
                ui.showToast("Contact deleted.", "success");
                ui.setConversation(undefined);
                setShowDeleteConfirm(false);
              },
              onError: (err: any) => {
                ui.showToast(err.message || "Failed to delete contact.", "error");
              }
            });
          }
        }}
      />
    </div>
  );
}

export function InboxEmptyState({ selectedProjectId }: { selectedProjectId?: string }) {
  return (
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
  );
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}
