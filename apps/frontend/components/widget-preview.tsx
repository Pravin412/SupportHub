"use client";
import { useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Badge, Card } from "@support-hub/ui";
import { useBotConfig, useChannels } from "../lib/queries";
import { WidgetFrame } from "./widget-frame";
import type { ChannelDto } from "../lib/types";

export function WidgetPreview({ projectId, projectKey, projectName }: {
  projectId?: string;
  projectKey?: string;
  projectName?: string;
}) {
  const bot = useBotConfig(projectId);
  const channels = useChannels(projectId);
  const channel = channels.data?.[0];
  const config = {
    ...channel,
    botName: bot.data?.botName || channel?.name || projectName || "Support Bot",
    logoUrl: channel?.logoUrl || null,
    botAvatar: bot.data?.botAvatar || null,
    welcomeMessage: channel?.welcomeMessage || bot.data?.fallbackMessage || "Hi, welcome in. Send us a message and our team will reply as soon as possible.",
    colorTheme: channel?.colorTheme || "#0f4c42"
  };

  return (
    <Card className="overflow-hidden border-slate-200 xl:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal-50 text-brand"><MessageCircle size={18} /></span>
          <h2 className="text-base font-semibold">Live Chatbot Widget Preview</h2>
        </div>
        <Badge className="max-w-full break-all whitespace-normal border-teal-100 bg-teal-50 text-brand">{channel?.channelId ?? projectKey ?? "Draft"}</Badge>
      </div>
      <PreviewWidget key={projectId} config={config} channelId={channel?.channelId} />
    </Card>
  );
}

function PreviewWidget({ config, channelId }: {
  config: Partial<ChannelDto> & { botName: string; botAvatar: string | null; logoUrl: string | null; welcomeMessage: string; colorTheme: string };
  channelId?: string;
}) {
  const [started, setStarted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; content: string; senderType: string }>>([]);
  const [visitorForm, setVisitorForm] = useState({ name: "", email: "", number: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const themeColor = config.colorTheme || "#0f4c42";
  const startChat = () => {
    setStarted(true);
    setShowForm(false);
  };
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((current) => [...current, { id: `preview-${Date.now()}`, content: text.trim(), senderType: "CUSTOMER" }]);
    setMessage("");
  };

  return (
    <div className="flex justify-center bg-chat p-3 sm:p-6">
        <div className="flex w-full max-w-widget flex-col items-end gap-3">
          <div className="h-widget-preview w-full">
            <WidgetFrame
              config={config}
              channelId={channelId || "preview"}
              activeUser={{ profileId: "preview" }}
              conversationStarted={started}
              shouldShowNewConversationScreen={!started}
              shouldShowVisitorForm={showForm}
              startConversation={() => config.collectVisitorInfo ? setShowForm(true) : startChat()}
              visitorForm={visitorForm}
              saveVisitorForm={(values) => { setVisitorForm(values); startChat(); }}
              messages={[{ id: "welcome", content: config.welcomeMessage, senderType: "BOT" }, ...messages]}
              messagesEndRef={messagesEndRef}
              message={message}
              setMessage={setMessage}
              isSending={false}
              handleSend={(event) => { event.preventDefault(); void sendMessage(message); }}
              handleOptionSend={sendMessage}
              themeColor={themeColor}
              onClose={() => {}}
            />
          </div>
          <div role="img" aria-label="Widget launcher" className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full text-white shadow-lg" style={{ backgroundColor: themeColor }}>
            {config.logoUrl ? <img src={config.logoUrl} alt="Bot launcher" className="h-full w-full object-cover" /> : <MessageCircle size={24} />}
          </div>
        </div>
    </div>
  );
}
