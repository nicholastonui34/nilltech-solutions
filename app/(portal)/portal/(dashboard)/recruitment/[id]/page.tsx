import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileDown } from "lucide-react";

import {
  deleteTalentDocument,
  deleteTestTask,
  markTestTaskReviewed,
} from "@/app/actions/recruitment";

import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import {
  ApplicationStageForm,
  CreateTestTaskForm,
  FreelancerAccountForm,
  GenerateDocumentForm,
  RevealTaxPinForm,
  TaxPinForm,
  UploadDocumentForm,
} from "@/components/portal/talent/recruitment-forms";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/portal/talent/stage-badge";
import { canAccess } from "@/config/portal";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatBytes, formatDateTime, nairobiDateIso } from "@/lib/format";
import { TALENT_AGREEMENTS_REVIEWED } from "@/config/talent-agreements";
import { SIGNATORIES } from "@/config/signatories";
import { documentKindLabel } from "@/lib/talent/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  countryLabel,
  ENGAGEMENT_TYPE_LABELS,
  preferenceLabel,
  roleLabel,
} from "@/lib/talent/options";
import { VERIFICATION_LABELS, type VerificationStatus } from "@/lib/verification";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ExternalUrl({ url }: { url: string | null }) {
  if (!url) return <>n/a</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-primary inline-flex items-center gap-1 break-all hover:underline"
    >
      {url.replace(/^https?:\/\//, "")} <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserWithRole(["recruitment", "super_admin"]);
  if (!user) return <NoAccess />;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const { data: app } = await supabase
    .from("talent_applications")
    .select(
      "id, created_at, full_name, email, phone, country, primary_role, skills, years_experience, engagement_preference, portfolio_url, profile_url, availability, message, consent_at, stage, stage_changed_at, engagement_type, verification_status, tax_pin_recorded_at, user_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (!app) notFound();

  // Internal notes aren't selectable by app roles (applicants could read their
  // own row); recruitment reads them through this function.
  const [{ data: notesRows }, { data: tasks }, { data: documents }] = await Promise.all([
    supabase.rpc("get_talent_internal_notes", { _application_id: app.id }),
    supabase
      .from("talent_test_tasks")
      .select(
        "id, title, brief, due_on, created_at, submission_url, submission_note, submitted_at, reviewed_at",
      )
      .eq("application_id", app.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("talent_documents")
      .select(
        "id, kind, title, size_bytes, requires_acceptance, uploaded_at, accepted_at, accepted_name",
      )
      .eq("talent_id", app.id)
      .order("uploaded_at", { ascending: false }),
  ]);
  const notes = notesRows?.[0];
  const generateKinds = [
    ...(["test_task", "test_review", "approved"].includes(app.stage)
      ? (["nda"] as const)
      : []),
    ...(app.stage === "approved" && app.engagement_type === "freelance"
      ? (["contract", "onboarding_letter"] as const)
      : []),
  ];
  const canHaveLogin = ["test_task", "test_review", "approved"].includes(app.stage);

  const needsKraPin =
    app.stage === "approved" &&
    app.engagement_type === "full_time" &&
    app.country === "KE";
  const verification =
    VERIFICATION_LABELS[app.verification_status as VerificationStatus] ??
    app.verification_status;

  const details: [string, React.ReactNode][] = [
    [
      "Email",
      <a key="e" href={`mailto:${app.email}`} className="text-primary hover:underline">
        {app.email}
      </a>,
    ],
    ["Phone", app.phone ?? "n/a"],
    ["Country", countryLabel(app.country)],
    ["Main role", roleLabel(app.primary_role)],
    ["Experience", `${app.years_experience} years`],
    ["Prefers", preferenceLabel(app.engagement_preference)],
    ["Skills", app.skills.length ? app.skills.join(", ") : "n/a"],
    ["Availability", app.availability ?? "n/a"],
    ["Portfolio", <ExternalUrl key="p" url={app.portfolio_url} />],
    ["LinkedIn / GitHub", <ExternalUrl key="l" url={app.profile_url} />],
    ["Applied", formatDateTime(app.created_at)],
    ["Privacy consent", formatDateTime(app.consent_at)],
  ];

  return (
    <>
      <Link
        href="/portal/recruitment"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All applications
      </Link>
      <PageHeader
        title={app.full_name}
        description={`${roleLabel(app.primary_role)} · ${countryLabel(app.country)} · stage since ${formatDateTime(app.stage_changed_at)}`}
        actions={<StageBadge stage={app.stage} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Panel title="Application">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {details.map(([term, value]) => (
                <div key={term}>
                  <dt className="text-muted-foreground text-xs">{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {app.message ? (
              <div className="mt-4">
                <p className="text-muted-foreground text-xs">Message</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{app.message}</p>
              </div>
            ) : null}
          </Panel>

          <Panel
            title="Test tasks"
            description={
              app.user_id
                ? "The applicant sees the brief in their portal and submits a link there."
                : "Give them portal access (right) so they can see the brief and submit in the portal."
            }
          >
            {tasks?.length ? (
              <ul className="divide-border mb-6 divide-y">
                {tasks.map((task) => (
                  <li key={task.id} className="py-3 text-sm">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-muted-foreground text-xs">
                      Set {formatDateTime(task.created_at)}
                      {task.due_on ? ` · due ${task.due_on}` : ""}
                      {task.reviewed_at
                        ? ` · reviewed ${formatDateTime(task.reviewed_at)}`
                        : ""}
                    </p>
                    <details className="mt-1">
                      <summary className="text-muted-foreground cursor-pointer text-xs">
                        Brief
                      </summary>
                      <p className="mt-1 whitespace-pre-wrap">{task.brief}</p>
                    </details>
                    {task.submitted_at ? (
                      <div className="bg-muted/50 mt-2 rounded-lg p-3">
                        <p>
                          Submitted {formatDateTime(task.submitted_at)}:{" "}
                          <ExternalUrl url={task.submission_url} />
                        </p>
                        {task.submission_note ? (
                          <p className="mt-1 whitespace-pre-wrap">
                            {task.submission_note}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Not submitted yet.
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {task.submitted_at && !task.reviewed_at ? (
                        <form action={markTestTaskReviewed}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Mark reviewed
                          </Button>
                        </form>
                      ) : null}
                      {!task.submitted_at ? (
                        <form action={deleteTestTask}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                          >
                            Delete task
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {app.stage === "rejected" ? (
              <p className="text-muted-foreground text-sm">
                Not progressed, so no new test tasks.
              </p>
            ) : (
              <CreateTestTaskForm id={app.id} minDate={nairobiDateIso()} />
            )}
          </Panel>

          <Panel
            title="Documents"
            description="Generate an NDA, agreement or onboarding letter, or upload your own PDF. The freelancer downloads it in their portal and, if required, accepts it by typing their name."
          >
            {documents?.length ? (
              <ul className="divide-border mb-6 divide-y">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {documentKindLabel(doc.kind)} · {formatBytes(doc.size_bytes)} ·{" "}
                        {doc.accepted_at
                          ? `accepted by ${doc.accepted_name}, ${formatDateTime(doc.accepted_at)}`
                          : doc.requires_acceptance
                            ? "waiting for acceptance"
                            : "for information"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/portal/documents/talent/${doc.id}`}
                        target="_blank"
                        rel="noopener"
                        className="text-primary inline-flex items-center gap-1 hover:underline"
                      >
                        <FileDown className="size-4" /> PDF
                      </a>
                      {!doc.accepted_at ? (
                        <form action={deleteTalentDocument}>
                          <input type="hidden" name="documentId" value={doc.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                          >
                            Remove
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {generateKinds.length ? (
              <details className="border-border mb-6 rounded-lg border p-4" open>
                <summary className="cursor-pointer text-sm font-medium">
                  Generate a document
                </summary>
                <div className="mt-4">
                  <GenerateDocumentForm
                    id={app.id}
                    kinds={generateKinds}
                    signatories={[...SIGNATORIES]}
                    defaults={{
                      role: roleLabel(app.primary_role),
                      today: nairobiDateIso(),
                      contactName: user.fullName ?? "",
                      contactEmail: user.email ?? "",
                    }}
                    reviewed={TALENT_AGREEMENTS_REVIEWED}
                  />
                </div>
              </details>
            ) : (
              <p className="text-muted-foreground mb-4 text-xs">
                {app.engagement_type === "full_time"
                  ? "Generated agreements are for freelancers. For a full-time hire, upload an employment contract reviewed by your advocate."
                  : "An NDA can be generated from the test-task stage; the agreement and onboarding letter once they're approved as a freelancer."}
              </p>
            )}
            <details className="mb-2">
              <summary className="cursor-pointer text-sm font-medium">
                Upload your own PDF
              </summary>
              <div className="mt-4">
                <UploadDocumentForm id={app.id} />
              </div>
            </details>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Screening">
            <ApplicationStageForm
              application={{
                id: app.id,
                stage: app.stage,
                engagementType: app.engagement_type,
                screeningNotes: notes?.screening_notes ?? null,
                testTaskNotes: notes?.test_task_notes ?? null,
                rejectionReason: notes?.rejection_reason ?? null,
              }}
            />
          </Panel>

          <Panel title="ID verification">
            <p className="text-sm">{verification}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              No verification provider is connected yet. It doesn&rsquo;t block approval.
            </p>
          </Panel>

          <Panel title="Tax information">
            {needsKraPin ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm">
                  {app.tax_pin_recorded_at
                    ? `KRA PIN on file (encrypted), saved ${formatDateTime(app.tax_pin_recorded_at)}.`
                    : "Full-time hire in Kenya, so a KRA PIN is required."}
                </p>
                <TaxPinForm id={app.id} hasPin={Boolean(app.tax_pin_recorded_at)} />
                {app.tax_pin_recorded_at &&
                canAccess(user.roles, ["finance", "super_admin"]) ? (
                  <RevealTaxPinForm id={app.id} />
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {app.engagement_type === "freelance"
                  ? "Freelancers handle their own tax filing, so there's nothing to collect."
                  : app.engagement_type === "full_time"
                    ? "A KRA PIN is collected for full-time hires in Kenya only."
                    : "Decided once the applicant is approved as freelance or full-time."}
              </p>
            )}
          </Panel>

          {canHaveLogin ? (
            <Panel title="Portal access">
              {app.user_id ? (
                <p className="text-sm">
                  Has a portal login
                  {app.engagement_type
                    ? ` (${ENGAGEMENT_TYPE_LABELS[app.engagement_type]})`
                    : ""}
                  .
                </p>
              ) : (
                <FreelancerAccountForm id={app.id} />
              )}
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
