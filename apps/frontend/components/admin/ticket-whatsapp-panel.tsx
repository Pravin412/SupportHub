"use client";

import { canManageProjectSettings } from "@support-hub/shared-types";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageSquare,
  Plus,
  Save,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Settings2,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";
import { Badge, Button, Card, Input } from "@support-hub/ui";
import { parsePhoneList } from "@support-hub/utils";
import { api } from "../../lib/api";
import {
  useWhatsappSettings,
  useWhatsappTemplates,
  useCreateWhatsappTemplate,
  useDeleteWhatsappTemplate,
  useMe
} from "../../lib/queries";
import { displayToast } from "../../lib/display-toast";
import { useConfirmationModalStore } from "../../lib/confirmation-modal-store";
import { CheckboxField } from "../checkbox-field";

const whatsappSettingsSchema = z.object({
  enabled: z.boolean(),
  ticketCreatedEnabled: z.boolean(),
  recipientPhoneNumbers: z.array(z.string()),
  ticketCreatedTemplateId: z.string().optional(),
  providerUrl: z.string().optional(),
  vendorId: z.string().optional(),
  accessToken: z.string().optional()
});

const newTemplateSchema = z.object({
  name: z
    .string()
    .min(2, "Template name must be at least 2 characters")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only"),
  displayName: z.string().min(2, "Display name is required"),
  language: z.string(),
  description: z.string().optional()
});

type NewTemplateInput = {
  name: string;
  displayName: string;
  language: string;
  description?: string;
};

