import { ProjectSettingsView } from "../../../../../components/project-settings-view";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectSettingsView key={projectId} projectId={projectId} />;
}
