"use client";
import Link from "next/link";
import { Globe2, Plus } from "lucide-react";
import { Button, Card, Input } from "@support-hub/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { slugify } from "../../../lib/helpers";
import { useProjects, useCreateProject } from "../../../lib/queries";
import { useUiStore } from "../../../lib/store";

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters."),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes.")
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-700">{message}</p>;
}

export default function ProjectsPage() {
  const projects = useProjects(true);
  const createProject = useCreateProject();
  const { setProject, showToast } = useUiStore();

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", key: "" }
  });

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      <Card className="overflow-hidden border-slate-200">
        <div className="flex items-center gap-2 border-b bg-white px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">
            <Globe2 size={18} />
          </span>
          <h2 className="text-base font-semibold">Create Project</h2>
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
            <Input
              className="mt-1"
              placeholder="Hospital Support"
              {...projectForm.register("name", {
                onChange: (e) => {
                  projectForm.setValue("key", slugify(e.target.value), { shouldValidate: true });
                }
              })}
            />
            <FieldError message={projectForm.formState.errors.name?.message} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Project Key</span>
            <Input
              className="mt-1"
              placeholder="hospital-support"
              {...projectForm.register("key")}
            />
            <FieldError message={projectForm.formState.errors.key?.message} />
          </label>
          <Button className="gap-2 bg-brand text-white" disabled={createProject.isPending}>
            <Plus size={16} /> Add Project
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
          {projects.data?.map(p => (
            <div key={p.id} className="flex justify-between items-center rounded-lg border bg-slate-50 p-3">
              <div>
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-muted">Key: {p.key}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-xs text-muted-dark font-mono bg-slate-200 px-2 py-1 rounded">
                  {p.id}
                </div>
                <Link href={`/projects/${p.id}/settings`} className="text-xs font-medium text-brand hover:underline">
                  Settings
                </Link>
              </div>
            </div>
          ))}
          {!projects.data?.length && (
            <div className="text-sm text-muted">No projects found. Create one above!</div>
          )}
        </div>
      </Card>
    </div>
  );
}
