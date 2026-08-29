"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Save } from "lucide-react";
import { Button, Card, Input, Select, Textarea } from "@support-hub/ui";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../lib/api";
import { keys, useBotConfig, useChannels } from "../lib/queries";
import { useUiStore } from "../lib/store";

const botSchema = z.object({
  responseMode: z.enum(["AUTOMATED", "HUMAN", "AI"]),
  botName: z.string().min(2, "Bot name must be at least 2 characters."),
  fallbackMessage: z.string().min(8, "Fallback message must be at least 8 characters."),
  botAvatar: z.string().optional()
});

type BotForm = z.infer<typeof botSchema>;

export function BotConfigPanel({ projectId }: { projectId?: string }) {
  const bot = useBotConfig(projectId);
  const channels = useChannels(projectId);
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const form = useForm<BotForm>({
    resolver: zodResolver(botSchema),
    defaultValues: { responseMode: "AUTOMATED", botName: "Support Bot", fallbackMessage: "", botAvatar: "" }
  });

  useEffect(() => {
    if (!bot.data) return;
    form.reset({
      responseMode: bot.data.responseMode,
      botName: bot.data.botName,
      fallbackMessage: bot.data.fallbackMessage,
      botAvatar: bot.data.botAvatar ?? ""
    });
    setAvatarPreview(bot.data.botAvatar ?? "");
  }, [bot.data, form]);

  const handleAvatarFile = (file: File) => {
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
      if (result) {
        setAvatarPreview(result);
        form.setValue("botAvatar", result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBotSave = async (v: BotForm) => {
    if (!projectId) return;
    try {
      await api.updateBotConfig(projectId, { ...v, botAvatar: avatarPreview || v.botAvatar || undefined });
      await queryClient.invalidateQueries({ queryKey: keys.botConfig(projectId) });
      await queryClient.invalidateQueries({ queryKey: keys.channels(projectId) });
      const channel = channels.data?.[0];
      if (channel && avatarPreview) {
        await api.updateWidget(projectId, {
          logoUrl: avatarPreview,
          welcomeMessage: channel.welcomeMessage,
          colorTheme: channel.colorTheme,
          collectVisitorInfo: channel.collectVisitorInfo,
          visitorNameEnabled: channel.visitorNameEnabled,
          visitorEmailEnabled: channel.visitorEmailEnabled,
          visitorPhoneEnabled: channel.visitorPhoneEnabled
        });
        await queryClient.invalidateQueries({ queryKey: keys.channels(projectId) });
      }
      showToast("Bot configuration saved successfully!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save bot configuration", "error");
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200">
      <div className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
          <Bot size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold">Bot Configuration & Identity</h2>
          <p className="text-xs text-muted">Configure automation mode, bot avatar image, and fallback replies.</p>
        </div>
      </div>
      <form
        className="space-y-4 p-4"
        onSubmit={form.handleSubmit(handleBotSave)}
      >
        {/* Bot Avatar Section */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Bot avatar"
                  className="h-12 w-12 rounded-full object-cover border-2 border-teal-600 shadow-sm"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400">
                  <Bot size={20} />
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-slate-900">Bot Avatar Icon</div>
                <div className="text-2xs text-muted">Upload custom chatbot profile picture.</div>
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
                    if (file) handleAvatarFile(file);
                  }}
                />
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  className="h-8 px-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  onClick={() => {
                    setAvatarPreview("");
                    form.setValue("botAvatar", "");
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Response Mode</span>
          <Select className="mt-1" {...form.register("responseMode")}>
            <option value="AUTOMATED">Webhook automation</option>
            <option value="HUMAN">Human only</option>
            <option value="AI">AI ready, disabled by default</option>
          </Select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Bot Name</span>
          <Input className="mt-1" {...form.register("botName")} />
          <FieldError message={form.formState.errors.botName?.message} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Fallback Message</span>
          <Textarea className="mt-1" {...form.register("fallbackMessage")} />
          <FieldError message={form.formState.errors.fallbackMessage?.message} />
        </label>
        <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || form.formState.isSubmitting}>
          <Save size={16} /> {form.formState.isSubmitting ? "Saving..." : "Save Bot Configuration"}
        </Button>
      </form>
    </Card>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs font-medium text-red-700">{message}</p> : null;
}
