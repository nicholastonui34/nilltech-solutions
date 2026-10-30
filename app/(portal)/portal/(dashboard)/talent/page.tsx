import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { ProfileEditForm } from "@/components/portal/talent/freelancer-forms";
import { NoTalentProfile } from "@/components/portal/talent/no-profile";
import { StageBadge } from "@/components/portal/talent/stage-badge";
import { TalentTabs } from "@/components/portal/talent/talent-tabs";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { getOwnTalentProfile } from "@/lib/talent/own-profile";
import { countryLabel, ENGAGEMENT_TYPE_LABELS, roleLabel } from "@/lib/talent/options";
import { VERIFICATION_LABELS, type VerificationStatus } from "@/lib/verification";

/** Freelancer portal (CLAUDE.md §10): profile, verification and tax info. RLS scopes it to their own row. */
export default async function TalentProfilePage() {
  const user = await getUserWithRole(["freelancer"]);
  if (!user) return <NoAccess />;
  const { profile } = await getOwnTalentProfile(user.id);
  if (!profile) return <NoTalentProfile />;

  const verification =
    VERIFICATION_LABELS[profile.verification_status as VerificationStatus] ??
    profile.verification_status;

  return (
    <>
      <PageHeader
        title={profile.full_name}
        description={`${roleLabel(profile.primary_role)} · ${countryLabel(profile.country)} · ${profile.email}`}
        actions={<StageBadge stage={profile.stage} />}
      />
      <TalentTabs current="/portal/talent" stage={profile.stage} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Engagement">
          <p className="text-sm">
            {profile.engagement_type
              ? ENGAGEMENT_TYPE_LABELS[profile.engagement_type]
              : "Decided when you're approved."}
          </p>
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

      <Panel
        title="Your details"
        description="Keep these up to date so the team can reach you and match you to projects. To change your name or email, contact the recruitment team."
        className="mt-6"
      >
        <ProfileEditForm
          profile={{
            phone: profile.phone,
            skills: profile.skills,
            portfolioUrl: profile.portfolio_url,
            profileUrl: profile.profile_url,
            availability: profile.availability,
          }}
        />
      </Panel>
    </>
  );
}
