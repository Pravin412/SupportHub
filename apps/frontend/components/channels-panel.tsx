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
  const [logoUrl, setLogoUrl] = useState<Record<string, string>>({});

  const handleImageFile = (channelId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be smaller than 2MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setLogoUrl((prev) => ({ ...prev, [channelId]: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (channelId: string, currentWelcome: string, currentColor: string, currentLogo?: string) => {
    updateWidget.mutate(
      {
        welcomeMessage: welcomeMessage[channelId] ?? currentWelcome,
        colorTheme: colorTheme[channelId] ?? currentColor,
        logoUrl: logoUrl[channelId] !== undefined ? logoUrl[channelId] : currentLogo
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
          <h2 className="text-base font-semibold">Channels & Chatbot Widget</h2>
          <p className="text-xs text-muted">Customize your website chatbot's logo, colors, and welcome messaging.</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {channels.data?.map((channel) => {
          const snippet = buildWidgetSnippet(channel.publicId);
          const currentLogo = logoUrl[channel.id] !== undefined ? logoUrl[channel.id] : (channel.logoUrl ?? "");
          return (
            <div key={channel.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {currentLogo ? (
                    <img
                      src={currentLogo}
                      alt={channel.name}
                      className="h-11 w-11 rounded-full object-cover border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-brand">
                      <MessageCircle size={20} />
                    </span>
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
                
                {/* Image / Logo Upload Section */}
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {currentLogo ? (
                        <div className="relative">
                          <img
                            src={currentLogo}
                            alt="Logo preview"
                            className="h-14 w-14 rounded-full object-cover border-2 border-teal-600 shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400">
                          <MessageCircle size={24} />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-900">Project / Bot Logo</div>
                        <div className="text-2xs text-muted">Displayed in chatbot header, next to bot replies, and launcher.</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageFile(channel.id, file);
                          }}
                        />
                      </label>
                      {currentLogo && (
                        <button
                          type="button"
                          className="h-8 px-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          onClick={() => setLogoUrl((prev) => ({ ...prev, [channel.id]: "" }))}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-2xs text-slate-500">Or paste an Image URL:</span>
                    <Input
                      className="mt-1 h-8 text-xs bg-white"
                      placeholder="https://example.com/logo.png"
                      value={currentLogo}
                      onChange={(e) => setLogoUrl((prev) => ({ ...prev, [channel.id]: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Welcome Message</span>
                    <Input 
                      className="mt-1" 
                      value={welcomeMessage[channel.id] ?? channel.welcomeMessage ?? ""} 
                      onChange={(e) => setWelcomeMessage(prev => ({ ...prev, [channel.id]: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Color Theme (Hex)</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="color" 
                        className="h-10 w-12 cursor-pointer rounded-md border" 
                        value={colorTheme[channel.id] ?? channel.colorTheme ?? "#0f4c42"} 
                        onChange={(e) => setColorTheme(prev => ({ ...prev, [channel.id]: e.target.value }))}
                      />
                      <Input 
                        className="flex-1 font-mono uppercase" 
                        value={colorTheme[channel.id] ?? channel.colorTheme ?? "#0f4c42"} 
                        onChange={(e) => setColorTheme(prev => ({ ...prev, [channel.id]: e.target.value }))}
                      />
                    </div>
                  </label>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button 
                    className="gap-2 h-9 text-xs bg-brand text-white hover:bg-brand/90" 
                    disabled={updateWidget.isPending}
                    onClick={() => handleSave(channel.id, channel.welcomeMessage, channel.colorTheme ?? "#0f4c42", channel.logoUrl ?? "")}
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
