"use client";
import { CheckCheck } from "lucide-react";

export function WidgetMessagesList({
  messages,
  themeColor,
  isSending,
  onSendOption,
  messagesEndRef
}: {
  messages: any[];
  themeColor: string;
  isSending: boolean;
  onSendOption: (text: string) => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
      {messages.map((msg) => {
        const isUser = msg.senderType === "CUSTOMER";
        const time = msg.createdAt ? formatMessageTime(msg.createdAt) : formatMessageTime(new Date().toISOString());

        let parsedContent: { text?: string; options?: Array<{ title: string; value: string }>; isOptions?: boolean } | null = null;
        try {
          if (typeof msg.content === "string" && msg.content.startsWith("{") && msg.content.includes('"isOptions"')) {
            parsedContent = JSON.parse(msg.content);
          }
        } catch {
          parsedContent = null;
        }

        const displayText = parsedContent?.text || msg.content;
        const optionsList = parsedContent?.options || [];

        return (
          <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
            <div className={`flex items-start gap-2 max-w-[90%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              <div
                style={isUser ? { backgroundColor: themeColor, color: "white", borderRadius: "16px 16px 0px 16px" } : { borderRadius: "16px 16px 16px 0px" }}
                className={`p-3 text-sm shadow-sm whitespace-pre-wrap ${
                  isUser ? "" : "bg-white border border-slate-200 text-slate-800"
                }`}
              >
                {displayText}

                {optionsList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                    {optionsList.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={async () => {
                          const optionText = opt.value || opt.title;
                          if (!optionText || isSending) return;
                          await onSendOption(optionText);
                        }}
                        style={{ borderColor: themeColor, color: themeColor }}
                        className="rounded-full border bg-white px-3 py-1 text-xs font-semibold shadow-2xs transition-all hover:bg-slate-50 active:scale-95 cursor-pointer"
                      >
                        {opt.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {msg.id !== "welcome" && (
              <div className={`mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-500 ${isUser ? "pr-1" : "pl-1"}`}>
                <span>{time}</span>
                {isUser ? <CheckCheck size={12} style={{ color: themeColor }} /> : null}
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

export function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}
