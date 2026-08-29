"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Code2, Copy, Globe, MessageCircle, Save } from "lucide-react";
import { Badge, Button, Card, Input } from "@support-hub/ui";
import { buildWidgetSnippet } from "../lib/helpers";
import { api } from "../lib/api";
import { keys, useBotConfig, useChannels, useUpdateWidget } from "../lib/queries";
import { useUiStore } from "../lib/store";
import { ChannelLogoUpload, ChannelVisitorSettingsForm } from "./channels-panel-subcomponents";

export function ChannelsPanel({ projectId }: { projectId?: string }) {
  const channels = useChannels(projectId);
  const botConfig = useBotConfig(projectId);
  const updateWidget = useUpdateWidget(projectId);
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);
  const [welcomeMessage, setWelcomeMessage] = useState<Record<string, string>>({});
  const [colorTheme, setColorTheme] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState<Record<string, string>>({});
  const [botName, setBotName] = useState<Record<string, string>>({});
  const [visitorSettings, setVisitorSettings] = useState<Record<string, {
    collectVisitorInfo: boolean;
    visitorNameEnabled: boolean;
    visitorEmailEnabled: boolean;
    visitorPhoneEnabled: boolean;
  }>>({});

  const handleImageFile = (channelId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.", "error");
      return;
    }
    if (file.size > 600 * 1024) {
      showToast("Image must be smaller than 600KB for widget upload.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) setLogoUrl((prev) => ({ ...prev, [channelId]: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (channelId: string, currentWelcome: string, currentColor: string, currentLogo: string | undefined, channel: any) => {
    const settings = visitorSettings[channelId] ?? channel;
    const nextBotName = botName[channelId]?.trim();
    updateWidget.mutate(
      {
        welcomeMessage: welcomeMessage[channelId] ?? currentWelcome,
        colorTheme: colorTheme[channelId] ?? currentColor,
        logoUrl: logoUrl[channelId] !== undefined ? logoUrl[channelId] : currentLogo,
        collectVisitorInfo: settings.collectVisitorInfo,
        visitorNameEnabled: settings.visitorNameEnabled,
        visitorEmailEnabled: settings.visitorEmailEnabled,
        visitorPhoneEnabled: settings.visitorPhoneEnabled
      },
      {
        onSuccess: async () => {
          if (projectId && nextBotName && botConfig.data) {
            await api.updateBotConfig(projectId, {
              responseMode: botConfig.data.responseMode,
              botName: nextBotName,
              fallbackMessage: botConfig.data.fallbackMessage,
              botAvatar: botConfig.data.botAvatar ?? undefined
            });
            await queryClient.invalidateQueries({ queryKey: keys.botConfig(projectId) });
          }
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
          <h2 className="text-base font-semibold">Channels & Chatbot Widget</h2>
          <p className="text-xs text-muted">Customize your website chatbot's logo, colors, and welcome messaging.</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {channels.data?.map((channel) => {
          const snippet = buildWidgetSnippet(channel.publicId);
          const currentLogo = logoUrl[channel.id] !== undefined ? logoUrl[channel.id] : (channel.logoUrl ?? "");
          const currentBotName = botName[channel.id] ?? botConfig.data?.botName ?? "Support Bot";
          const currentVisitorSettings = visitorSettings[channel.id] ?? {
            collectVisitorInfo: channel.collectVisitorInfo,
            visitorNameEnabled: channel.visitorNameEnabled,
            visitorEmailEnabled: channel.visitorEmailEnabled,
            visitorPhoneEnabled: channel.visitorPhoneEnabled
          };
          const updateVisitorSetting = (key: any, value: boolean) => {
            setVisitorSettings((prev) => ({
              ...prev,
              [channel.id]: { ...currentVisitorSettings, [key]: value }
            }));
          };

          return (
            <div key={channel.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {currentLogo ? (
                    <img src={currentLogo} alt={channel.name} className="h-11 w-11 rounded-full object-cover border border-slate-200 shadow-sm" />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-brand"><MessageCircle size={20} /></span>
                  )}
                  <div>
                    <div className="font-semibold">{channel.name}</div>
                    <div className="mt-0.5 text-xs text-muted">Website widget · Project key {channel.projectKey}</div>
                    <div className="mt-1 font-mono text-xs text-slate-600">Channel ID: {channel.publicId}</div>
                  </div>
                </div>
                <Badge className="border-teal-100 bg-teal-50 text-brand">{channel.enabled ? "Active" : "Disabled"}</Badge>
              </div>

              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Widget & Bot Appearance</h4>
                
                <ChannelLogoUpload
                  channelId={channel.id}
                  currentLogo={currentLogo}
                  onImageFile={handleImageFile}
                  onLogoUrlChange={(url) => setLogoUrl((prev) => ({ ...prev, [channel.id]: url }))}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Bot Name</span>
                    <Input className="mt-1" value={currentBotName} onChange={(e) => setBotName((prev) => ({ ...prev, [channel.id]: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Welcome Message</span>
                    <Input className="mt-1" value={welcomeMessage[channel.id] ?? channel.welcomeMessage ?? ""} onChange={(e) => setWelcomeMessage(prev => ({ ...prev, [channel.id]: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Color Theme (Hex)</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Input type="color" className="h-10 w-12 cursor-pointer rounded-md border" value={colorTheme[channel.id] ?? channel.colorTheme ?? "#0f4c42"} onChange={(e) => setColorTheme(prev => ({ ...prev, [channel.id]: e.target.value }))} />
                      <Input className="flex-1 font-mono uppercase" value={colorTheme[channel.id] ?? channel.colorTheme ?? "#0f4c42"} onChange={(e) => setColorTheme(prev => ({ ...prev, [channel.id]: e.target.value }))} />
                    </div>
                  </label>
                </div>

                <ChannelVisitorSettingsForm
                  colorTheme={colorTheme[channel.id] ?? channel.colorTheme ?? "#0f4c42"}
                  settings={currentVisitorSettings}
                  onUpdateSetting={updateVisitorSetting}
                />

                <div className="mt-4 flex items-center gap-3">
                  <Button 
                    className="gap-2 h-9 text-xs bg-brand text-white hover:bg-brand/90" 
                    disabled={updateWidget.isPending}
                    onClick={() => handleSave(channel.id, channel.welcomeMessage, channel.colorTheme ?? "#0f4c42", channel.logoUrl ?? "", channel)}
                  >
                    <Save size={14} /> {updateWidget.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>

              <div className="mt-6 rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                <div className="mb-2 flex items-center gap-2 text-slate-300"><Code2 size={14} /> Install this channel</div>
                <code className="block break-all leading-relaxed">{snippet}</code>
              </div>
              <Button className="mt-3 h-9 gap-2 border-slate-200 bg-white text-xs text-slate-900" onClick={() => navigator.clipboard?.writeText(snippet)}>
                <Copy size={14} /> Copy Snippet
              </Button>
            </div>
          );
        })}
        {channels.isLoading && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-muted">Loading widget channel settings...</div>}
        {channels.isError && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load widget channel settings. Restart the backend and refresh this page.</div>}
        {!channels.isLoading && !channels.isError && !channels.data?.length && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-muted">No widget channel exists for this project yet.</div>}
      </div>
    </Card>
  );
}