export function TicketWhatsappPanel({ projectId }: { projectId?: string }) {
  const me = useMe();
  const openConfirmation = useConfirmationModalStore((state) => state.openConfirmation);
  const settingsQuery = useWhatsappSettings(projectId);
  const templatesQuery = useWhatsappTemplates(projectId);
  const createTemplateMutation = useCreateWhatsappTemplate(projectId);
  const deleteTemplateMutation = useDeleteWhatsappTemplate(projectId);

  const [phoneInput, setPhoneInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showGatewayConfig, setShowGatewayConfig] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showAddTemplateForm, setShowAddTemplateForm] = useState(false);

  const form = useForm<z.infer<typeof whatsappSettingsSchema>>({
    resolver: zodResolver(whatsappSettingsSchema),
    defaultValues: {
      enabled: false,
      ticketCreatedEnabled: false,
      recipientPhoneNumbers: [],
      ticketCreatedTemplateId: "",
      providerUrl: "",
      vendorId: "",
      accessToken: ""
    }
  });

  const templateForm = useForm<NewTemplateInput>({
    resolver: zodResolver(newTemplateSchema) as any,
    defaultValues: {
      name: "",
      displayName: "",
      language: "en_US",
      description: ""
    }
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset({
        enabled: settingsQuery.data.enabled ?? false,
        ticketCreatedEnabled: settingsQuery.data.ticketCreatedEnabled ?? false,
        recipientPhoneNumbers: parsePhoneList(settingsQuery.data.recipientPhoneNumbers),
        ticketCreatedTemplateId: settingsQuery.data.ticketCreatedTemplateId ?? "",
        providerUrl: settingsQuery.data.providerUrl ?? "",
        vendorId: settingsQuery.data.vendorId ?? "",
        accessToken: settingsQuery.data.accessToken ?? ""
      });
    }
  }, [settingsQuery.data, form]);

  // Ensure default template selected if none explicitly chosen
  useEffect(() => {
    if (templatesQuery.data && templatesQuery.data.length > 0) {
      const currentSelected = form.getValues("ticketCreatedTemplateId");
      if (!currentSelected) {
        form.setValue("ticketCreatedTemplateId", templatesQuery.data[0].id, {
          shouldDirty: false
        });
      }
    }
  }, [templatesQuery.data, form]);

  const projectRole = me.data?.memberships.find((m) => m.projectId === projectId)?.role;
  const canEdit = canManageProjectSettings(me.data?.role, projectRole);
  if (!canEdit) return null;

  const recipientNumbers = parsePhoneList(form.watch("recipientPhoneNumbers"));
  const selectedTemplateId = form.watch("ticketCreatedTemplateId");
  const gatewayConfigured = Boolean(
    form.watch("vendorId")?.trim() && (settingsQuery.data?.hasCustomToken || form.watch("accessToken")?.trim())
  );

  const setRecipientNumbers = (numbers: string[]) => {
    form.setValue("recipientPhoneNumbers", numbers, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const addRecipientNumber = () => {
    const raw = phoneInput.trim();
    if (!raw) return;
    const cleanNumbers = parsePhoneList(raw);
    if (!cleanNumbers.length) {
      displayToast("Enter a valid phone number with country code (e.g. +91 9876543210).", "destructive");
      return;
    }
    const merged = Array.from(new Set([...recipientNumbers, ...cleanNumbers]));
    setRecipientNumbers(merged);
    setPhoneInput("");
  };

  const removeRecipientNumber = (number: string) => {
    setRecipientNumbers(recipientNumbers.filter((n) => n !== number));
  };

  const onSubmit = async (values: z.infer<typeof whatsappSettingsSchema>) => {
    if (!projectId) return;

    if (values.ticketCreatedEnabled && recipientNumbers.length === 0) {
      displayToast("Please add at least one recipient phone number to receive WhatsApp alerts.", "destructive");
      return;
    }
    if ((values.enabled || values.ticketCreatedEnabled) && !gatewayConfigured) {
      displayToast(
        "You should first configure WhatsApp Gateway Settings. Once you fill this, then only you can enable WhatsApp notifications.",
        "destructive"
      );
      setShowGatewayConfig(true);
      return;
    }

    try {
      await api.updateWhatsappSettings(projectId, {
        enabled: values.enabled || values.ticketCreatedEnabled,
        ticketCreatedEnabled: values.ticketCreatedEnabled,
        recipientPhoneNumbers: values.recipientPhoneNumbers,
        ticketCreatedTemplateId: values.ticketCreatedTemplateId || null,
        providerUrl: values.providerUrl?.trim() || null,
        vendorId: values.vendorId?.trim() || null,
        accessToken: values.accessToken !== undefined ? values.accessToken : undefined
      });
      displayToast("WhatsApp settings saved successfully!", "success");
      settingsQuery.refetch();
    } catch (err) {
      displayToast(err instanceof Error ? err.message : "Failed to save WhatsApp settings", "destructive");
    }
  };

  const handleTest = async () => {
    if (!projectId) return;
    if (recipientNumbers.length === 0 && !phoneInput.trim()) {
      displayToast("Please enter or add a phone number to send the test message to.", "destructive");
      return;
    }
    if (!gatewayConfigured) {
      displayToast("You should first configure WhatsApp Gateway Settings for this project.", "destructive");
      setShowGatewayConfig(true);
      return;
    }
    const testTarget = phoneInput.trim() ? phoneInput.trim() : recipientNumbers[0];
    setTesting(true);
    try {
      const res = await api.testWhatsappSettings(projectId, { phoneNumber: testTarget });
      displayToast(res.message || "Test WhatsApp message sent!", "success");
    } catch (err) {
      displayToast(err instanceof Error ? err.message : "Test message failed", "destructive");
    } finally {
      setTesting(false);
    }
  };

  const handleCreateTemplate = async (values: NewTemplateInput) => {
    if (!projectId) return;
    try {
      const template = editingTemplateId
        ? await api.updateWhatsappTemplate(projectId, editingTemplateId, values)
        : await createTemplateMutation.mutateAsync(values);
      await templatesQuery.refetch();
      form.setValue("ticketCreatedTemplateId", template.id, { shouldDirty: true });
      displayToast(`Template "${values.displayName}" saved successfully!`, "success");
      setEditingTemplateId(null);
      templateForm.reset();
      setShowAddTemplateForm(false);
    } catch (err) {
      displayToast(err instanceof Error ? err.message : "Failed to create template", "destructive");
    }
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (!projectId) return;
    openConfirmation({
      title: "Delete WhatsApp template",
      message: `Delete template "${templateName}"? This cannot be undone.`,
      confirmLabel: "Delete",
      icon: <Trash2 size={18} />,
      onConfirm: async () => {
        await deleteTemplateMutation.mutateAsync(templateId);
        displayToast("Template deleted successfully!", "success");
        if (form.getValues("ticketCreatedTemplateId") === templateId) {
          form.setValue("ticketCreatedTemplateId", "", { shouldDirty: true });
        }
      }
    });
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="flex items-center justify-between border-b bg-blue-50/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-blue-100 text-blue-800">
            <MessageSquare size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Ticket WhatsApp Notifications</h2>
            <p className="text-xs text-slate-500">
              Dispatch WhatsApp alerts to your support team when tickets are raised
            </p>
          </div>
        </div>

        <div>
          <Badge className={gatewayConfigured ? "border-blue-200 bg-blue-100/70 text-blue-800 text-[11px] font-medium" : "border-amber-200 bg-amber-100/70 text-amber-800 text-[11px] font-medium"}>
            {gatewayConfigured ? "Project Gateway" : "Gateway Required"}
          </Badge>
        </div>
      </div>

      <form className="space-y-4 p-4" onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        {/* Main Ticket Raised Toggle */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-3">
          <CheckboxField
            control={form.control}
            name="ticketCreatedEnabled"
            label="Send WhatsApp message when ticket is raised"
          />
          <p className="mt-1 pl-6 text-xs text-muted">
            Automatically trigger a WhatsApp notification to the recipients below whenever a customer creates a ticket.
          </p>
        </div>

        {/* Recipient Phone Numbers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-800">Recipient Phone Numbers</label>
            <span className="text-xs font-semibold text-muted">
              {recipientNumbers.length} number{recipientNumbers.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex gap-2">
            <Input
              value={phoneInput}
              placeholder="e.g. +91 9876543210"
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRecipientNumber();
                }
              }}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="primary"
              className="gap-2"
              onClick={addRecipientNumber}
            >
              <Plus size={16} /> Add
            </Button>
          </div>
          <p className="text-[11px] text-muted">
            Format: E.164 country code + digits without spaces or leading + (e.g. <code>919876543210</code>).
          </p>

          {/* Number Badges */}
          {recipientNumbers.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {recipientNumbers.map((phone) => (
                <Badge
                  key={phone}
                  className="gap-1.5 border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-900 font-mono text-xs"
                >
                  <span>+{phone}</span>
                  <button
                    type="button"
                    title="Remove number"
                    className="ml-1 rounded text-blue-700 hover:bg-blue-200 hover:text-blue-950 p-0.5 transition-colors"
                    onClick={() => removeRecipientNumber(phone)}
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Template Selection Dropdown */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="ticket-whatsapp-template-select" className="text-sm font-medium text-slate-800">WhatsApp Template for Ticket Raised</label>
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1 px-2.5 text-xs"
              onClick={() => {
                setEditingTemplateId(null);
                templateForm.reset({ name: "", displayName: "", language: "en_US", description: "" });
                setShowAddTemplateForm(true);
              }}
            >
              <Plus size={14} /> Add Template
            </Button>
          </div>

          <Controller
            control={form.control}
            name="ticketCreatedTemplateId"
            render={({ field }) => (
              <select
                id="ticket-whatsapp-template-select"
                value={field.value || ""}
                onChange={field.onChange}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">-- Select a WhatsApp Template --</option>
                {templatesQuery.data?.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.displayName} ({tmpl.name}) [{tmpl.language}]
                  </option>
                ))}
              </select>
            )}
          />

          {/* Template Parameter Payload Preview */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-1 font-semibold text-slate-800 mb-1">
              <Sparkles size={13} className="text-blue-600" />
              <span>Dynamic Template Parameters:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
              <div><code>&#123;&#123;1&#125;&#125;</code>: Customer Name</div>
              <div><code>&#123;&#123;2&#125;&#125;</code>: Ticket Title</div>
              <div><code>&#123;&#123;3&#125;&#125;</code>: Priority (Status)</div>
              <div><code>&#123;&#123;4&#125;&#125;</code>: Customer Mobile/Contact</div>
            </div>
          </div>
        </div>

        {/* Template Manager Collapsible */}
        {(
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Configured WhatsApp Templates
              </h3>
              <Button
                type="button"
                variant="outline"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => {
                  setEditingTemplateId(null);
                  templateForm.reset({ name: "", displayName: "", language: "en_US", description: "" });
                  setShowAddTemplateForm(!showAddTemplateForm);
                }}
              >
                <Plus size={13} /> {showAddTemplateForm ? "Cancel" : "Add Template"}
              </Button>
            </div>

            {/* Form to add template */}
            {showAddTemplateForm && (
              <div
                className="rounded-md border border-blue-200 bg-white p-3 space-y-2.5 shadow-sm"
              >
                <h4 className="text-xs font-semibold text-slate-800">{editingTemplateId ? "Edit WhatsApp Template" : "Add Approved WhatsApp Template"}</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">Approved Template Name</span>
                    <Input
                      placeholder="e.g. support_ticket_raised"
                      {...templateForm.register("name")}
                      className="mt-0.5 text-xs font-mono"
                    />
                    {templateForm.formState.errors.name && (
                      <p className="mt-0.5 text-[11px] text-red-600">
                        {templateForm.formState.errors.name.message}
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">Display Name</span>
                    <Input
                      placeholder="e.g. Support Ticket Raised"
                      {...templateForm.register("displayName")}
                      className="mt-0.5 text-xs"
                    />
                    {templateForm.formState.errors.displayName && (
                      <p className="mt-0.5 text-[11px] text-red-600">
                        {templateForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </label>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">Language Code</span>
                    <Input
                      placeholder="en_US"
                      {...templateForm.register("language")}
                      className="mt-0.5 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">Description (Optional)</span>
                    <Input
                      placeholder="e.g. Sent for urgent tickets"
                      {...templateForm.register("description")}
                      className="mt-0.5 text-xs"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    className="h-8 px-3 text-xs gap-1"
                    onClick={templateForm.handleSubmit(handleCreateTemplate)}
                    disabled={templateForm.formState.isSubmitting}
                  >
                    <Plus size={13} /> Save Template
                  </Button>
                </div>
              </div>
            )}

            {/* List of templates */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {templatesQuery.data?.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-2 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-900">
                      <span>{tmpl.displayName}</span>
                      <code className="text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                        {tmpl.name}
                      </code>
                      <span className="text-[10px] text-muted">({tmpl.language})</span>
                    </div>
                    {tmpl.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{tmpl.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="h-7 w-7 shrink-0 rounded grid place-items-center text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                    title="Edit template"
                    aria-label={`Edit ${tmpl.displayName}`}
                    onClick={() => {
                      setEditingTemplateId(tmpl.id);
                      templateForm.reset({ name: tmpl.name, displayName: tmpl.displayName, language: tmpl.language, description: tmpl.description ?? "" });
                      setShowAddTemplateForm(true);
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="h-7 w-7 rounded grid place-items-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete template"
                    aria-label={`Delete ${tmpl.displayName}`}
                    onClick={() => handleDeleteTemplate(tmpl.id, tmpl.displayName)}
                  >
                    <Trash2 size={13} />
                  </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Gateway Settings */}
        <div className="rounded-lg border border-slate-200">
          <button
            type="button"
            className="flex w-full items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors"
            onClick={() => setShowGatewayConfig(!showGatewayConfig)}
          >
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-800">
                Whaps Gateway Settings
              </span>
            </div>
            {showGatewayConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showGatewayConfig && (
            <div className="border-t border-slate-200 p-3 space-y-3 bg-slate-50/50">
              <p className="text-xs text-muted">
                Configure the WhatsApp gateway for this project. Ticket WhatsApp messages are sent only when this project has its own Vendor ID and Access Token.
              </p>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">Whaps Base URL (Optional)</span>
                <Input
                  placeholder="https://whaps.in/api"
                  {...form.register("providerUrl")}
                  className="mt-1 text-xs"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Whaps Vendor ID</span>
                  <Input
                    placeholder="Project vendor ID"
                    {...form.register("vendorId")}
                    className="mt-1 text-xs"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Whaps Access Token</span>
                  <div className="relative mt-1">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder={
                        settingsQuery.data?.hasCustomToken
                          ? "Leave blank to keep existing token"
                          : "Whaps access token"
                      }
                      className="pr-9 text-xs"
                      autoComplete="new-password"
                      {...form.register("accessToken")}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 grid w-8 place-items-center text-slate-400 hover:text-slate-600"
                      aria-label={showToken ? "Hide access token" : "Show access token"}
                      title={showToken ? "Hide access token" : "Show access token"}
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="min-w-0 space-y-1">
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-xs"
            onClick={handleTest}
            disabled={testing}
          >
            <Send size={14} /> {testing ? "Sending Test..." : "Send Test WhatsApp"}
          </Button>
            <p className="max-w-sm text-xs text-slate-500">
              Tests send to one number only: the entered number, or the first saved recipient if empty.
              Ticket alerts send to all saved recipients.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="gap-2"
            disabled={!projectId || form.formState.isSubmitting}
          >
            <Save size={16} /> Save WhatsApp Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}
