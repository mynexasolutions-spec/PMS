import ProjectView from "@/components/projects/ProjectView";

export default async function Page({ params, searchParams }) {
  const { id } = await params;
  const { tab } = await searchParams;
  const projectId = Number(id);
  return <ProjectView projectId={Number.isInteger(projectId) ? projectId : -1} initialTab={typeof tab === "string" ? tab : "tasks"} />;
}
