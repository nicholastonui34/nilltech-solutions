import Link from "next/link";

import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { CreateProjectForm } from "@/components/portal/talent/quality-forms";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDate } from "@/lib/format";
import { getClientOptions } from "@/lib/finance/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS } from "@/lib/talent/labels";
import { roleLabel } from "@/lib/talent/options";

export default async function QualityPage() {
  const user = await getUserWithRole(["quality", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const [
    { data: projects },
    { data: talent },
    { data: assignments },
    { data: reviews },
    clients,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, status, created_at, delivered_at, clients(name, company), qa_checklist_items(done)",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("talent_applications")
      .select("id, full_name, primary_role, engagement_type")
      .eq("stage", "approved")
      .order("full_name"),
    supabase.from("project_assignments").select("talent_id"),
    supabase.from("delivery_reviews").select("talent_id, rating"),
    getClientOptions(),
  ]);

  const performance = (talent ?? []).map((t) => {
    const ratings = (reviews ?? [])
      .filter((r) => r.talent_id === t.id)
      .map((r) => r.rating);
    return {
      ...t,
      projects: (assignments ?? []).filter((a) => a.talent_id === t.id).length,
      reviews: ratings.length,
      average: ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null,
    };
  });

  return (
    <>
      <PageHeader
        title="Quality"
        description="Project QA checklists, delivery reviews and freelancer performance."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel title="Projects">
          {projects?.length ? (
            <ul className="divide-border divide-y">
              {projects.map((project) => {
                const items = project.qa_checklist_items;
                const done = items.filter((i) => i.done).length;
                return (
                  <li
                    key={project.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <Link
                        href={`/portal/quality/${project.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {project.clients?.company ?? project.clients?.name ?? "No client"}{" "}
                        · started {formatDate(project.created_at)}
                        {project.delivered_at
                          ? ` · delivered ${formatDate(project.delivered_at)}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-medium">
                        {PROJECT_STATUS_LABELS[project.status]}
                      </p>
                      <p className="text-muted-foreground tabular-nums">
                        QA {done}/{items.length}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No projects yet.</p>
          )}
        </Panel>

        <Panel title="New project">
          <CreateProjectForm clients={clients} />
        </Panel>
      </div>

      <Panel
        title="Freelancer performance"
        description="Approved talent pool, with delivery-review ratings (1–5)."
        className="mt-6"
      >
        {performance.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 text-right font-medium">Projects</th>
                  <th className="py-2 pr-4 text-right font-medium">Reviews</th>
                  <th className="py-2 text-right font-medium">Average</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y tabular-nums">
                {performance.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4">{p.full_name}</td>
                    <td className="py-2 pr-4">{roleLabel(p.primary_role)}</td>
                    <td className="py-2 pr-4 text-right">{p.projects}</td>
                    <td className="py-2 pr-4 text-right">{p.reviews}</td>
                    <td className="py-2 text-right">
                      {p.average === null ? "—" : p.average.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No approved talent yet. Recruitment approves applicants into the pool.
          </p>
        )}
      </Panel>
    </>
  );
}
