"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button, Input, Select } from "@support-hub/ui";
import { api } from "@/lib/api";
import { useCreateAgent, useMe } from "@/lib/queries";
import { useUiStore } from "@/lib/store";
import { CheckboxField } from "../checkbox-field";
import { agentSchema, FieldError } from "./project-access-shared";

export function ProjectAccessForm({ projectId }: { projectId?: string }) {
  const createAgent = useCreateAgent(projectId);
  const me = useMe();
  const showToast = useUiStore((state) => state.showToast);
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [agentLookup, setAgentLookup] = useState<{ email: string; exists: boolean; name?: string } | null>(null);
  const [isLookingUpAgent, setIsLookingUpAgent] = useState(false);

  const agentForm = useForm({
    resolver: zodResolver(agentSchema),
    defaultValues: { name: "", email: "", password: "", role: "PROJECT_AGENT" as const, emailNotificationsEnabled: false }
  });
  const watchedAgentEmail = agentForm.watch("email");

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
              showToast("Project access added successfully!", "success");
              agentForm.reset({ name: "", email: "", password: "", role: "PROJECT_AGENT", emailNotificationsEnabled: false });
              setAgentLookup(null);
            },
            onError: (err: any) => showToast(err.message || "Failed to add project access", "error")
          }
        );
      })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <Input className="mt-1" placeholder="Priya Sharma" autoComplete="new-password" {...agentForm.register("name")} />
          <FieldError message={agentForm.formState.errors.name?.message} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <Input className="mt-1" placeholder="agent@example.com" autoComplete="new-password" {...agentForm.register("email")} />
          {isLookingUpAgent && <p className="mt-1 text-xs text-muted">Checking email...</p>}
          {agentEmailExists && <p className="mt-1 text-xs font-medium text-teal-700">Existing user. Password is already set.</p>}
          <FieldError message={agentForm.formState.errors.email?.message} />
        </label>
        {!agentEmailExists && (
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <div className="relative mt-1">
              <Input type={showAgentPassword ? "text" : "password"} placeholder="Minimum 8 characters" className="pr-10" autoComplete="new-password" {...agentForm.register("password")} />
              <button type="button" className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600" onClick={() => setShowAgentPassword(!showAgentPassword)}>
                {showAgentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError message={agentForm.formState.errors.password?.message} />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium">Role</span>
          <Select className="mt-1" {...agentForm.register("role")}>
            {me.data?.role === "ADMIN" && <option value="PROJECT_ADMIN">Project Admin</option>}
            <option value="PROJECT_AGENT">Project Agent</option>
          </Select>
          <FieldError message={agentForm.formState.errors.role?.message} />
        </label>
        <div className="flex items-end pb-2">
          <CheckboxField control={agentForm.control} name="emailNotificationsEnabled" label="Receive ticket email notifications" />
        </div>
      </div>
      <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || createAgent.isPending}>
        <UserPlus size={16} /> Add Access
      </Button>
    </form>
  );
}
