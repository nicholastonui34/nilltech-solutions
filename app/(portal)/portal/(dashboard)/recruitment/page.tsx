import Link from "next/link";

import { StageBadge } from "@/components/portal/talent/stage-badge";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDate } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  countryLabel,
  preferenceLabel,
  roleLabel,
  STAGE_LABELS,
  TALENT_STAGES,
} from "@/lib/talent/options";
import { cn } from "@/lib/utils";

export default async function RecruitmentPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const user = await getUserWithRole(["recruitment", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const { stage: stageParam } = await searchParams;
  const stage = TALENT_STAGES.find((s) => s === stageParam);

  const [{ data: all }, listResult] = await Promise.all([
    supabase.from("talent_applications").select("stage"),
    (() => {
      let query = supabase
        .from("talent_applications")
        .select(
          "id, created_at, full_name, country, primary_role, years_experience, engagement_preference, stage",
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (stage) query = query.eq("stage", stage);
      return query;
    })(),
  ]);
  const applications = listResult.data ?? [];
  const counts = new Map<string, number>();
  for (const row of all ?? []) counts.set(row.stage, (counts.get(row.stage) ?? 0) + 1);

  const chip = (href: string, active: boolean, label: string) => (
    <Link
      key={href}
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:border-primary",
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Recruitment"
        description="Applications from /careers/apply. Screen, send test tasks manually, then approve into the talent pool."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {chip("/portal/recruitment", !stage, `All (${all?.length ?? 0})`)}
        {TALENT_STAGES.map((s) =>
          chip(
            `/portal/recruitment?stage=${s}`,
            stage === s,
            `${STAGE_LABELS[s]} (${counts.get(s) ?? 0})`,
          ),
        )}
      </div>
      <Panel>
        {applications.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Applied</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Country</th>
                  <th className="py-2 pr-4 font-medium">Experience</th>
                  <th className="py-2 pr-4 font-medium">Prefers</th>
                  <th className="py-2 font-medium">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/portal/recruitment/${app.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {app.full_name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{roleLabel(app.primary_role)}</td>
                    <td className="py-3 pr-4">{countryLabel(app.country)}</td>
                    <td className="py-3 pr-4 tabular-nums">{app.years_experience} yrs</td>
                    <td className="py-3 pr-4">
                      {preferenceLabel(app.engagement_preference)}
                    </td>
                    <td className="py-3">
                      <StageBadge stage={app.stage} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No applications here yet.</p>
        )}
      </Panel>
    </>
  );
}
