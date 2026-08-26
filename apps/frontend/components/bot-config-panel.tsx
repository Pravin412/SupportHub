"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Save } from "lucide-react";
import { Button, Card, Input, Select, Textarea } from "@support-hub/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../lib/api";
import { useBotConfig } from "../lib/queries";
import { useUiStore } from "../lib/store";

const botSchema = z.object({
  responseMode: z.enum(["AUTOMATED", "HUMAN", "AI"]),
  botName: z.string().min(2, "Bot name must be at least 2 characters."),
  fallbackMessage: z.string().min(8, "Fallback message must be at least 8 characters.")
});

type BotForm = z.infer<typeof botSchema>;

export function BotConfigPanel({ projectId }: { projectId?: string }) {
  const bot = useBotConfig(projectId);
  const showToast = useUiStore((state) => state.showToast);
  const form = useForm<BotForm>({
    resolver: zodResolver(botSchema),
    defaultValues: { responseMode: "AUTOMATED", botName: "Support Bot", fallbackMessage: "" }
  });

  useEffect(() => {
    if (!bot.data) return;
    form.reset({
      responseMode: bot.data.responseMode,
      botName: bot.data.botName,
      fallbackMessage: bot.data.fallbackMessage
    });
  }, [bot.data, form]);

  const handleBotSave = async (v: BotForm) => {
    if (!projectId) return;
    try {
      await api.updateBotConfig(projectId, v);
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
          <h2 className="text-base font-semibold">Bot Configuration</h2>
          <p className="text-xs text-muted">Configure automation mode, bot identity, and fallback handoff copy.</p>
        </div>
      </div>
      <form
        className="space-y-4 p-4"
        onSubmit={form.handleSubmit(handleBotSave)}
      >
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
        <Button className="gap-2" disabled={!projectId || form.formState.isSubmitting}>
          <Save size={16} /> Save Bot Configuration
        </Button>
      </form>
    </Card>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs font-medium text-red-700">{message}</p> : null;
}
