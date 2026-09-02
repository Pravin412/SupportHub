"use client";

import Link from "next/link";
import { Folder, Globe2, LayoutGrid, List, Plus, Settings, Ticket, Trash2, Users } from "lucide-react";
import { Badge, Button, Card, Input } from "@support-hub/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProjects, useCreateProject, useDeleteProject, useDashboardSummary } from "../lib/queries";
import { useUiStore } from "../lib/store";
import { useState } from "react";
import { ConfirmationModal } from "./confirmation-modal";

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters.")
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-700">{message}</p>;
}

export function ProjectsView() {
  const projects = useProjects(true);
  const summary = useDashboardSummary("all", true);
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const { setProject, selectedProjectId, showToast } = useUiStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "" }
  });

  const handleDelete = (projectId: string, projectName: string) => {
    setDeletingId(projectId);
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        showToast(`Project "${projectName}" deleted.`, "success");
        setProjectToDelete(null);
        if (selectedProjectId === projectId) {
          setProject("");
        }
      },
      onError: (err) => {
        showToast(err.message || "Failed to delete project", "error");
      },
      onSettled: () => {
        setDeletingId(null);
      }
    });
  };

  const totalProjects = summary.data?.projectsCount ?? projects.data?.length ?? 0;
  const openTickets = summary.data?.openTicketsCount ?? 0;
  const teamMembers = summary.data?.agentsCount ?? 0;

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
        <Card className="p-5 border-slate-200 shadow-sm">
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
                  showToast(`Project "${createdProject.name}" created successfully!`, "success");
                  projectForm.reset();
                },
                onError: (err) => {
                  showToast(err.message || "Failed to create project", "error");
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
            {createProject.error && (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {createProject.error.message}
              </p>
            )}
          </form>
        </Card>

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

            <div className="mb-4 flex items-center gap-4 text-sm text-slate-500 flex-1">
              <div className="flex items-center gap-1.5">
                <Ticket size={16} />
                <span>Tickets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={16} />
                <span>Members</span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-auto">
              <Button
                asChild
                className="flex-1 justify-center border-slate-200 bg-white text-slate-700 hover:bg-slate-50 border shadow-none"
              >
                <Link href={`/projects/${project.id}/settings`}>
                  <Settings size={16} className="mr-2" />
                  Settings
                </Link>
              </Button>
              <Button
                type="button"
                title="Delete project"
                disabled={deletingId === project.id}
                onClick={() => setProjectToDelete({ id: project.id, name: project.name })}
                className="shrink-0 border-slate-200 bg-white text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border shadow-none px-3"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </Card>
        ))}
        {!projects.data?.length && (
          <div className="py-8 text-center text-sm text-slate-500 col-span-full">No projects found</div>
        )}
      </div>

      <ConfirmationModal
        open={Boolean(projectToDelete)}
        title="Delete project"
        message={`Are you sure you want to permanently delete project "${projectToDelete?.name ?? ""}" and all its conversations?`}
        confirmLabel={deletingId ? "Deleting..." : "Delete"}
        icon={<Trash2 size={18} />}
        isLoading={Boolean(deletingId)}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) handleDelete(projectToDelete.id, projectToDelete.name);
        }}
      />
    </div>
  );
}
