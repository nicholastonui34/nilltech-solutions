import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { StageBadge } from "@/components/portal/talent/stage-badge";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS } from "@/lib/talent/labels";
import { countryLabel, ENGAGEMENT_TYPE_LABELS, roleLabel } from "@/lib/talent/options";
import { VERIFICATION_LABELS, type VerificationStatus } from "@/lib/verification";

/** Freelancer portal (CLAUDE.md §10): profile, verification, tax info, assignments. RLS scopes it to their own rows. */
export default async function TalentProfilePage() {
  const user = await getUserWithRole(["freelancer"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const [{ data: profile }, { data: assignments }] = await Promise.all([
    supabase
      .from("talent_applications")
      .select(
        "id, full_name, email, country, primary_role, skills, stage, engagement_type, verification_status, tax_pin_recorded_at",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("project_assignments")
      .select("project_id, role_on_project, assigned_at, projects(name, status)")
      .order("assigned_at", { ascending: false }),
  ]);

  if (!profile) {
    return (
      <>
        <PageHeader title="Your profile" />
        <Panel>
          <p className="text-muted-foreground text-sm">
            Your account isn&rsquo;t linked to an application yet. Contact the NillTech
            recruitment team.
          </p>
        </Panel>
      </>
    );
  }

  const verification =
    VERIFICATION_LABELS[profile.verification_status as VerificationStatus] ??
    profile.verification_status;

  return (
    <>
      <PageHeader
        title="Your profile"
        description={`${roleLabel(profile.primary_role)} · ${countryLabel(profile.country)}`}
        actions={<StageBadge stage={profile.stage} />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Engagement">
          <p className="text-sm">
            {profile.engagement_type
              ? ENGAGEMENT_TYPE_LABELS[profile.engagement_type]
              : "—"}
          </p>
          {profile.skills.length ? (
            <p className="text-muted-foreground mt-2 text-xs">
              {profile.skills.join(", ")}
            </p>
          ) : null}
        </Panel>
        <Panel title="ID verification">
          <p className="text-sm">{verification}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            We&rsquo;ll ask you to verify your ID here once it&rsquo;s available. Nothing
            is needed from you yet.
          </p>
        </Panel>
        <Panel title="Tax">
          <p className="text-sm">
            {profile.engagement_type === "full_time" && profile.country === "KE"
              ? profile.tax_pin_recorded_at
                ? `KRA PIN on file (stored encrypted), ${formatDateTime(profile.tax_pin_recorded_at)}.`
                : "Our team will ask for your KRA PIN as part of your full-time onboarding."
              : "As a freelancer, you handle your own tax filing and payments."}
          </p>
        </Panel>
      </div>

      <Panel title="Assignments" className="mt-6">
        {assignments?.length ? (
          <ul className="divide-border divide-y">
            {assignments.map((a) => (
              <li
                key={a.project_id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{a.projects?.name ?? "Project"}</p>
                  <p className="text-muted-foreground text-xs">
                    {a.role_on_project ?? "Team member"} · since{" "}
                    {formatDateTime(a.assigned_at)}
                  </p>
                </div>
                {a.projects ? (
                  <span className="text-muted-foreground text-xs">
                    {PROJECT_STATUS_LABELS[a.projects.status]}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No assignments yet.</p>
        )}
      </Panel>
    </>
  );
}
