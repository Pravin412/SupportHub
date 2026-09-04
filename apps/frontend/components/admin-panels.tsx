"use client";

import { motion } from "framer-motion";
import { TicketCheck } from "lucide-react";
import { Button, Card } from "@support-hub/ui";
import Link from "next/link";

import { IntegrationPanel } from "./admin/integration-panel";
import { WebhookSettingsPanel } from "./webhook-settings-panel";
import { TicketEmailsPanel } from "./admin/ticket-emails-panel";
import { ProjectAccessPanel } from "./admin/project-access-panel";
import { EmailSmtpPanel } from "./email-smtp-panel";
import { BotConfigPanel } from "./bot-config-panel";
import { ChannelsPanel } from "./channels-panel";
import { WidgetPreview } from "./widget-preview";

export function AdminPanels({ project }: { project?: { id: string; name: string; key: string } }) {
  const projectId = project?.id;

  return (
    <>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid items-start gap-4 xl:grid-cols-2"
      >
        <div className="flex flex-col gap-4">
          <IntegrationPanel projectId={projectId} />
          
          <WebhookSettingsPanel projectId={projectId} />

          <TicketEmailsPanel projectId={projectId} />

          <Card className="overflow-hidden border-slate-200">
            <PanelHeader icon={<TicketCheck size={18} />} title="Tickets" />
            <div className="space-y-3 p-4">
              <p className="text-sm text-muted">
                View raised tickets and update their workflow status on the tickets page.
              </p>
              <Button asChild className="gap-2 bg-brand text-white hover:bg-brand/90" disabled={!projectId}>
                <Link href={projectId ? `/tickets?projectId=${projectId}` : "/tickets"}>
                  <TicketCheck size={16} /> Open Tickets
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <ProjectAccessPanel projectId={projectId} />
          
          <EmailSmtpPanel projectId={projectId} />

          <BotConfigPanel projectId={projectId} />
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 flex flex-col gap-4"
      >
        <ChannelsPanel projectId={projectId} />
        <WidgetPreview projectId={projectId} projectKey={project?.key} projectName={project?.name} />
      </motion.div>
    </>
  );
}

export function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b bg-white px-4 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-50 text-brand">{icon}</span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}

export function Callout({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
  const color =
    tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return <div className={`rounded-md border p-3 text-sm ${color}`}>{children}</div>;
}
