"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Plus, Save, X } from "lucide-react";
import { Badge, Button, Card, Input } from "@support-hub/ui";
import { parseEmailList } from "@support-hub/utils";
import { api } from "../../lib/api";
import { useNotificationSettings } from "../../lib/queries";
import { useUiStore } from "../../lib/store";
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
  const [emailInput, setEmailInput] = useState("");
  const showToast = useUiStore((state) => state.showToast);

  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { notificationEmail: "", ticketCreatedEnabled: true, ticketAssignedEnabled: true }
  });

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
        <CheckboxField 
          control={notificationForm.control} 
          name="ticketCreatedEnabled" 
          label="Send mail when keyword raises a ticket" 
        />
        <CheckboxField 
          control={notificationForm.control} 
          name="ticketAssignedEnabled" 
          label="Send mail when ticket status changes" 
        />
        <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || notificationForm.formState.isSubmitting}>
          <Save size={16} /> Save Emails
        </Button>
      </form>
    </Card>
  );
}
