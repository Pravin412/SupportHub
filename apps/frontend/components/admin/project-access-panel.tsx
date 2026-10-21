"use client";

import { UserRole } from "@support-hub/shared-types";

import { useState } from "react";
import { Edit2, Eye, EyeOff, Save, UserPlus, Users, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  LabeledCheckbox,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@support-hub/ui";
import type { ProjectAccessMember } from "../../lib/api/agents";
import { api } from "../../lib/api";
import { useAgents, useMe, useUpdateAgent } from "../../lib/queries";
import { displayToast } from "../../lib/display-toast";
import { PanelHeader } from "../admin-panels";
import { ProjectAccessForm } from "./project-access-form";
import { agentSchema, type AgentEdit, type AgentRole } from "./project-access-shared";

export function ProjectAccessPanel({ projectId }: { projectId?: string }) {
  const updateAgent = useUpdateAgent(projectId);
  const agents = useAgents(projectId);
  const me = useMe();


  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [showResetPasswords, setShowResetPasswords] = useState<Record<string, boolean>>({});
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [showAddAccess, setShowAddAccess] = useState(false);
  const [agentEdits, setAgentEdits] = useState<Record<string, AgentEdit>>({});

  const updateAgentEdit = (
    agent: ProjectAccessMember,
    values: Partial<AgentEdit>
  ) => {
    setAgentEdits((current) => ({
      ...current,
      [agent.id]: {
        name: current[agent.id]?.name ?? agent.user.name,
        email: current[agent.id]?.email ?? agent.user.email,
        role: current[agent.id]?.role ?? (agent.role as AgentRole),
        emailNotificationsEnabled: current[agent.id]?.emailNotificationsEnabled ?? agent.emailNotificationsEnabled,
        mobileNumber: current[agent.id]?.mobileNumber ?? agent.mobileNumber ?? "",
        whatsappNotificationsEnabled: current[agent.id]?.whatsappNotificationsEnabled ?? agent.whatsappNotificationsEnabled,
        ...values
      }
    }));
  };

  return (
    <Card className="overflow-hidden border-slate-200">
      <PanelHeader icon={<Users size={18} />} title="Project Access" />
      <div className="p-4">
        <Button type="button" className="gap-2 bg-brand text-white hover:bg-brand/90"
          aria-expanded={showAddAccess} aria-controls="add-project-access"
          onClick={() => setShowAddAccess((current) => !current)}>
          {showAddAccess ? <X size={16} /> : <UserPlus size={16} />}
          {showAddAccess ? "Cancel" : "Add project access"}
        </Button>
      </div>
      {showAddAccess && <div id="add-project-access" className="border-t">
        <ProjectAccessForm projectId={projectId} onSuccess={() => setShowAddAccess(false)} />
      </div>}
      <Accordion
        type="single"
        collapsible
        className="space-y-2 border-t bg-slate-50 p-4"
        value={expandedAgentId ?? ""}
        onValueChange={(v) => setExpandedAgentId(v || null)}
      >
        {agents.data?.filter(agent => agent.role !== UserRole.ADMIN).map((agent) => (
          <AccordionItem key={agent.id} value={agent.id} className="overflow-hidden rounded-md border bg-white text-sm last:border-b">
            <AccordionTrigger className="px-3 py-3 font-normal hover:bg-slate-50 hover:no-underline">
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-900">{agent.user.name}</span>
                <span className="block truncate text-xs text-muted">{agent.user.email}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="border-t px-3 py-3">
            {editingAgentId === agent.id ? (
              <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                <Input
                  className="h-9"
                  placeholder="Name"
                  autoComplete="new-password"
                  value={agentEdits[agent.id]?.name ?? agent.user.name}
                  onChange={(event) => updateAgentEdit(agent, { name: event.target.value })}
                />
                <Input
                  className="h-9"
                  placeholder="Email"
                  autoComplete="new-password"
                  value={agentEdits[agent.id]?.email ?? agent.user.email}
                  onChange={(event) => {
                    const email = event.target.value;
                    const valid = agentSchema.shape.email.safeParse(email).success;
                    updateAgentEdit(agent, { email, ...(!valid ? { emailNotificationsEnabled: false } : {}) });
                  }}
                />
                <Field label="Mobile number (optional)" labelClassName="text-xs font-normal text-muted">
                  {(id) => (
                    <Input id={id} type="tel" className="h-9" placeholder="+91 9876543210"
                      value={agentEdits[agent.id]?.mobileNumber ?? agent.mobileNumber ?? ""}
                      onChange={(event) => {
                        const mobileNumber = event.target.value;
                        const valid = /^[1-9]\d{8,14}$/.test(mobileNumber.replace(/[\s()+-]/g, ""));
                        updateAgentEdit(agent, { mobileNumber, ...(!valid ? { whatsappNotificationsEnabled: false } : {}) });
                      }} />
                  )}
                </Field>
                <Select
                  value={agentEdits[agent.id]?.role ?? agent.role}
                  onValueChange={(value) => updateAgentEdit(agent, { role: value as "PROJECT_ADMIN" | "PROJECT_AGENT" })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {me.data?.role === UserRole.ADMIN && <SelectItem value="PROJECT_ADMIN">Project Admin</SelectItem>}
                    <SelectItem value="PROJECT_AGENT">Project Agent</SelectItem>
                  </SelectContent>
                </Select>
                <LabeledCheckbox
                  label="Ticket emails"
                  className="min-h-9"
                  checkboxClassName="rounded border-slate-300"
                  disabled={!agentSchema.shape.email.safeParse(agentEdits[agent.id]?.email ?? agent.user.email).success}
                  checked={agentEdits[agent.id]?.emailNotificationsEnabled ?? agent.emailNotificationsEnabled}
                  onCheckedChange={(checked) => updateAgentEdit(agent, { emailNotificationsEnabled: checked === true })}
                />
                <LabeledCheckbox
                  label="Ticket WhatsApp notifications"
                  className="min-h-9"
                  disabled={!/^[1-9]\d{8,14}$/.test((agentEdits[agent.id]?.mobileNumber ?? agent.mobileNumber ?? "").replace(/[\s()+-]/g, ""))}
                  checked={agentEdits[agent.id]?.whatsappNotificationsEnabled ?? agent.whatsappNotificationsEnabled}
                  onCheckedChange={(checked) => updateAgentEdit(agent, { whatsappNotificationsEnabled: checked === true })}
                />
                <div className="flex gap-2 sm:col-span-2">
                  <Button
                    type="button"
                    className="h-9 gap-2 bg-brand px-3 text-white hover:bg-brand/90"
                    disabled={updateAgent.isPending}
                    onClick={() => {
                      if (!projectId) return;
                      const values = agentEdits[agent.id] ?? {
                        name: agent.user.name,
                        email: agent.user.email,
                        role: agent.role as AgentRole,
                        mobileNumber: agent.mobileNumber ?? "",
                          whatsappNotificationsEnabled: agent.whatsappNotificationsEnabled,
                          emailNotificationsEnabled: agent.emailNotificationsEnabled
                      };
                      const parsedValues = agentSchema.omit({ password: true }).safeParse(values);
                      if (!parsedValues.success) {
                        displayToast(parsedValues.error.issues[0]?.message || "Enter valid access details.", "destructive");
                        return;
                      }
                      updateAgent.mutate(
                        { memberId: agent.id, ...parsedValues.data },
                        {
                          onSuccess: () => {
                            displayToast("Access updated.", "success");
                            setEditingAgentId(null);
                          },
                          onError: (err: any) => displayToast(err.message || "Failed to update access", "destructive")
                        }
                      );
                    }}
                  >
                    <Save size={15} /> Save
                  </Button>
                  <Button
                    type="button"
                    className="h-9 px-3 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={() => setEditingAgentId(null)}
                  >
                    <X size={15} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {agent.mobileNumber && <span className="text-xs text-muted">{agent.mobileNumber}</span>}
                  <Badge className="border-slate-200 bg-slate-50 text-slate-700">{agent.whatsappNotificationsEnabled ? "WhatsApp on" : "WhatsApp off"}</Badge>
                  <Badge className={agent.emailNotificationsEnabled ? "border-blue-100 bg-blue-50 text-blue-800" : "border-slate-200 bg-slate-50 text-slate-500"}>
                    {agent.emailNotificationsEnabled ? "Ticket emails on" : "Ticket emails off"}
                  </Badge>
                  <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                    {agent.role === UserRole.PROJECT_ADMIN ? "Project Admin" : "Project Agent"}
                  </Badge>
                  <Button
                    type="button"
                    className="h-8 gap-2 border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setEditingAgentId(agent.id);
                      setAgentEdits((current) => ({
                        ...current,
                        [agent.id]: {
                          name: agent.user.name,
                          email: agent.user.email,
                          role: agent.role as AgentRole,
                          mobileNumber: agent.mobileNumber ?? "",
                          whatsappNotificationsEnabled: agent.whatsappNotificationsEnabled,
                          emailNotificationsEnabled: agent.emailNotificationsEnabled
                        }
                      }));
                    }}
                  >
                    <Edit2 size={14} /> Edit
                  </Button>
                </div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Input
                  type={showResetPasswords[agent.id] ? "text" : "password"}
                  className="h-9 w-full pr-10"
                  placeholder="New password"
                  autoComplete="new-password"
                  value={resetPasswords[agent.id] ?? ""}
                  onChange={(event) => setResetPasswords((current) => ({ ...current, [agent.id]: event.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="none"
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowResetPasswords((current) => ({ ...current, [agent.id]: !current[agent.id] }))}
                >
                  {showResetPasswords[agent.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <Button
                type="button"
                className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={async () => {
                  if (!projectId) return;
                  const password = resetPasswords[agent.id]?.trim();
                  if (!password || password.length < 8) {
                    displayToast("Password must be at least 8 characters.", "destructive");
                    return;
                  }
                  if (!window.confirm("Are you sure you want to reset the password for this agent?")) return;
                  try {
                    await api.updateAgentPassword(projectId, agent.id, password);
                    setResetPasswords((current) => ({ ...current, [agent.id]: "" }));
                    displayToast("Password reset successfully.", "success");
                  } catch (err) {
                    displayToast(err instanceof Error ? err.message : "Failed to reset password", "destructive");
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
                    displayToast("Access removed.", "success");
                    agents.refetch();
                  } catch (err) {
                    displayToast(err instanceof Error ? err.message : "Failed to remove access", "destructive");
                  }
                }}
              >
                Remove
              </Button>
            </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
