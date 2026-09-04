"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, UserPlus, Eye, EyeOff } from "lucide-react";
import { Badge, Button, Card, Input, Select } from "@support-hub/ui";
import { api } from "../../lib/api";
import { useAgents, useCreateAgent, useMe } from "../../lib/queries";
import { useUiStore } from "../../lib/store";
import { PanelHeader } from "../admin-panels";

const agentSchema = z.object({
  name: z.string().min(2, "Agent name must be at least 2 characters."),
  email: z.email("Enter a valid email address."),
  password: z.string().optional(),
  role: z.enum(["PROJECT_ADMIN", "PROJECT_AGENT"])
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-700">{message}</p>;
}

export function ProjectAccessPanel({ projectId }: { projectId?: string }) {
  const createAgent = useCreateAgent(projectId);
  const agents = useAgents(projectId);
  const me = useMe();
  const showToast = useUiStore((state) => state.showToast);

  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [showResetPasswords, setShowResetPasswords] = useState<Record<string, boolean>>({});
  const [agentLookup, setAgentLookup] = useState<{ email: string; exists: boolean; name?: string } | null>(null);
  const [isLookingUpAgent, setIsLookingUpAgent] = useState(false);

  const agentForm = useForm<z.infer<typeof agentSchema>>({
    resolver: zodResolver(agentSchema),
    defaultValues: { name: "", email: "", password: "", role: "PROJECT_AGENT" }
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
    <Card className="overflow-hidden border-slate-200">
      <PanelHeader icon={<Users size={18} />} title="Project Access" />
      <form
        className="space-y-4 p-4"
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
              agentForm.reset({ name: "", email: "", password: "", role: "PROJECT_AGENT" });
              setAgentLookup(null);
            },
            onError: (err: any) => {
              showToast(err.message || "Failed to add project access", "error");
            }
          });
        })}
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
            {isLookingUpAgent && <p className="mt-1 text-xs text-muted">Checking email...</p>}
            {agentEmailExists && <p className="mt-1 text-xs font-medium text-teal-700">Existing user. Password is already set.</p>}
            <FieldError message={agentForm.formState.errors.email?.message} />
          </label>
          {!agentEmailExists && (
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <div className="relative mt-1">
                <Input type={showAgentPassword ? "text" : "password"} placeholder="Minimum 8 characters" className="pr-10" {...agentForm.register("password")} />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowAgentPassword(!showAgentPassword)}
                >
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
        </div>
        <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId || createAgent.isPending}>
          <UserPlus size={16} /> Add Access
        </Button>
      </form>
      <div className="space-y-2 border-t bg-slate-50 p-4">
        {agents.data?.filter(agent => agent.role !== "ADMIN").map((agent) => (
          <div key={agent.id} className="rounded-md border bg-white px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-slate-900">{agent.user.name}</div>
                <div className="text-xs text-muted">{agent.user.email}</div>
              </div>
              <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                {agent.role === "PROJECT_ADMIN" ? "Project Admin" : "Project Agent"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Input
                  type={showResetPasswords[agent.id] ? "text" : "password"}
                  className="h-9 w-full pr-10"
                  placeholder="New password"
                  value={resetPasswords[agent.id] ?? ""}
                  onChange={(event) => setResetPasswords((current) => ({ ...current, [agent.id]: event.target.value }))}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowResetPasswords((current) => ({ ...current, [agent.id]: !current[agent.id] }))}
                >
                  {showResetPasswords[agent.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button
                type="button"
                className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={async () => {
                  if (!projectId) return;
                  const password = resetPasswords[agent.id]?.trim();
                  if (!password || password.length < 8) {
                    showToast("Password must be at least 8 characters.", "error");
                    return;
                  }
                  if (!window.confirm("Are you sure you want to reset the password for this agent?")) return;
                  try {
                    await api.updateAgentPassword(projectId, agent.id, password);
                    setResetPasswords((current) => ({ ...current, [agent.id]: "" }));
                    showToast("Password reset successfully.", "success");
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Failed to reset password", "error");
                  }
                }}
              >
                Reset Password
              </Button>
              <Button
                type="button"
                className="h-9 border-red-200 bg-white text-red-600 hover:bg-red-50"
                onClick={async () => {
                  if (!projectId) return;
                  if (!window.confirm("Are you sure you want to remove access for this agent?")) return;
                  try {
                    await api.removeAgent(projectId, agent.id!);
                    showToast("Access removed.", "success");
                    agents.refetch();
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Failed to remove access", "error");
                  }
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
