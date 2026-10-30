import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { SubmitTestTaskForm } from "@/components/portal/talent/freelancer-forms";
import { NoTalentProfile } from "@/components/portal/talent/no-profile";
import { TalentTabs } from "@/components/portal/talent/talent-tabs";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime, nairobiDateIso } from "@/lib/format";
import { getOwnTalentProfile } from "@/lib/talent/own-profile";

export default async function TalentTasksPage() {
  const user = await getUserWithRole(["freelancer"]);
  if (!user) return <NoAccess />;
  const { supabase, profile } = await getOwnTalentProfile(user.id);
  if (!supabase || !profile) return <NoTalentProfile />;

  const { data: tasks } = await supabase
    .from("talent_test_tasks")
    .select(
      "id, title, brief, due_on, created_at, submission_url, submission_note, submitted_at, reviewed_at",
    )
    .eq("application_id", profile.id)
    .order("created_at", { ascending: false });
  const today = nairobiDateIso();

  return (
    <>
      <PageHeader
        title="Test tasks"
        description="Read the brief, do the task, then share a link to your work here."
      />
      <TalentTabs current="/portal/talent/tasks" stage={profile.stage} />

      {tasks?.length ? (
        <div className="flex flex-col gap-6">
          {tasks.map((task) => (
            <Panel
              key={task.id}
              title={task.title}
              description={
                task.due_on
                  ? `Due ${task.due_on}${!task.submitted_at && task.due_on < today ? " (past due)" : ""}`
                  : "No due date"
              }
            >
              <p className="text-sm whitespace-pre-wrap">{task.brief}</p>
              <div className="border-border mt-4 border-t pt-4">
                {task.reviewed_at ? (
                  <p className="text-sm">
                    Submitted {formatDateTime(task.submitted_at)} and reviewed. The
                    recruitment team will be in touch about next steps.
                  </p>
                ) : (
                  <>
                    {task.submitted_at ? (
                      <p className="text-muted-foreground mb-3 text-sm">
                        Submitted {formatDateTime(task.submitted_at)}. You can update it
                        until it&rsquo;s reviewed.
                      </p>
                    ) : null}
                    <SubmitTestTaskForm
                      taskId={task.id}
                      current={{ url: task.submission_url, note: task.submission_note }}
                    />
                  </>
                )}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel>
          <p className="text-muted-foreground text-sm">
            No test tasks yet. When the recruitment team sets one, it appears here.
          </p>
        </Panel>
      )}
    </>
  );
}
