"use client";

import { UserRole } from "@support-hub/shared-types";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button, Field, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@support-hub/ui";
import { api } from "@/lib/api";
import { useCreateAgent, useMe } from "@/lib/queries";
import { displayToast } from "@/lib/display-toast";
import { CheckboxField } from "../checkbox-field";
import { agentSchema } from "./project-access-shared";

export function ProjectAccessForm({ projectId, onSuccess }: { projectId?: string; onSuccess?: () => void }) {
  const createAgent = useCreateAgent(projectId);
  const me = useMe();

  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [agentLookup, setAgentLookup] = useState<{ email: string; exists: boolean; name?: string } | null>(null);
  const [isLookingUpAgent, setIsLookingUpAgent] = useState(false);

  const agentForm = useForm({
    resolver: zodResolver(agentSchema),
    defaultValues: { name: "", email: "", password: "", role: "PROJECT_AGENT" as const, emailNotificationsEnabled: false, mobileNumber: "", whatsappNotificationsEnabled: false }
  });
  const mobileNumber = agentForm.watch("mobileNumber");
  const validMobile = /^[1-9]\d{8,14}$/.test(mobileNumber.replace(/[\s()+-]/g, ""));
  useEffect(() => {
    if (!validMobile) agentForm.setValue("whatsappNotificationsEnabled", false);
  }, [agentForm, validMobile]);
  const watchedAgentEmail = agentForm.watch("email");
  const validEmail = agentSchema.shape.email.safeParse(watchedAgentEmail).success;
  useEffect(() => {
    if (!validEmail) agentForm.setValue("emailNotificationsEnabled", false);
  }, [agentForm, validEmail]);

  useEffect(() => {
    if (!projectId) return;
    const email = watchedAgentEmail.trim().toLowerCase();
    if (!z.email().safeParse(email).success) {
      setAgentLookup(null);
      return;
    }

    let cancelled = false;
    setIsLookingUpAgent(true);
    const timeout = window.setTimeout(async () => {
      try {
        const lookup = await api.lookupAgent(projectId, email);
        if (cancelled) return;
        setAgentLookup({ email, exists: lookup.exists, name: lookup.user?.name });
        if (lookup.exists && lookup.user?.name) {
          agentForm.setValue("name", lookup.user.name, { shouldValidate: true });
          agentForm.setValue("password", "");
        }
      } catch {
        if (!cancelled) setAgentLookup(null);
      } finally {
        if (!cancelled) setIsLookingUpAgent(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [agentForm, projectId, watchedAgentEmail]);

  const agentEmailExists = Boolean(agentLookup?.email === watchedAgentEmail.trim().toLowerCase() && agentLookup.exists);

  return (
    <form
      className="space-y-4 p-4"
      autoComplete="off"
      onSubmit={agentForm.handleSubmit((v) => {
        if (!agentEmailExists && (!v.password || v.password.length < 8)) {
          agentForm.setError("password", { message: "Password is required for a new user." });
          return;
        }
        createAgent.mutate(
          { ...v, password: agentEmailExists ? undefined : v.password },
          {
            onSuccess: () => {
              displayToast("Project access added successfully!", "success");
              agentForm.reset({ name: "", email: "", password: "", role: "PROJECT_AGENT", emailNotificationsEnabled: false, mobileNumber: "", whatsappNotificationsEnabled: false });
              setAgentLookup(null);
              onSuccess?.();
            },
            onError: (err: any) => displayToast(err.message || "Failed to add project access", "destructive")
          }
        );
      })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" error={agentForm.formState.errors.name?.message}>
          {(id) => <Input id={id} placeholder="Priya Sharma" autoComplete="new-password" {...agentForm.register("name")} />}
        </Field>
        <Field
          label="Email"
          description={
            isLookingUpAgent || agentEmailExists ? (
              <span className="block space-y-1">
                {isLookingUpAgent && <span className="block">Checking email...</span>}
                {agentEmailExists && <span className="block font-medium text-blue-700">Existing user. Password is already set.</span>}
              </span>
            ) : undefined
          }
          error={agentForm.formState.errors.email?.message}
        >
          {(id) => <Input id={id} placeholder="agent@example.com" autoComplete="new-password" {...agentForm.register("email")} />}
        </Field>
        <Field
          label="Mobile number (optional)"
          description="Include the country code, e.g. +91 9876543210. To receive WhatsApp alerts, also check the WhatsApp notifications box below."
          error={agentForm.formState.errors.mobileNumber?.message}
        >
          {(id) => <Input id={id} type="tel" placeholder="+91 9876543210" {...agentForm.register("mobileNumber")} />}
        </Field>
        {!agentEmailExists && (
          <Field label="Password" error={agentForm.formState.errors.password?.message}>
            {(id) => (
              <div className="relative">
                <Input id={id} type={showAgentPassword ? "text" : "password"} placeholder="Minimum 8 characters" className="pr-10" autoComplete="new-password" {...agentForm.register("password")} />
                <Button type="button" variant="ghost" size="none" className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600" onClick={() => setShowAgentPassword(!showAgentPassword)}>
                  {showAgentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            )}
          </Field>
        )}
        <Field label="Role" error={agentForm.formState.errors.role?.message}>
          {(id) => (
            <Controller
              control={agentForm.control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {me.data?.role === UserRole.ADMIN && <SelectItem value="PROJECT_ADMIN">Project Admin</SelectItem>}
                    <SelectItem value="PROJECT_AGENT">Project Agent</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
        <div className="flex flex-col justify-end gap-3 pb-2">
          <CheckboxField control={agentForm.control} name="emailNotificationsEnabled" label="Receive ticket email notifications" disabled={!validEmail} />
          <CheckboxField control={agentForm.control} name="whatsappNotificationsEnabled" label="Receive ticket WhatsApp notifications" disabled={!validMobile} />
        </div>
      </div>
      <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || createAgent.isPending}>
        <UserPlus size={16} /> Add Access
      </Button>
    </form>
  );
}
