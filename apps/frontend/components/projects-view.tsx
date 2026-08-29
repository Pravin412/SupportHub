"use client";

import Link from "next/link";
import { Globe2, Plus, Trash2 } from "lucide-react";
import { Button, Card, Input } from "@support-hub/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProjects, useCreateProject, useDeleteProject } from "../lib/queries";
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
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const { setProject, selectedProjectId, showToast } = useUiStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

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

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      <Card className="overflow-hidden border-slate-200">
        <div className="flex items-center gap-2 border-b bg-white px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
            <Globe2 size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold">Create Project</h2>
            <p className="text-xs text-muted">
              Enter project name. A unique 16-character key is assigned automatically.
            </p>
          </div>
        </div>
        <form
          className="space-y-4 p-4"
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
            <span className="text-sm font-medium">Project Name</span>
            <Input className="mt-1" placeholder="e.g. Project Name" {...projectForm.register("name")} />
            <FieldError message={projectForm.formState.errors.name?.message} />
          </label>
          <Button className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={createProject.isPending}>
            <Plus size={16} /> {createProject.isPending ? "Creating..." : "Create Project"}
          </Button>
          {createProject.error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {createProject.error.message}
            </p>
          )}
        </form>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        <div className="flex items-center gap-2 border-b bg-white px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
            <Globe2 size={18} />
          </span>
          <h2 className="text-base font-semibold">Available Projects ({projects.data?.length ?? 0})</h2>
        </div>
        <div className="p-4 space-y-3">
          {projects.data?.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap justify-between items-center gap-3 rounded-lg border bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-all"
            >
              <div>
                <div className="font-semibold text-sm text-slate-900">{p.name}</div>
                <div className="text-xs font-mono text-slate-500 mt-0.5">Key: {p.key}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/projects/${p.id}/settings`}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  title="Delete project"
                  disabled={deletingId === p.id}
                  onClick={() => setProjectToDelete({ id: p.id, name: p.name })}
                  className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!projects.data?.length && (
            <div className="text-sm text-muted py-4 text-center">No projects found. Create one above!</div>
          )}
        </div>
      </Card>
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
