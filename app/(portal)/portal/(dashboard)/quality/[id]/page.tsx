import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";

import {
  addChecklistItem,
  toggleChecklistItem,
  unassignTalent,
  setProjectDueDate,
  updateProjectStatus,
} from "@/app/actions/quality";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import {
  AssignTalentForm,
  DeliveryReviewForm,
} from "@/components/portal/talent/quality-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/talent/labels";
import { roleLabel } from "@/lib/talent/options";
import { cn } from "@/lib/utils";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserWithRole(["quality", "super_admin"]);
  if (!user) return <NoAccess />;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const [{ data: project }, { data: pool }] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, description, status, due_on, created_at, delivered_at, clients(name, company), qa_checklist_items(id, position, label, done, done_at), project_assignments(talent_id, role_on_project, talent_applications(id, full_name, primary_role)), delivery_reviews(talent_id, rating, notes)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("talent_applications")
      .select("id, full_name, primary_role")
      .eq("stage", "approved")
      .order("full_name"),
  ]);
  if (!project) notFound();

  const checklist = [...project.qa_checklist_items].sort(
    (a, b) => a.position - b.position,
  );
  const assignedIds = new Set(project.project_assignments.map((a) => a.talent_id));
  const assignable = (pool ?? [])
    .filter((t) => !assignedIds.has(t.id))
    .map((t) => ({ id: t.id, label: `${t.full_name} · ${roleLabel(t.primary_role)}` }));
  const reviewFor = (talentId: string) =>
    project.delivery_reviews.find((r) => r.talent_id === talentId) ?? null;
  const allDone = checklist.length > 0 && checklist.every((item) => item.done);

  return (
    <>
      <Link
        href="/portal/quality"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All projects
      </Link>
      <PageHeader
        title={project.name}
        description={`${project.clients?.company ?? project.clients?.name ?? "No client"} · started ${formatDateTime(project.created_at)}${project.delivered_at ? ` · delivered ${formatDateTime(project.delivered_at)}` : ""}`}
        actions={
          <form action={updateProjectStatus} className="flex items-center gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <label htmlFor="project-status" className="sr-only">
              Project status
            </label>
            <NativeSelect
              id="project-status"
              name="status"
              defaultValue={project.status}
              className="h-8 w-auto"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </option>
              ))}
            </NativeSelect>
            <Button type="submit" size="sm" variant="outline">
              Update
            </Button>
          </form>
        }
      />

      <form action={setProjectDueDate} className="mb-6 flex flex-wrap items-end gap-2">
        <input type="hidden" name="projectId" value={project.id} />
        <div>
          <label htmlFor="project-due" className="text-sm font-medium">
            Due date
          </label>
          <Input
            id="project-due"
            name="dueOn"
            type="date"
            defaultValue={project.due_on ?? ""}
            className="mt-1.5 h-8 w-auto"
          />
        </div>
        <Button type="submit" size="sm" variant="outline">
          Save due date
        </Button>
        <span className="text-muted-foreground text-xs">
          Assigned freelancers see it in their portal.
        </span>
      </form>

      {project.description ? (
        <p className="text-muted-foreground mb-6 text-sm whitespace-pre-wrap">
          {project.description}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="QA checklist"
          description={
            allDone
              ? "Every check is done, ready to mark as delivered."
              : "Tick each check as it's completed."
          }
        >
          <ul className="flex flex-col gap-2">
            {checklist.map((item) => (
              <li key={item.id}>
                <form action={toggleChecklistItem} className="flex items-center gap-3">
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="done" value={item.done ? "false" : "true"} />
                  <button
                    type="submit"
                    aria-label={
                      item.done
                        ? `Mark "${item.label}" as not done`
                        : `Mark "${item.label}" as done`
                    }
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded border",
                      item.done
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-border",
                    )}
                  >
                    {item.done ? <Check className="size-4" /> : null}
                  </button>
                  <span
                    className={cn(
                      "text-sm",
                      item.done && "text-muted-foreground line-through",
                    )}
                  >
                    {item.label}
                  </span>
                  {item.done_at ? (
                    <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap">
                      {formatDateTime(item.done_at)}
                    </span>
                  ) : null}
                </form>
              </li>
            ))}
          </ul>
          <form action={addChecklistItem} className="mt-4 flex gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <label htmlFor="new-check" className="sr-only">
              New checklist item
            </label>
            <Input
              id="new-check"
              name="label"
              placeholder="Add a check"
              required
              maxLength={200}
            />
            <Button type="submit" variant="outline">
              Add
            </Button>
          </form>
        </Panel>

        <Panel title="Team & delivery reviews">
          {project.project_assignments.length ? (
            <ul className="divide-border flex flex-col divide-y">
              {project.project_assignments.map((assignment) => {
                const person = assignment.talent_applications;
                if (!person) return null;
                return (
                  <li key={assignment.talent_id} className="py-4 first:pt-0">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{person.full_name}</p>
                        <p className="text-muted-foreground text-xs">
                          {assignment.role_on_project ?? roleLabel(person.primary_role)}
                        </p>
                      </div>
                      <form action={unassignTalent}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <input
                          type="hidden"
                          name="talentId"
                          value={assignment.talent_id}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${person.full_name} from this project`}
                        >
                          <X />
                        </Button>
                      </form>
                    </div>
                    <DeliveryReviewForm
                      projectId={project.id}
                      talentId={assignment.talent_id}
                      existing={reviewFor(assignment.talent_id)}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground mb-4 text-sm">Nobody assigned yet.</p>
          )}
          <div className="border-border mt-4 border-t pt-4">
            <AssignTalentForm projectId={project.id} talent={assignable} />
          </div>
        </Panel>
      </div>
    </>
  );
}
