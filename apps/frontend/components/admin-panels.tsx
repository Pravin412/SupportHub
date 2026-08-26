"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Globe2, KeyRound, Plus, Save, TicketCheck, UserPlus, Users, Copy, Check } from "lucide-react";
import { Button, Card, Input } from "@central-support/ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../lib/api";
import { slugify } from "../lib/helpers";
import { useAgents, useCreateAgent, useCreateProject, useTickets, useWebhook } from "../lib/queries";
import { useUiStore } from "../lib/store";
import { BotConfigPanel } from "./bot-config-panel";
import { ChannelsPanel } from "./channels-panel";
import { WidgetPreview } from "./widget-preview";

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters."),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes.")
});
const agentSchema = z.object({
  name: z.string().min(2, "Agent name must be at least 2 characters."),
  email: z.email("Enter a valid email address.")
});
const webhookSchema = z.object({
  url: z
    .url("Enter a valid webhook URL.")
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), "Webhook URL must start with http:// or https://")
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-700">{message}</p>;
}

export function AdminPanels({ project }: { project?: { id: string; name: string; key: string } }) {
  const projectId = project?.id;
  const createProject = useCreateProject();
  const createAgent = useCreateAgent(projectId);
  const agents = useAgents(projectId);
  const tickets = useTickets(projectId);
  const webhookData = useWebhook(projectId);
  const setProject = useUiStore((state) => state.setProject);
  const [signingSecret, setSigningSecret] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", key: "" }
  });
  const showToast = useUiStore((state) => state.showToast);

  const agentForm = useForm<z.infer<typeof agentSchema>>({
    resolver: zodResolver(agentSchema),
    defaultValues: { name: "", email: "" }
  });
  const webhookForm = useForm<z.infer<typeof webhookSchema>>({
    resolver: zodResolver(webhookSchema),
    defaultValues: { url: "" }
  });

  useEffect(() => {
    projectForm.reset({ name: project?.name ?? "", key: project?.key ?? "" });
  }, [project, projectForm]);

  useEffect(() => {
    webhookForm.reset({ url: webhookData.data?.url ?? "" });
    setSigningSecret(webhookData.data?.secret ?? "");
  }, [webhookData.data, webhookForm]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-4 xl:grid-cols-2"
    >


      <Card className="overflow-hidden border-slate-200">
        <PanelHeader icon={<Users size={18} />} title="Agents" />
        <form
          className="space-y-4 p-4"
          onSubmit={agentForm.handleSubmit((v) =>
            createAgent.mutate(v, {
              onSuccess: () => {
                showToast("Agent added successfully!", "success");
                agentForm.reset();
              },
              onError: (err: any) => {
                showToast(err.message || "Failed to add agent", "error");
              }
            })
          )}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Name</span>
              <Input className="mt-1" placeholder="Priya Sharma" {...agentForm.register("name")} />
              <FieldError message={agentForm.formState.errors.name?.message} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <Input className="mt-1" placeholder="agent@example.com" {...agentForm.register("email")} />
              <FieldError message={agentForm.formState.errors.email?.message} />
            </label>
          </div>
          <Button className="gap-2" disabled={!projectId || createAgent.isPending}>
            <UserPlus size={16} /> Add Agent
          </Button>
        </form>
        <div className="space-y-2 border-t bg-slate-50 p-4">
          {agents.data?.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
              <span>{a.user.name}</span>
              <span className="text-muted">{a.user.email}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        <PanelHeader icon={<KeyRound size={18} />} title="Webhook" />
        <form
          className="space-y-4 p-4"
          onSubmit={webhookForm.handleSubmit(async (v) => {
            if (!projectId) return;
            try {
              const webhook = await api.updateWebhook(projectId, v.url);
              setSigningSecret(webhook.signingSecret);
              showToast("Webhook endpoint saved successfully!", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed to save webhook", "error");
            }
          })}
        >
          <label className="block">
            <span className="text-sm font-medium">Endpoint URL</span>
            <Input
              className="mt-1"
              placeholder={webhookData.data?.url ?? "https://example.com/support"}
              {...webhookForm.register("url")}
            />
            <FieldError message={webhookForm.formState.errors.url?.message} />
          </label>
          <Button className="gap-2" disabled={!projectId || webhookForm.formState.isSubmitting}>
            <Save size={16} /> Save Webhook
          </Button>
          {signingSecret && (
            <Callout tone="success">
              <div className="flex items-center justify-between">
                <span>Signing secret: {signingSecret}</span>
                <Button
                  type="button"
                  title="Copy to clipboard"
                  onClick={() => {
                    navigator.clipboard.writeText(signingSecret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="h-8 gap-1 border-0 bg-transparent px-2 text-emerald-800 shadow-none hover:opacity-80"
                >
                  {copiedSecret ? (
                    <>
                      <Check size={14} className="text-emerald-700" />
                      <span className="text-xs font-semibold text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <Copy size={14} className="text-emerald-800" />
                  )}
                </Button>
              </div>
            </Callout>
          )}
        </form>
      </Card>

      <BotConfigPanel projectId={projectId} />

      <ChannelsPanel projectId={projectId} />

      <WidgetPreview projectId={projectId} projectKey={project?.key} projectName={project?.name} />

      <Card className="overflow-hidden border-slate-200">
        <PanelHeader icon={<TicketCheck size={18} />} title="Tickets" />
        <div className="space-y-2 p-4">
          {tickets.data?.map((t) => (
            <div key={t.id} className="rounded-md border bg-white p-3 text-sm">
              <div className="font-medium">{t.title}</div>
              <div className="mt-1 text-muted">
                {t.status} · {t.priority}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.section>
  );
}

function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b bg-white px-4 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">{icon}</span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}

function Callout({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
  const color =
    tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return <div className={`rounded-md border p-3 text-sm ${color}`}>{children}</div>;
}
