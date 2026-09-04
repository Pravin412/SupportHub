import { useState } from "react";
import { Plus, Trash2, Edit2, Save, KeyRound, Check, Copy } from "lucide-react";
import { useWebhooks } from "../lib/queries";
import { api } from "../lib/api";
import { Button, Card, Input } from "@support-hub/ui";
import { useUiStore } from "../lib/store";
function Callout({ children, tone, className }: { children: React.ReactNode; tone: "error" | "success"; className?: string }) {
  const color = tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800";
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
  const showToast = useUiStore((s: any) => s.showToast);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const activeWebhook = webhooks?.find(w => w.isActive);

  async function handleCreate() {
    if (!projectId || !newUrl || !newName) return showToast("Name and URL are required", "error");
    try {
      const res = await api.createWebhook(projectId, { name: newName, url: newUrl, isActive: webhooks?.length === 0 });
      setNewSecret(res.signingSecret);
      showToast("Webhook added successfully", "success");
      setNewName("");
      setNewUrl("");
      setIsAdding(false);
      refetch();
    } catch (e: any) {
      showToast(e.message || "Failed to create webhook", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!projectId) return;
    try {
      await api.deleteWebhook(projectId, id);
      showToast("Webhook deleted", "success");
      refetch();
    } catch (e: any) {
      showToast(e.message || "Failed to delete webhook", "error");
    }
  }

  async function handleSetActive(id: string) {
    if (!projectId) return;
    try {
      await api.updateWebhook(projectId, id, { isActive: true });
      showToast("Active webhook updated", "success");
      refetch();
    } catch (e: any) {
      showToast(e.message || "Failed to update webhook", "error");
    }
  }

  async function handleUpdate(id: string) {
    if (!projectId || !editUrl || !editName) return showToast("Name and URL are required", "error");
    try {
      await api.updateWebhook(projectId, id, { name: editName, url: editUrl });
      showToast("Webhook updated", "success");
      setEditingId(null);
      refetch();
    } catch (e: any) {
      showToast(e.message || "Failed to update webhook", "error");
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
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Bot Name</label>
                        <Input className="mt-1 h-8 text-sm" value={editName} onChange={(e: any) => setEditName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700">Webhook URL</label>
                        <Input className="mt-1 h-8 text-sm" value={editUrl} onChange={(e: any) => setEditUrl(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button className="h-8 bg-brand text-white text-xs px-3 hover:bg-brand/90" onClick={() => handleUpdate(w.id)}>Save</Button>
                        <Button className="h-8 bg-transparent text-slate-700 text-xs px-3 hover:bg-slate-100 border-0 shadow-none" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{w.name} {w.isActive && <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>}</div>
                        <div className="text-xs text-slate-500 mt-1">{w.url}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button className="h-8 w-8 p-0 text-slate-500 hover:text-brand bg-transparent hover:bg-slate-50 border-0 shadow-none" onClick={() => {
                          setEditingId(w.id);
                          setEditName(w.name);
                          setEditUrl(w.url);
                        }}>
                          <Edit2 size={14} />
                        </Button>
                        <Button className="h-8 w-8 p-0 text-red-500 hover:text-red-600 bg-transparent hover:bg-red-50 border-0 shadow-none" onClick={async () => {
                          if (window.confirm("Are you sure you want to delete this webhook?")) {
                            await handleDelete(w.id);
                          }
                        }}>
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
          <div className="rounded-md border border-slate-200 p-4 space-y-4 bg-slate-50">
            <div>
              <label className="text-xs font-medium text-slate-700">Bot Name</label>
              <Input className="mt-1 bg-white" placeholder="e.g. My Custom AI" value={newName} onChange={(e: any) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Webhook URL</label>
              <Input className="mt-1 bg-white" placeholder="https://..." value={newUrl} onChange={(e: any) => setNewUrl(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button className="bg-brand text-white hover:bg-brand/90" onClick={handleCreate}>Save</Button>
              <Button className="bg-transparent text-slate-700 hover:bg-slate-100 border-0 shadow-none" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
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