"use client";

import type { SettingsTab } from "../lib/project-settings";

import { IntegrationPanel } from "./admin/integration-panel";
import { ProjectDetailsPanel } from "./admin/project-details-panel";
import { WebhookSettingsPanel } from "./webhook-settings-panel";
import { TicketEmailsPanel } from "./admin/ticket-emails-panel";
import { TicketWhatsappPanel } from "./admin/ticket-whatsapp-panel";
import { ProjectAccessPanel } from "./admin/project-access-panel";
import { EmailSmtpPanel } from "./email-smtp-panel";
import { BotConfigPanel } from "./bot-config-panel";
import { ChannelsPanel } from "./channels-panel";
import { WidgetPreview } from "./widget-preview";

export function AdminPanels({ project, tab }: { project?: { id: string; name: string; key: string }; tab: SettingsTab }) {
  const projectId = project?.id;

  return (
    <section key={tab} className="grid items-start gap-4 xl:grid-cols-2">
      {tab === "general" && (
        <>
          {project && <ProjectDetailsPanel key={project.id} project={project} />}
          <ProjectAccessPanel projectId={projectId} />
        </>
      )}
      {tab === "bot" && (
        <>
          <div className="flex min-w-0 flex-col gap-4">
            <BotConfigPanel projectId={projectId} />
            <ChannelsPanel projectId={projectId} />
          </div>
          <div className="min-w-0">
            <WidgetPreview projectId={projectId} projectKey={project?.key} projectName={project?.name} />
          </div>
        </>
      )}
      {tab === "email" && (
        <>
          <EmailSmtpPanel projectId={projectId} />
          <TicketEmailsPanel projectId={projectId} />
        </>
      )}
      {tab === "whatsapp" && <div className="min-w-0 xl:col-span-2"><TicketWhatsappPanel projectId={projectId} /></div>}
      {tab === "integrations" && (
        <>
          <IntegrationPanel projectId={projectId} />
          <WebhookSettingsPanel projectId={projectId} />
        </>
      )}
    </section>
  );
}

export function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-slate-50/60 px-4 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-blue-50 text-brand">{icon}</span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}
