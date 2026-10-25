import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import {
  ApplicationStageForm,
  FreelancerAccountForm,
  RevealTaxPinForm,
  TaxPinForm,
} from "@/components/portal/talent/recruitment-forms";
import { StageBadge } from "@/components/portal/talent/stage-badge";
import { canAccess } from "@/config/portal";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
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
      "id, created_at, full_name, email, phone, country, primary_role, skills, years_experience, engagement_preference, portfolio_url, profile_url, availability, message, consent_at, stage, stage_changed_at, screening_notes, test_task_notes, rejection_reason, engagement_type, verification_status, tax_pin_recorded_at, user_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (!app) notFound();

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
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Screening">
            <ApplicationStageForm
              application={{
                id: app.id,
                stage: app.stage,
                engagementType: app.engagement_type,
                screeningNotes: app.screening_notes,
                testTaskNotes: app.test_task_notes,
                rejectionReason: app.rejection_reason,
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

          {app.stage === "approved" ? (
            <Panel title="Portal access">
              {app.user_id ? (
                <p className="text-sm">
                  Has a portal login (
                  {ENGAGEMENT_TYPE_LABELS[app.engagement_type ?? "freelance"]}).
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
