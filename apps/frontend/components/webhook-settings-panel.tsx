import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit2, KeyRound, Check, Copy } from "lucide-react";
import { useWebhooks } from "../lib/queries";
import { api } from "../lib/api";
import { Button, Card, Input } from "@support-hub/ui";
import { displayToast } from "../lib/display-toast";
import { useConfirmationModalStore } from "../lib/confirmation-modal-store";
import { FieldError } from "./admin/project-access-shared";

const webhookSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  url: z.string().trim().min(1, "URL is required").url("Enter a valid URL")
    .refine(value => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL")
});
type WebhookForm = z.infer<typeof webhookSchema>;
function Callout({ children, tone, className }: { children: React.ReactNode; tone: "error" | "success"; className?: string }) {
  const color = tone === "error" ? "border-error-border bg-error-surface text-error-muted" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return <div className={`rounded-md border p-3 text-sm ${color} ${className || ''}`}>{children}</div>;
}

function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
      <div className="text-slate-500">{icon}</div>
      <h3 className="font-medium text-slate-800">{title}</h3>
    </div>
  );
}

export function WebhookSettingsPanel({ projectId }: { projectId?: string }) {
  const { data: webhooks, refetch } = useWebhooks(projectId);

  
  const [isAdding, setIsAdding] = useState(false);
  const createForm = useForm<WebhookForm>({ resolver: zodResolver(webhookSchema), defaultValues: { name: "", url: "" } });
  const editForm = useForm<WebhookForm>({ resolver: zodResolver(webhookSchema), defaultValues: { name: "", url: "" } });
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const openConfirmation = useConfirmationModalStore(state => state.openConfirmation);

  const activeWebhook = webhooks?.find(w => w.isActive);

  async function handleCreate(data: WebhookForm) {
    if (!projectId) return createForm.setError("root", { message: "Select a project first" });
    createForm.clearErrors("root");
    try {
      const res = await api.createWebhook(projectId, { ...data, isActive: webhooks?.length === 0 });
      setNewSecret(res.signingSecret);
      displayToast("Webhook added successfully", "success");
      createForm.reset();
      setIsAdding(false);
      refetch();
    } catch (e: any) {
      displayToast(e.message || "Failed to create webhook", "destructive");
    }
  }

  function requestDelete(id: string, name: string) {
    const targetProjectId = projectId;
    if (!targetProjectId) return;
    async function deleteWebhook() {
      await api.deleteWebhook(targetProjectId!, id);
      displayToast("Webhook deleted", "success");
      await refetch();
    }
    openConfirmation({ title: "Delete webhook", message: `Delete "${name}"? This cannot be undone.`, confirmLabel: "Delete", icon: <Trash2 size={18} />, onConfirm: deleteWebhook });
  }

  async function handleSetActive(id: string) {
    if (!projectId) return;
    try {
      await api.updateWebhook(projectId, id, { isActive: true });
      displayToast("Active webhook updated", "success");
      refetch();
    } catch (e: any) {
      displayToast(e.message || "Failed to update webhook", "destructive");
    }
  }

  async function handleUpdate(id: string, data: WebhookForm) {
    if (!projectId) return editForm.setError("root", { message: "Select a project first" });
    editForm.clearErrors("root");
    try {
      await api.updateWebhook(projectId, id, data);
      displayToast("Webhook updated", "success");
      setEditingId(null);
      refetch();
    } catch (e: any) {
      displayToast(e.message || "Failed to update webhook", "destructive");
    }
  }

  return (
    <Card className="overflow-hidden border-slate-200">
      <PanelHeader icon={<KeyRound size={18} />} title="Webhooks" />
      
      <div className="p-4 space-y-4">
        {webhooks?.length === 0 && !isAdding && (
          <div className="text-sm text-slate-500">No webhooks configured.</div>
        )}

        {webhooks && webhooks.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Active Webhook (Auto-Reply Bot)</label>
              <select 
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={activeWebhook?.id || ""}
                onChange={(e: any) => handleSetActive(e.target.value)}
              >
                <option value="" disabled>Select an active webhook...</option>
                {webhooks.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.url})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">All Webhooks</div>
              {webhooks.map(w => (
                <div key={w.id} className="rounded-md border border-slate-200 p-3">
                  {editingId === w.id ? (
                    <form className="space-y-3" noValidate onSubmit={editForm.handleSubmit(data => handleUpdate(w.id, data))}>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Bot Name</label>
                        <Input className="mt-1 h-8 text-sm" {...editForm.register("name")} aria-invalid={!!editForm.formState.errors.name} />
                        <FieldError message={editForm.formState.errors.name?.message} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Webhook URL</label>
                        <Input className="mt-1 h-8 text-sm" {...editForm.register("url")} aria-invalid={!!editForm.formState.errors.url} />
                        <FieldError message={editForm.formState.errors.url?.message} />
                      </div>
                      <FieldError message={editForm.formState.errors.root?.message} />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={editForm.formState.isSubmitting} className="h-8 bg-brand text-white text-xs px-3 hover:bg-brand/90">Save</Button>
                        <Button type="button" disabled={editForm.formState.isSubmitting} className="h-8 bg-transparent text-slate-700 text-xs px-3 hover:bg-slate-100 border-0 shadow-none" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{w.name} {w.isActive && <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>}</div>
                        <div className="text-xs text-slate-500 mt-1">{w.url}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button className="h-8 w-8 p-0 text-slate-500 hover:text-brand bg-transparent hover:bg-slate-50 border-0 shadow-none" onClick={() => {
                          setEditingId(w.id);
                          editForm.reset({ name: w.name, url: w.url });
                        }}>
                          <Edit2 size={14} />
                        </Button>
                        <Button title="Delete webhook" aria-label={`Delete ${w.name}`} className="h-8 w-8 p-0 text-error hover:text-error bg-transparent hover:bg-error-surface border-0 shadow-none" onClick={requestDelete.bind(null, w.id, w.name)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdding ? (
          <form className="rounded-md border border-slate-200 p-4 space-y-4 bg-slate-50" noValidate onSubmit={createForm.handleSubmit(handleCreate)}>
            <div>
              <label className="text-xs font-medium text-slate-700">Bot Name</label>
              <Input className="mt-1 bg-white" placeholder="e.g. My Custom AI" {...createForm.register("name")} aria-invalid={!!createForm.formState.errors.name} />
              <FieldError message={createForm.formState.errors.name?.message} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Webhook URL</label>
              <Input className="mt-1 bg-white" placeholder="https://..." {...createForm.register("url")} aria-invalid={!!createForm.formState.errors.url} />
              <FieldError message={createForm.formState.errors.url?.message} />
            </div>
            <FieldError message={createForm.formState.errors.root?.message} />
            <div className="flex gap-2">
              <Button type="submit" disabled={createForm.formState.isSubmitting} className="bg-brand text-white hover:bg-brand/90">Save</Button>
              <Button type="button" disabled={createForm.formState.isSubmitting} className="bg-transparent text-slate-700 hover:bg-slate-100 border-0 shadow-none" onClick={() => { createForm.reset(); setIsAdding(false); }}>Cancel</Button>
            </div>
          </form>
        ) : (
          <Button className="w-full gap-2 border-dashed bg-transparent text-slate-700 hover:bg-slate-50" onClick={() => setIsAdding(true)}>
            <Plus size={16} /> Add Webhook
          </Button>
        )}

        {newSecret && (
          <Callout tone="success" className="mt-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">New Webhook Created!</div>
              <div className="text-sm">Please save this signing secret now, you won't be able to see it again:</div>
              <div className="flex items-center justify-between bg-white/50 p-2 rounded border border-emerald-200/50">
                <code className="text-xs">{newSecret}</code>
                <Button
                  type="button"
                  title="Copy to clipboard"
                  onClick={() => {
                    navigator.clipboard.writeText(newSecret);
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
            </div>
          </Callout>
        )}
      </div>
    </Card>
  );
}
