import { Check, Circle } from "lucide-react";

import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { NoTalentProfile } from "@/components/portal/talent/no-profile";
import { TalentTabs } from "@/components/portal/talent/talent-tabs";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime, nairobiDateIso } from "@/lib/format";
import { PROJECT_STATUS_LABELS } from "@/lib/talent/labels";
import { getOwnTalentProfile } from "@/lib/talent/own-profile";

/** Assigned projects with due date, QA checklist progress and the freelancer's own reviews. */
export default async function TalentProjectsPage() {
  const user = await getUserWithRole(["freelancer"]);
  if (!user) return <NoAccess />;
  const { supabase, profile } = await getOwnTalentProfile(user.id);
  if (!supabase || !profile) return <NoTalentProfile />;

  const [{ data: assignments }, { data: reviews }] = await Promise.all([
    supabase
      .from("project_assignments")
      .select(
        "project_id, role_on_project, assigned_at, projects(name, description, status, due_on, qa_checklist_items(id, position, label, done))",
      )
      .eq("talent_id", profile.id)
      .order("assigned_at", { ascending: false }),
    supabase
      .from("delivery_reviews")
      .select("project_id, rating, notes, created_at")
      .eq("talent_id", profile.id),
  ]);
  const today = nairobiDateIso();

  return (
    <>
      <PageHeader title="Projects" description="Projects you're assigned to." />
      <TalentTabs current="/portal/talent/projects" stage={profile.stage} />

      {assignments?.length ? (
        <div className="flex flex-col gap-6">
          {assignments.map((a) => {
            const project = a.projects;
            const checklist = [...(project?.qa_checklist_items ?? [])].sort(
              (x, y) => x.position - y.position,
            );
            const review = reviews?.find((r) => r.project_id === a.project_id);
            const overdue =
              project?.due_on && project.status !== "delivered" && project.due_on < today;
            return (
              <Panel
                key={a.project_id}
                title={project?.name ?? "Project"}
                description={[
                  a.role_on_project ?? "Team member",
                  project ? PROJECT_STATUS_LABELS[project.status] : null,
                  project?.due_on
                    ? `due ${project.due_on}${overdue ? " (past due)" : ""}`
                    : null,
                  `assigned ${formatDateTime(a.assigned_at)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              >
                {project?.description ? (
                  <p className="text-sm whitespace-pre-wrap">{project.description}</p>
                ) : null}
                {checklist.length ? (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium">QA checklist</h3>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {checklist.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm">
                          {item.done ? (
                            <Check className="size-4 text-emerald-700" aria-hidden />
                          ) : (
                            <Circle
                              className="text-muted-foreground size-4"
                              aria-hidden
                            />
                          )}
                          <span
                            className={item.done ? undefined : "text-muted-foreground"}
                          >
                            {item.label}
                          </span>
                          <span className="sr-only">
                            {item.done ? "(done)" : "(to do)"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {review ? (
                  <div className="bg-muted/50 mt-4 rounded-lg p-3 text-sm">
                    <p className="font-medium">
                      Delivery review: {review.rating} out of 5
                    </p>
                    {review.notes ? (
                      <p className="mt-1 whitespace-pre-wrap">{review.notes}</p>
                    ) : null}
                  </div>
                ) : null}
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel>
          <p className="text-muted-foreground text-sm">No assignments yet.</p>
        </Panel>
      )}
    </>
  );
}
