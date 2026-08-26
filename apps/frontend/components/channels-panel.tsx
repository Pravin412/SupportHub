"use client";
import { useState } from "react";
import { Code2, Copy, Globe, MessageCircle, Save } from "lucide-react";
import { Badge, Button, Card, Input } from "@support-hub/ui";
import { buildWidgetSnippet } from "../lib/helpers";
import { useChannels, useUpdateWidget } from "../lib/queries";
import { useUiStore } from "../lib/store";

export function ChannelsPanel({ projectId }: { projectId?: string }) {
  const channels = useChannels(projectId);
  const updateWidget = useUpdateWidget(projectId);
  const showToast = useUiStore((state) => state.showToast);
  const [welcomeMessage, setWelcomeMessage] = useState<Record<string, string>>({});
  const [colorTheme, setColorTheme] = useState<Record<string, string>>({});

  const handleSave = (channelId: string, currentWelcome: string, currentColor: string) => {
    updateWidget.mutate(
      {
        welcomeMessage: welcomeMessage[channelId] ?? currentWelcome,
        colorTheme: colorTheme[channelId] ?? currentColor
      },
      {
        onSuccess: () => {
          showToast("Widget channel settings saved successfully!", "success");
        },
        onError: (err) => {
          showToast(err.message || "Failed to save widget settings", "error");
        }
      }
    );
  };

  return (
    <Card className="overflow-hidden border-slate-200 xl:col-span-2">
      <div className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
          <Globe size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold">Channels</h2>
          <p className="text-xs text-muted">Each project automatically gets a website widget channel.</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {channels.data?.map((channel) => {
          const snippet = buildWidgetSnippet(channel.publicId);
          return (
            <div key={channel.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-teal-50 text-brand">
                    <MessageCircle size={18} />
                  </span>
                  <div>
                    <div className="font-semibold">{channel.name}</div>
                    <div className="mt-1 text-xs text-muted">Website widget · Project key {channel.projectKey}</div>
                    <div className="mt-2 font-mono text-xs text-slate-600">Channel ID: {channel.publicId}</div>
                  </div>
                </div>
                <Badge className="border-teal-100 bg-teal-50 text-brand">{channel.enabled ? "Active" : "Disabled"}</Badge>
              </div>

              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Widget Settings</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Welcome Message</span>
                    <Input 
                      className="mt-1" 
                      value={welcomeMessage[channel.id] ?? (channel as any).welcomeMessage ?? ""} 
                      onChange={(e) => setWelcomeMessage(prev => ({ ...prev, [channel.id]: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Color Theme (Hex)</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="color" 
                        className="h-10 w-12 cursor-pointer rounded-md border" 
                        value={colorTheme[channel.id] ?? (channel as any).colorTheme ?? "#0f4c42"} 
                        onChange={(e) => setColorTheme(prev => ({ ...prev, [channel.id]: e.target.value }))}
                      />
                      <Input 
                        className="flex-1 font-mono uppercase" 
                        value={colorTheme[channel.id] ?? (channel as any).colorTheme ?? "#0f4c42"} 
                        onChange={(e) => setColorTheme(prev => ({ ...prev, [channel.id]: e.target.value }))}
                      />
                    </div>
                  </label>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button 
                    className="gap-2 h-9 text-xs bg-brand text-white hover:bg-brand/90" 
                    disabled={updateWidget.isPending}
                    onClick={() => handleSave(channel.id, (channel as any).welcomeMessage, (channel as any).colorTheme)}
                  >
                    <Save size={14} /> {updateWidget.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                  {updateWidget.isSuccess && (
                    <span className="text-xs font-semibold text-emerald-600">Saved successfully!</span>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                <div className="mb-2 flex items-center gap-2 text-slate-300">
                  <Code2 size={14} />
                  Install this channel
                </div>
                <code className="block break-all leading-relaxed">{snippet}</code>
              </div>
              <Button
                className="mt-3 h-9 gap-2 border-slate-200 bg-white text-xs text-slate-900"
                onClick={() => navigator.clipboard?.writeText(snippet)}
              >
                <Copy size={14} />
                Copy Snippet
              </Button>
            </div>
          );
        })}
        {!channels.isLoading && !channels.data?.length && (
          <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-muted">
            No channel is available for this project yet.
          </div>
        )}
      </div>
    </Card>
  );
}
