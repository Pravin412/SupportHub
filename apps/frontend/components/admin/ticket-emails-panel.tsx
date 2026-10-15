"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Bell, Plus, Save, X } from "lucide-react";
import { Badge, Button, Card, Input } from "@support-hub/ui";
import { parseEmailList } from "@support-hub/utils";
import { api } from "../../lib/api";
import { useEmailSettings, useNotificationSettings } from "../../lib/queries";
import { displayToast } from "../../lib/display-toast";
import { PanelHeader } from "../admin-panels";
import { CheckboxField } from "../checkbox-field";

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

export function TicketEmailsPanel({ projectId }: { projectId?: string }) {
  const notificationSettings = useNotificationSettings(projectId);
  const emailSettings = useEmailSettings(projectId);
  const [emailInput, setEmailInput] = useState("");

  const hasSmtpConfigured = Boolean(
    emailSettings.data?.smtpHost && emailSettings.data?.smtpUser
  );

  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { notificationEmail: "", ticketCreatedEnabled: false, ticketAssignedEnabled: false }
  });

  useEffect(() => {
    if (notificationSettings.data) {
      notificationForm.reset({
        notificationEmail: notificationSettings.data.notificationEmail ?? "",
        ticketCreatedEnabled: hasSmtpConfigured ? (notificationSettings.data.ticketCreatedEnabled ?? false) : false,
        ticketAssignedEnabled: hasSmtpConfigured ? (notificationSettings.data.ticketAssignedEnabled ?? false) : false
      });
    }
  }, [notificationSettings.data, hasSmtpConfigured, notificationForm]);

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
      displayToast("Enter a valid email address.", "destructive");
      return;
    }
    setNotificationRecipients(Array.from(new Set([...notificationRecipients, ...nextEmails])));
    setEmailInput("");
  };
  const removeNotificationRecipient = (email: string) => {
    setNotificationRecipients(notificationRecipients.filter((recipient) => recipient !== email));
  };

  return (
    <Card className="overflow-hidden border-slate-200">
      <PanelHeader icon={<Bell size={18} />} title="Ticket Emails" />
      <form
        className="space-y-4 p-4"
        onSubmit={notificationForm.handleSubmit(async (v) => {
          if (!projectId) return;

          if ((v.ticketCreatedEnabled || v.ticketAssignedEnabled) && !hasSmtpConfigured) {
            displayToast(
              "You should first configure Email SMTP Settings. Once you fill this, then only you can enable ticket emails.",
              "destructive"
            );
            return;
          }

          try {
            await api.updateNotificationSettings(projectId, v);
            await notificationSettings.refetch();
            displayToast("Ticket email settings saved successfully!", "success");
          } catch (err) {
            displayToast(err instanceof Error ? err.message : "Failed to save ticket email settings", "destructive");
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
              <Badge key={email} className="gap-1 border-blue-100 bg-blue-50 text-blue-800">
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
                  className="ml-1 h-auto border-0 bg-transparent p-0.5 text-blue-700 shadow-none hover:bg-blue-100 hover:text-blue-950"
                  onClick={() => removeNotificationRecipient(email)}
                >
                  <X size={12} />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {!hasSmtpConfigured && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Email SMTP Settings Required</p>
              <p className="mt-0.5 text-amber-800">
                You should first configure Email SMTP Settings below. Once you fill this, then only you can enable ticket emails.
              </p>
            </div>
          </div>
        )}

        <div
          onClick={() => {
            if (!hasSmtpConfigured) {
              displayToast(
                "You should first configure Email SMTP Settings. Once you fill this, then only you can enable ticket emails.",
                "destructive"
              );
            }
          }}
          className="space-y-3"
        >
          <CheckboxField 
            control={notificationForm.control} 
            name="ticketCreatedEnabled" 
            label="Send mail when keyword raises a ticket" 
            disabled={!hasSmtpConfigured}
          />
          <CheckboxField 
            control={notificationForm.control} 
            name="ticketAssignedEnabled" 
            label="Send mail when ticket status changes" 
            disabled={!hasSmtpConfigured}
          />
        </div>

        <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || notificationForm.formState.isSubmitting}>
          <Save size={16} /> Save Emails
        </Button>
      </form>
    </Card>
  );
}
