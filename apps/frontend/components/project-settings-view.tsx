"use client";

import { canManageProjectSettings } from "@support-hub/shared-types";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@support-hub/ui";
import { settingsTabs, type SettingsTab } from "../lib/project-settings";
import { AdminPanels } from "./admin-panels";
import { BackButton } from "./back-button";
import { LoadingIndicator } from "./loading-indicator";
import { useMe, useProjects } from "../lib/queries";

export function ProjectSettingsView({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const projects = useProjects(true);
  const me = useMe();
  const selectedProject = projects.data?.find((project) => project.id === projectId);
  const projectRole = me.data?.memberships.find((membership) => membership.projectId === projectId)?.role;
  const canManageSettings = canManageProjectSettings(me.data?.role, projectRole);

  if (projects.isLoading || me.isLoading) {
    return (
      <div className="grid h-settings place-items-center">
        <LoadingIndicator />
      </div>
    );
  }

  if (!selectedProject) {
    return <div className="p-8 text-sm text-muted">No project selected.</div>;
  }

  if (!canManageSettings) {
    return <div className="p-8 text-sm text-muted">You can view this project's inbox and tickets, but settings are available only to project admins.</div>;
  }

  return (
    <div className="relative flex h-settings min-h-0 flex-col overflow-hidden bg-canvas">
      <div className="shrink-0 px-4 py-3 border-b bg-white/50 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton fallbackHref="/projects" />
          <h1 className="truncate text-lg font-semibold">{selectedProject.name} Settings</h1>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 overflow-x-auto border-b bg-white px-4 py-2">
          <TabsList aria-label="Project settings">
            {settingsTabs.map((item) => <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>)}
          </TabsList>
        </div>
        {settingsTabs.map((item) => (
          <TabsContent key={item.id} value={item.id} className="m-0 min-h-0 flex-1 overflow-y-auto p-4" >
            <h2 className="mb-4 text-lg font-semibold">{item.label} settings</h2>
            <AdminPanels project={selectedProject} tab={item.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
