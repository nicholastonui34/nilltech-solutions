import { PageHeader } from "@/components/portal/page-header";
import {
  BarList,
  NoAccess,
  NotConnected,
  Panel,
  StatCard,
} from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { LEAD_TIERS, sourceLabel, TIER_LABELS } from "@/lib/leads/labels";
import { countBy, getLeadStatRows } from "@/lib/leads/stats";

function percent(part: number, whole: number) {
  return whole ? `${Math.round((part / whole) * 100)}%` : "n/a";
}

export default async function AnalyticsPage() {
  const user = await getUserWithRole(["director", "marketing", "super_admin"]);
  if (!user) return <NoAccess />;

  const rows = await getLeadStatRows();
  const total = rows.length;
  const reached = rows.filter(
    (r) => r.status === "contacted" || r.status === "qualified",
  ).length;
  const qualified = rows.filter((r) => r.status === "qualified").length;
  const disqualified = rows.filter((r) => r.status === "disqualified").length;

  const bySource = countBy(rows, (r) => r.source).map(([source, count]) => {
    const q = rows.filter((r) => r.source === source && r.status === "qualified").length;
    return { source, count, qualified: q };
  });

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Lead funnel from the database. Site-side events and Core Web Vitals aren't connected yet."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Leads" value={total} />
        <StatCard
          label="Contacted or qualified"
          value={reached}
          hint={percent(reached, total)}
        />
        <StatCard label="Qualified" value={qualified} hint={percent(qualified, total)} />
        <StatCard
          label="Disqualified"
          value={disqualified}
          hint={percent(disqualified, total)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Funnel" description="Leads → reached → qualified.">
          <BarList
            rows={[
              { label: "Leads", value: total },
              { label: "Contacted or qualified", value: reached },
              { label: "Qualified", value: qualified },
            ]}
          />
        </Panel>
        <Panel title="Lead tiers" description="From rules-based scoring (CLAUDE.md §9).">
          <BarList
            rows={LEAD_TIERS.map((tier) => ({
              label: TIER_LABELS[tier],
              value: rows.filter((r) => r.tier === tier).length,
            }))}
          />
        </Panel>
        <Panel title="Qualification rate by form" className="lg:col-span-2">
          {bySource.length ? (
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Form</th>
                  <th className="py-2 pr-4 font-medium">Leads</th>
                  <th className="py-2 pr-4 font-medium">Qualified</th>
                  <th className="py-2 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y tabular-nums">
                {bySource.map((row) => (
                  <tr key={row.source}>
                    <td className="py-2 pr-4">{sourceLabel(row.source)}</td>
                    <td className="py-2 pr-4">{row.count}</td>
                    <td className="py-2 pr-4">{row.qualified}</td>
                    <td className="py-2">{percent(row.qualified, row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground text-sm">No leads yet.</p>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <NotConnected
          title="Conversion events"
          reason="CTA clicks, form starts, WhatsApp and call clicks fire through lib/analytics.ts, but it has no destination yet, so events aren't stored anywhere."
        />
        <NotConnected
          title="Core Web Vitals (field data)"
          reason={
            process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN
              ? "Cloudflare Web Analytics is collecting real-visitor Core Web Vitals (LCP, INP, CLS). View them in the Cloudflare dashboard under Analytics & Logs > Web Analytics > Core Web Vitals."
              : "Cloudflare Web Analytics (free) is built in but switched off: add the site token as NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN in Vercel to collect real-visitor Core Web Vitals."
          }
        />
      </div>
    </>
  );
}
