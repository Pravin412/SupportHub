"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, CirclePlus, MessageSquare, Send, Smile, Ticket, User } from "lucide-react";
import { Button, Input } from "@support-hub/ui";
import { api } from "../lib/api";
import { parseMessageOptions } from "../lib/messages";

export function InboxChatView({
  activeConversation,
  selectedProject,
  messages,
  draft,
  onDraftChange,
  onSend,
  isSending
}: {
  activeConversation: any;
  selectedProject: any;
  messages: any;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
}) {
  const activeId = activeConversation?.id;

  return (
    <div className="flex h-full flex-col">
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
          {messages.data?.slice().reverse().map((m: any) => {
            const isAgent = m.senderType === "AGENT";
            const isBot = m.senderType === "BOT";
            const time = formatMessageTime(m.createdAt);

            const { text: contentText, options: optionsList } = parseMessageOptions(m.content);

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
                        <span key={i} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                          {opt.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-500 ${isAgent ? "pr-1" : "pl-1"}`}>
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
