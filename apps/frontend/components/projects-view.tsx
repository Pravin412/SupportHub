"use client";

import Link from "next/link";
import { Folder, Globe2, LayoutGrid, List, Plus, Settings, Ticket, Trash2, Users } from "lucide-react";
import { Badge, Button, Card, Input } from "@support-hub/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProjects, useCreateProject, useDeleteProject, useDashboardSummary, useMe } from "../lib/queries";
import { useInboxSelectionStore } from "../lib/inbox-selection-store";
import { displayToast } from "../lib/display-toast";
import { useState } from "react";
import { useConfirmationModalStore } from "../lib/confirmation-modal-store";

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters.")
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-error-muted">{message}</p>;
}

export function ProjectsView() {
  const projects = useProjects(true);
  const summary = useDashboardSummary("all", true);
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const me = useMe();
  const { setProject, selectedProjectId } = useInboxSelectionStore();

  const openConfirmation = useConfirmationModalStore(state => state.openConfirmation);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "" }
  });

  const handleDelete = (projectId: string, projectName: string) => {
    async function confirmDelete() {
        await deleteProject.mutateAsync(projectId);
        displayToast(`Project "${projectName}" deleted.`, "success");
        if (selectedProjectId === projectId) {
          setProject("");
        }
    }
    openConfirmation({ title: "Delete project", message: `Are you sure you want to permanently delete project "${projectName}" and all its conversations?`, confirmLabel: "Delete", icon: <Trash2 size={18} />, onConfirm: confirmDelete });
  };

  const totalProjects = summary.data?.projectsCount ?? projects.data?.length ?? 0;
  const openTickets = summary.data?.openTicketsCount ?? 0;
  const teamMembers = summary.data?.agentsCount ?? 0;
  const isGlobalAdmin = me.data?.role === "ADMIN";
  const canManageProject = (projectId: string) =>
    isGlobalAdmin || me.data?.memberships.some((membership) => membership.projectId === projectId && membership.role === "PROJECT_ADMIN");

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage your support workspaces.</p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutGrid size={14} /> Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List size={14} /> List
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center justify-between p-5 border-slate-200 shadow-sm">
          <div>
            <div className="text-sm font-medium text-slate-500">Total Projects</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{totalProjects}</div>
          </div>
          <Folder size={24} className="text-slate-400" />
        </Card>
        <Card className="flex items-center justify-between p-5 border-slate-200 shadow-sm">
          <div>
            <div className="text-sm font-medium text-slate-500">Open Tickets</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{openTickets}</div>
          </div>
          <Ticket size={24} className="text-slate-400" />
        </Card>
        <Card className="flex items-center justify-between p-5 border-slate-200 shadow-sm">
          <div>
            <div className="text-sm font-medium text-slate-500">Team Members</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{teamMembers}</div>
          </div>
          <Users size={24} className="text-slate-400" />
        </Card>
      </div>

      {/* Available Projects Heading */}
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-base font-bold text-slate-900">Available Projects</h2>
        <span className="flex h-5 items-center justify-center rounded-full bg-teal-50 px-2 text-xs font-medium text-brand">
          {projects.data?.length ?? 0}
        </span>
      </div>

      {/* Projects List Container */}
      <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        {/* Create Project Card Block */}
        {isGlobalAdmin && <Card className="p-5 border-slate-200 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-teal-50 text-brand">
              <Plus size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Project</h3>
              <p className="text-xs text-slate-500">A unique 16-char key is auto-assigned.</p>
            </div>
          </div>
          <form
            className="space-y-4"
            onSubmit={projectForm.handleSubmit((v) =>
              createProject.mutate(v, {
                onSuccess: (createdProject) => {
                  setProject(createdProject.id);
                  displayToast(`Project "${createdProject.name}" created successfully!`, "success");
                  projectForm.reset();
                },
                onError: (err) => {
                  displayToast(err.message || "Failed to create project", "destructive");
                }
              })
            )}
          >
            <label className="block">
              <span className="text-xs font-bold text-slate-700">Project Name</span>
              <Input className="mt-1" placeholder="e.g. Project Name" {...projectForm.register("name")} />
              <FieldError message={projectForm.formState.errors.name?.message} />
            </label>
            <Button className="w-full gap-2 bg-brand text-white hover:bg-brand/90" disabled={createProject.isPending}>
              <Plus size={16} /> {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </Card>}

        {/* Existing Projects List */}
        {projects.data?.map((project) => (
          <Card
            key={project.id}
            className="flex flex-col p-5 border-slate-200 shadow-sm transition-all hover:border-slate-300"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600">
                  <Globe2 size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{project.name}</h3>
                  <p className="text-xs font-mono text-slate-500">{project.key}</p>
                </div>
              </div>
              <Badge className="bg-teal-50 text-brand border-0">Active</Badge>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-auto">
              <Button asChild className="flex-1 justify-center border-slate-200 bg-white text-slate-700 hover:bg-slate-50 border shadow-none">
                <Link href={`/tickets/${project.id}`}>
                  <Ticket size={16} className="mr-2" />
                  Tickets
                </Link>
              </Button>
              {canManageProject(project.id) && (
                <>
                  <Button
                    asChild
                    className="flex-1 justify-center border-slate-200 bg-white text-slate-700 hover:bg-slate-50 border shadow-none"
                  >
                    <Link href={`/projects/${project.id}/settings`}>
                      <Settings size={16} className="mr-2" />
                      Settings
                    </Link>
                  </Button>
                  {isGlobalAdmin && (
                    <Button
                      type="button"
                      title="Delete project"
                      disabled={deleteProject.isPending}
                      onClick={handleDelete.bind(null, project.id, project.name)}
                      className="shrink-0 border-slate-200 bg-white text-error hover:bg-error-surface hover:text-error-muted hover:border-error-border border shadow-none px-3"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        ))}
        {!projects.data?.length && (
          <div className="py-8 text-center text-sm text-slate-500 col-span-full">No projects found</div>
        )}
      </div>

    </div>
  );
}
