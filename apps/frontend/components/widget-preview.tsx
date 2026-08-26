"use client";
import { useState } from "react";
import { Bot, Code2, MessageCircle, Send, X, Copy, Check } from "lucide-react";
import { Badge, Button, Card } from "@support-hub/ui";
import { buildWidgetSnippet } from "../lib/helpers";
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
  const botName = bot.data?.botName ?? `${projectName ?? "Support"} Assistant`;
  const fallbackMessage =
    widgetChannel?.welcomeMessage ??
    bot.data?.fallbackMessage ??
    "Hi, welcome in. Send us a message and our team will reply as soon as possible.";
  const snippet = buildWidgetSnippet(widgetChannel?.publicId);

  return (
    <Card className="overflow-hidden border-slate-200 xl:col-span-2">
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
            <MessageCircle size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold">Widget Preview</h2>
            <p className="text-xs text-muted">Customer chat preview for your website.</p>
          </div>
        </div>
        <Badge className="border-teal-100 bg-teal-50 text-brand">{widgetChannel?.publicId ?? projectKey ?? "Draft"}</Badge>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-preview">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="min-h-preview rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-8 w-36 rounded bg-slate-100" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="h-24 rounded border bg-slate-50" />
              <div className="h-24 rounded border bg-slate-50" />
              <div className="h-24 rounded border bg-slate-50" />
            </div>
            <div className="mt-4 h-28 rounded border bg-slate-50" />
            <div className="relative mt-5 h-32 rounded border bg-slate-50">
              <div className="absolute bottom-4 right-4">
                <WidgetBubble botName={botName} fallbackMessage={fallbackMessage} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <WidgetBubble botName={botName} fallbackMessage={fallbackMessage} expanded />
          <div className="rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
            <div className="mb-2 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Code2 size={14} />
                Install snippet
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
  expanded
}: {
  botName: string;
  fallbackMessage: string;
  expanded?: boolean;
}) {
  return (
    <div className={expanded ? "w-full" : "w-widget"}>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
              <Bot size={16} />
            </span>
            <div>
              <div className="text-sm font-semibold">{botName}</div>
              <div className="text-2xs text-white/80">Typically replies in a few minutes</div>
            </div>
          </div>
          <X size={16} />
        </div>
        <div className="space-y-3 bg-chat p-4">
          <div className="max-w-chat-msg rounded-md rounded-tl-sm bg-white p-3 text-xs leading-relaxed shadow-sm">
            {fallbackMessage}
          </div>
          <div className="ml-auto max-w-chat-reply rounded-md rounded-tr-sm bg-brand p-3 text-xs text-white">
            I need help with my order.
          </div>
          <div className="max-w-chat-msg rounded-md rounded-tl-sm bg-white p-3 text-xs leading-relaxed shadow-sm">
            Sure. Share your order email and we&apos;ll look it up.
          </div>
        </div>
        <div className="flex items-center gap-2 border-t bg-white p-3">
          <div className="h-9 flex-1 rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-400">Write a message...</div>
          <Button className="h-9 w-9 rounded-md border-0 bg-brand px-0 text-white">
            <Send size={15} />
          </Button>
        </div>
      </div>
      {!expanded && (
        <Button className="ml-auto mt-3 h-12 w-12 rounded-full border-0 bg-brand px-0 text-white shadow-lg">
          <MessageCircle size={20} />
        </Button>
      )}
    </div>
  );
}
