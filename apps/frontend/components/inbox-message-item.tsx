import { motion } from "framer-motion";
import { CheckCheck } from "lucide-react";
import { parseMessageOptions } from "@/lib/messages";
import { formatMessageTime } from "@/lib/format";

export function InboxMessageItem({ message, botName }: { message: any; botName?: string }) {
  const isAgent = message.senderType === "AGENT";
  const isBot = message.senderType === "BOT";
  const isOutgoing = isAgent || isBot;
  const time = formatMessageTime(message.createdAt);
  const { text: contentText, options: optionsList } = parseMessageOptions(message.content);

  return (
    <motion.div
      key={message.id}
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
}
