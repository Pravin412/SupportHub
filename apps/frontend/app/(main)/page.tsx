"use client";
import { Overview } from "../../components/overview";
import { useUiStore } from "../../lib/store";
import { useConversations, useProjects } from "../../lib/queries";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const ui = useUiStore();
  const projects = useProjects(true);
  const selectedProject = projects.data?.find((p) => p.id === ui.selectedProjectId) ?? projects.data?.[0];
  const projectId = selectedProject?.id;
  const conversations = useConversations(projectId, "");
  const router = useRouter();

  return (
    <Overview
      conversationsCount={conversations.data?.length ?? 0}
      agentsCount={projects.data?.length ?? 0}
      onInbox={() => router.push("/inbox")}
    />
  );
}
