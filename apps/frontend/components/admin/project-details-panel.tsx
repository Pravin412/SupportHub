"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Folder, Save } from "lucide-react";
import { Button, Card, Input } from "@support-hub/ui";
import { api } from "../../lib/api";
import { keys } from "../../lib/queries";
import { displayToast } from "../../lib/display-toast";
import { PanelHeader } from "../admin-panels";

export function ProjectDetailsPanel({ project }: { project: { id: string; name: string } }) {
  const [draftName, setDraftName] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const name = draftName ?? project.name;
  const rename = useMutation({
    mutationFn: (value: string) => api.renameProject(project.id, value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.projects });
      setDraftName(null);
      displayToast("Project name updated.", "success");
    },
    onError: (error: Error) => displayToast(error.message || "Unable to update project name.", "destructive")
  });

  return (
    <Card className="overflow-hidden border-slate-200">
      <PanelHeader icon={<Folder size={18} />} title="Project details" />
      <form className="space-y-3 p-4" onSubmit={(event) => {
        event.preventDefault();
        if (name.trim().length >= 2 && name.trim() !== project.name && !rename.isPending) rename.mutate(name.trim());
      }}>
        <label className="block space-y-1 text-sm" htmlFor="project-name">
          <span>Project name</span>
          <Input id="project-name" value={name} onChange={(event) => setDraftName(event.target.value)} required minLength={2} disabled={rename.isPending} />
        </label>
        <Button type="submit" className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={rename.isPending || name.trim().length < 2 || name.trim() === project.name}>
          <Save size={16} /> {rename.isPending ? "Saving..." : "Save name"}
        </Button>
      </form>
    </Card>
  );
}
