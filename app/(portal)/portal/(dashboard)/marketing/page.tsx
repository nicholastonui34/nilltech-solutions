import { PageHeader } from "@/components/portal/page-header";
import {
  BarList,
  NoAccess,
  NotConnected,
  Panel,
  StatCard,
} from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { daysAgoIso, formatDate } from "@/lib/format";
import { serviceLabel, sourceLabel } from "@/lib/leads/labels";
import { countBy, getLeadStatRows, weeklyCounts } from "@/lib/leads/stats";

export default async function MarketingPage() {
  const user = await getUserWithRole(["marketing", "super_admin"]);
  if (!user) return <NoAccess />;

  const rows = await getLeadStatRows();
  const since30 = daysAgoIso(30);
  const last30 = rows.filter((r) => r.created_at >= since30);

  return (
    <>
      <PageHeader
        title="Marketing"
        description="What the site's forms are producing, and where those leads came from."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Leads, last 30 days" value={last30.length} />
        <StatCard label="Leads, all time" value={rows.length} />
        <StatCard
          label="Most requested, last 30 days"
          value={
            last30.length
              ? serviceLabel(
                  countBy(last30, (r) => r.service_interest ?? "unknown")[0][0],
                )
              : "n/a"
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Leads by form" description="All time.">
          <BarList
            rows={countBy(rows, (r) => sourceLabel(r.source)).map(([label, value]) => ({
              label,
              value,
            }))}
          />
        </Panel>
        <Panel
          title="Leads by service interest"
          description="All time. “n/a” means the form didn't ask."
        >
          <BarList
            rows={countBy(rows, (r) => serviceLabel(r.service_interest)).map(
              ([label, value]) => ({ label, value }),
            )}
          />
        </Panel>
        <Panel
          title="Leads by source"
          description="Last 30 days. Campaign tags (utm_source / utm_medium) first, then the referring site. “Not recorded” means the lead came in before source tracking started."
        >
          <BarList
            rows={countBy(last30, (r) => r.channel).map(([label, value]) => ({
              label,
              value,
            }))}
          />
        </Panel>
        <Panel
          title="Leads by campaign"
          description="Last 30 days, leads that arrived through a link tagged with utm_campaign."
        >
          <BarList
            rows={countBy(
              last30.filter((r) => r.campaign),
              (r) => r.campaign ?? "",
            ).map(([label, value]) => ({ label, value }))}
          />
        </Panel>
        <Panel title="Leads per week" description="Last 8 weeks, week starting Monday.">
          <BarList
            rows={weeklyCounts(rows, 8).map((b) => ({
              label: `Week of ${formatDate(b.start.toISOString())}`,
              value: b.value,
            }))}
          />
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <NotConnected
          title="Website traffic & page speed"
          reason={
            process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN
              ? "Cloudflare Web Analytics is collecting visits, referrers and real-visitor page speed. View them in the Cloudflare dashboard under Analytics & Logs > Web Analytics."
              : "Cloudflare Web Analytics (free, cookieless) is built in but switched off: add the site token as NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN in Vercel to start collecting visits and page speed."
          }
        />
        <NotConnected
          title="Newsletter"
          reason="Blocked on the Resend account (CLAUDE.md §8, deferred by owner decision)."
        />
        <NotConnected
          title="Podcast performance"
          reason="No YouTube channel or episodes yet (CLAUDE.md §18)."
        />
      </div>
    </>
  );
}
