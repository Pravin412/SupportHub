"use client";
import { useState } from "react";
import { Bot, Code2, MessageCircle, Send, X, Copy, Check } from "lucide-react";
import { Badge, Button, Card } from "@support-hub/ui";
import { buildWidgetSnippet } from "@support-hub/utils";
import { useBotConfig, useChannels } from "../lib/queries";

export function WidgetPreview({
  projectId,
  projectKey,
  projectName
}: {
  projectId?: string;
  projectKey?: string;
  projectName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const bot = useBotConfig(projectId);
  const channels = useChannels(projectId);
  const widgetChannel = channels.data?.[0];
  const botName = bot.data?.botName ?? projectName ?? "Support Bot";
  const logoUrl = bot.data?.botAvatar || widgetChannel?.logoUrl || null;
  const colorTheme = widgetChannel?.colorTheme || "#0f4c42";
  const fallbackMessage =
    widgetChannel?.welcomeMessage ??
    bot.data?.fallbackMessage ??
    "Hi, welcome in. Send us a message and our team will reply as soon as possible.";
  const snippet = buildWidgetSnippet(widgetChannel?.channelId);

  return (
    <Card className="overflow-hidden border-slate-200 xl:col-span-2">
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
            <MessageCircle size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold">Live Chatbot Widget Preview</h2>
            <p className="text-xs text-muted">Customer chat preview with your custom logo and styling.</p>
          </div>
        </div>
        <Badge className="border-teal-100 bg-teal-50 text-brand">{widgetChannel?.channelId ?? projectKey ?? "Draft"}</Badge>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="min-h-preview rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-8 w-36 rounded bg-slate-100" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="h-24 rounded border bg-slate-50" />
              <div className="h-24 rounded border bg-slate-50" />
              <div className="h-24 rounded border bg-slate-50" />
            </div>
            <div className="relative mt-5 min-h-[380px] overflow-hidden rounded border bg-slate-50 p-2 sm:p-4">
              <div className="flex justify-end">
                <WidgetBubble botName={botName} fallbackMessage={fallbackMessage} logoUrl={logoUrl} colorTheme={colorTheme} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
            <div className="mb-2 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Code2 size={14} />
                Widget install snippet
              </div>
              <Button
                className="h-7 gap-1 border-0 bg-transparent px-2 text-slate-300 shadow-none hover:text-white"
                title="Copy to clipboard"
                onClick={() => {
                  navigator.clipboard.writeText(snippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-green-400" />
                    <span className="text-xs text-green-400">Copied!</span>
                  </>
                ) : (
                  <Copy size={14} />
                )}
              </Button>
            </div>
            <code className="block whitespace-pre-wrap break-all leading-relaxed">{snippet}</code>
          </div>
        </div>
      </div>
    </Card>
  );
}

function WidgetBubble({
  botName,
  fallbackMessage,
  logoUrl,
  colorTheme = "#0f4c42",
  expanded
}: {
  botName: string;
  fallbackMessage: string;
  logoUrl?: string | null;
  colorTheme?: string;
  expanded?: boolean;
}) {
  return (
    <div className={expanded ? "w-full" : "w-full max-w-widget"}>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: colorTheme }}>
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt={botName} className="h-8 w-8 rounded-full object-cover border border-white/30 shadow-xs" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
                <Bot size={16} />
              </span>
            )}
            <div>
              <div className="text-sm font-semibold">{botName}</div>
              <div className="text-2xs text-white/80">Typically replies in a few minutes</div>
            </div>
          </div>
          <X size={16} />
        </div>
        <div className="space-y-3 bg-chat p-4">
          <div className="flex items-start">
            <div className="max-w-chat-msg rounded-md rounded-tl-sm bg-white p-3 text-xs leading-relaxed shadow-sm">
              {fallbackMessage}
            </div>
          </div>

          <div className="ml-auto max-w-chat-reply rounded-md rounded-tr-sm p-3 text-xs text-white" style={{ backgroundColor: colorTheme }}>
            I need help with my order.
          </div>

          <div className="flex items-start">
            <div className="max-w-chat-msg rounded-md rounded-tl-sm bg-white p-3 text-xs leading-relaxed shadow-sm">
              Sure. Share your order email and we&apos;ll look it up.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t bg-white p-3">
          <div className="h-9 flex-1 rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-400">Write a message...</div>
          <Button className="h-9 w-9 rounded-md border-0 px-0 text-white" style={{ backgroundColor: colorTheme }}>
            <Send size={15} />
          </Button>
        </div>
      </div>
      {!expanded && (
        <Button className="ml-auto mt-3 h-12 w-12 rounded-full border-0 px-0 text-white shadow-lg relative overflow-hidden" style={{ backgroundColor: colorTheme }}>
          <MessageCircle size={20} />
        </Button>
      )}
    </div>
  );
}
