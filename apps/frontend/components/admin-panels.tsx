"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Bell, KeyRound, Save, TicketCheck, UserPlus, Users, Copy, Check, Plus, X, Eye, EyeOff } from "lucide-react";
import { Badge, Button, Card, Input } from "@support-hub/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../lib/api";
import { parseEmailList, slugify } from "../lib/helpers";
import {
  useAgents,
  useCreateAgent,
  useCreateProject,
  useIntegrationCredentials,
  useNotificationSettings,
  useWebhook
} from "../lib/queries";
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
const notificationSchema = z.object({
  notificationEmail: z
    .string()
    .min(3, "Add at least one email.")
    .refine((value) => parseEmailList(value).length > 0, "Add at least one valid email."),
  ticketCreatedEnabled: z.boolean(),
  ticketAssignedEnabled: z.boolean()
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
  const webhookData = useWebhook(projectId);
  const integrationCredentials = useIntegrationCredentials(projectId);
  const notificationSettings = useNotificationSettings(projectId);
  const [signingSecret, setSigningSecret] = useState("");
  const [integrationSecret, setIntegrationSecret] = useState("");
  const [copiedIntegrationKey, setCopiedIntegrationKey] = useState(false);
  const [copiedIntegrationSecret, setCopiedIntegrationSecret] = useState(false);
  const [showIntegrationKey, setShowIntegrationKey] = useState(false);
  const [showIntegrationSecret, setShowIntegrationSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [emailInput, setEmailInput] = useState("");
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
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { notificationEmail: "", ticketCreatedEnabled: true, ticketAssignedEnabled: true }
  });

  useEffect(() => {
    projectForm.reset({ name: project?.name ?? "", key: project?.key ?? "" });
  }, [project, projectForm]);

  useEffect(() => {
    webhookForm.reset({ url: webhookData.data?.url ?? "" });
    setSigningSecret(webhookData.data?.secret ?? "");
  }, [webhookData.data, webhookForm]);

  useEffect(() => {
    setIntegrationSecret(integrationCredentials.data?.integrationSecret ?? "");
  }, [integrationCredentials.data]);

  useEffect(() => {
    notificationForm.reset({
      notificationEmail: notificationSettings.data?.notificationEmail ?? "",
      ticketCreatedEnabled: notificationSettings.data?.ticketCreatedEnabled ?? true,
      ticketAssignedEnabled: notificationSettings.data?.ticketAssignedEnabled ?? true
    });
  }, [notificationSettings.data, notificationForm]);

  const notificationRecipients = parseEmailList(notificationForm.watch("notificationEmail"));
  const setNotificationRecipients = (emails: string[]) => {
    notificationForm.setValue("notificationEmail", emails.join(","), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };
  const addNotificationRecipients = () => {
    const nextEmails = parseEmailList(emailInput);
    if (!nextEmails.length) {
      showToast("Enter a valid email address.", "error");
      return;
    }
    setNotificationRecipients(Array.from(new Set([...notificationRecipients, ...nextEmails])));
    setEmailInput("");
  };
  const removeNotificationRecipient = (email: string) => {
    setNotificationRecipients(notificationRecipients.filter((recipient) => recipient !== email));
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid gap-4 xl:grid-cols-2"
    >


      <Card className="overflow-hidden border-slate-200">
        <PanelHeader icon={<KeyRound size={18} />} title="Integration" />
        <div className="space-y-4 p-4">
          <label className="block">
            <span className="text-sm font-medium">Integration key</span>
            <div className="mt-1 flex gap-2">
              <Input type={showIntegrationKey ? "text" : "password"} readOnly value={integrationCredentials.data?.integrationKey ?? ""} placeholder="Loading..." />
              <Button
                type="button"
                title="Toggle visibility"
                className="h-10 px-3"
                disabled={!integrationCredentials.data?.integrationKey}
                onClick={() => setShowIntegrationKey(!showIntegrationKey)}
              >
                {showIntegrationKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
              <Button
                type="button"
                title="Copy integration key"
                className="h-10 px-3"
                disabled={!integrationCredentials.data?.integrationKey}
                onClick={() => {
                  const key = integrationCredentials.data?.integrationKey;
                  if (!key) return;
                  navigator.clipboard.writeText(key);
                  setCopiedIntegrationKey(true);
                  setTimeout(() => setCopiedIntegrationKey(false), 2000);
                }}
              >
                {copiedIntegrationKey ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Integration secret</span>
            <div className="mt-1 flex gap-2">
              <Input type={showIntegrationSecret ? "text" : "password"} readOnly value={integrationSecret} placeholder="Loading..." />
              <Button
                type="button"
                title="Toggle visibility"
                className="h-10 px-3"
                disabled={!integrationSecret}
                onClick={() => setShowIntegrationSecret(!showIntegrationSecret)}
              >
                {showIntegrationSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
              <Button
                type="button"
                title="Copy integration secret"
                className="h-10 px-3"
                disabled={!integrationSecret}
                onClick={() => {
                  if (!integrationSecret) return;
                  navigator.clipboard.writeText(integrationSecret);
                  setCopiedIntegrationSecret(true);
                  setTimeout(() => setCopiedIntegrationSecret(false), 2000);
                }}
              >
                {copiedIntegrationSecret ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </label>

          <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
            Use this value as SUPPORT_HUB_INTEGRATION_SECRET in your bot environment.
          </div>

          <Button
            type="button"
            className="gap-2 bg-brand text-white hover:bg-brand/90"
            disabled={!projectId}
            onClick={async () => {
              if (!projectId) return;
              try {
                const credentials = await api.rotateIntegrationSecret(projectId);
                setIntegrationSecret(credentials.integrationSecret);
                showToast("Integration secret rotated successfully.", "success");
              } catch (err) {
                showToast(err instanceof Error ? err.message : "Failed to rotate integration secret", "error");
              }
            }}
          >
            <KeyRound size={16} /> Rotate Integration Secret
          </Button>
        </div>
      </Card>

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
          <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || createAgent.isPending}>
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
          <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || webhookForm.formState.isSubmitting}>
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

      <Card className="overflow-hidden border-slate-200">
        <PanelHeader icon={<Bell size={18} />} title="Ticket Emails" />
        <form
          className="space-y-4 p-4"
          onSubmit={notificationForm.handleSubmit(async (v) => {
            if (!projectId) return;
            try {
              await api.updateNotificationSettings(projectId, v);
              showToast("Ticket email settings saved successfully!", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed to save ticket email settings", "error");
            }
          })}
        >
          <label className="block">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Mail recipients</span>
              <span className="text-xs font-semibold text-muted">{notificationRecipients.length} recipient{notificationRecipients.length === 1 ? "" : "s"}</span>
            </div>
            <input type="hidden" {...notificationForm.register("notificationEmail")} />
            <div className="mt-1 flex gap-2">
              <Input
                value={emailInput}
                placeholder="support@example.com"
                onChange={(event) => setEmailInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  addNotificationRecipients();
                }}
              />
              <Button type="button" className="gap-2 bg-brand text-white hover:bg-brand/90" onClick={addNotificationRecipients}>
                <Plus size={16} /> Add
              </Button>
            </div>
            <FieldError message={notificationForm.formState.errors.notificationEmail?.message} />
          </label>
          {notificationRecipients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {notificationRecipients.map((email) => (
                <Badge key={email} className="gap-1 border-teal-100 bg-teal-50 text-teal-800">
                  <Button
                    type="button"
                    title="Edit recipient"
                    className="h-auto border-0 bg-transparent p-0 text-inherit shadow-none hover:bg-transparent hover:underline"
                    onClick={() => {
                      removeNotificationRecipient(email);
                      setEmailInput(email);
                    }}
                  >
                    {email}
                  </Button>
                  <Button
                    type="button"
                    title="Remove recipient"
                    className="ml-1 h-auto border-0 bg-transparent p-0.5 text-teal-700 shadow-none hover:bg-teal-100 hover:text-teal-950"
                    onClick={() => removeNotificationRecipient(email)}
                  >
                    <X size={12} />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...notificationForm.register("ticketCreatedEnabled")} />
            Send mail when keyword raises a ticket
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...notificationForm.register("ticketAssignedEnabled")} />
            Send mail when ticket status changes
          </label>
          <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || notificationForm.formState.isSubmitting}>
            <Save size={16} /> Save Emails
          </Button>
        </form>
      </Card>

      <BotConfigPanel projectId={projectId} />

      <Card className="overflow-hidden border-slate-200">
        <PanelHeader icon={<TicketCheck size={18} />} title="Tickets" />
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted">
            View raised tickets and update their workflow status on the tickets page.
          </p>
          <Button asChild className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId}>
            <Link href={projectId ? `/tickets?projectId=${projectId}` : "/tickets"}>
              <TicketCheck size={16} /> Open Tickets
            </Link>
          </Button>
        </div>
      </Card>

      <ChannelsPanel projectId={projectId} />

      <WidgetPreview projectId={projectId} projectKey={project?.key} projectName={project?.name} />
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
