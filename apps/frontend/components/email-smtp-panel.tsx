"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Save, Send, Eye, EyeOff } from "lucide-react";
import { Button, Card, Input, Checkbox } from "@support-hub/ui";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { api } from "../lib/api";
import { useEmailSettings, useMe } from "../lib/queries";
import { useUiStore } from "../lib/store";
import { PanelHeader } from "./admin-panels";
import { CheckboxField } from "./checkbox-field";

const smtpSchema = z.object({
  smtpHost: z.string().min(1, "SMTP Host is required"),
  smtpPort: z.number().min(1, "SMTP Port is required"),
  smtpSecure: z.boolean(),
  smtpUser: z.string().min(1, "SMTP User is required"),
  smtpPassword: z.string().optional(),
  fromName: z.string().optional()
});

export function EmailSmtpPanel({ projectId }: { projectId?: string }) {
  const me = useMe();
  const settings = useEmailSettings(projectId);
  const showToast = useUiStore((state) => state.showToast);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof smtpSchema>>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      smtpPassword: "",
      fromName: ""
    }
  });

  useEffect(() => {
    if (settings.data) {
      form.reset({
        smtpHost: settings.data.smtpHost,
        smtpPort: settings.data.smtpPort,
        smtpSecure: settings.data.smtpSecure,
        smtpUser: settings.data.smtpUser,
        smtpPassword: "", // Don't show password
        fromName: settings.data.fromName ?? ""
      });
    }
  }, [settings.data, form]);

  const projectRole = me.data?.memberships.find((membership) => membership.projectId === projectId)?.role;
  const canEdit = me.data?.role === "ADMIN" || projectRole === "PROJECT_ADMIN";
  if (!canEdit) return null;

  const onSubmit = async (v: z.infer<typeof smtpSchema>) => {
    if (!projectId) return;
    try {
      await api.updateEmailSettings(projectId, v);
      showToast("SMTP settings saved successfully!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save SMTP settings", "error");
    }
  };

  const handleTest = async () => {
    if (!projectId) return;
    setTesting(true);
    try {
      await api.testEmailSettings(projectId);
      showToast("Test email queued. Check your inbox!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Test email failed", "error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200">
      <div className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
          <Mail size={18} />
        </span>
        <h2 className="text-base font-semibold">Email SMTP Settings</h2>
      </div>
      <form className="space-y-4 p-4" onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <p className="text-sm text-muted">
          Configure custom SMTP to send emails for this project instead of the default global email.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">SMTP Host</span>
            <Input className="mt-1" placeholder="smtp.gmail.com" {...form.register("smtpHost")} />
            {form.formState.errors.smtpHost && (
              <p className="mt-1 text-xs font-medium text-red-700">{form.formState.errors.smtpHost.message}</p>
            )}
          </label>
          
          <label className="block">
            <span className="text-sm font-medium">SMTP Port</span>
            <Input
              className="mt-1"
              type="number"
              placeholder="587"
              {...form.register("smtpPort", {
                valueAsNumber: true,
                onChange: (e) => {
                  const port = Number(e.target.value);
                  if (port === 465) {
                    form.setValue("smtpSecure", true);
                  } else if (port === 587 || port === 25) {
                    form.setValue("smtpSecure", false);
                  }
                }
              })}
            />
            {form.formState.errors.smtpPort && (
              <p className="mt-1 text-xs font-medium text-red-700">{form.formState.errors.smtpPort.message}</p>
            )}
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">SMTP User</span>
            <Input className="mt-1" placeholder="project@example.com" autoComplete="off" {...form.register("smtpUser")} />
            {form.formState.errors.smtpUser && (
              <p className="mt-1 text-xs font-medium text-red-700">{form.formState.errors.smtpUser.message}</p>
            )}
          </label>
          
          <label className="block">
            <span className="text-sm font-medium">SMTP Password</span>
            <div className="relative mt-1">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={settings.data ? "Leave blank to keep existing password" : "Password"}
                className="pr-10"
                autoComplete="new-password"
                {...form.register("smtpPassword")}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.formState.errors.smtpPassword && (
              <p className="mt-1 text-xs font-medium text-red-700">{form.formState.errors.smtpPassword.message}</p>
            )}
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Sender Name (Optional)</span>
          <Input className="mt-1" placeholder="e.g. Support Team" {...form.register("fromName")} />
          <span className="text-xs text-muted">Displayed as the sender name in recipient inboxes (e.g. "Support Team" &lt;noreply@example.com&gt;).</span>
        </label>

        <div className="space-y-1">
          <CheckboxField 
            control={form.control} 
            name="smtpSecure" 
            label="Use secure connection (SSL/TLS)" 
          />
          <p className="text-xs text-muted pl-6">
            Enable for Port 465 (SSL). Disable for Port 587 (STARTTLS).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || form.formState.isSubmitting}>
            <Save size={16} /> Save
          </Button>
          <Button
            type="button"
            className="gap-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
            disabled={!projectId || testing}
            onClick={handleTest}
          >
            <Send size={16} /> Test Email
          </Button>
        </div>
      </form>
    </Card>
  );
}
