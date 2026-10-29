import Link from "next/link";

import { LeadStatusForm } from "@/components/portal/lead-status-form";
import { StatusBadge, TierBadge } from "@/components/portal/lead-badges";
import { PageHeader } from "@/components/portal/page-header";
import { SalesTabs } from "@/components/portal/sales/sales-tabs";
import { NoAccess, Panel, StatCard } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDate } from "@/lib/format";
import {
  LEAD_STATUSES,
  LEAD_TIERS,
  serviceLabel,
  sourceLabel,
  STATUS_LABELS,
  TIER_LABELS,
  timelineLabel,
  type LeadStatus,
  type LeadTier,
} from "@/lib/leads/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 200;

type SearchParams = Promise<{ tier?: string; status?: string }>;

function filterHref(current: { tier?: LeadTier; status?: LeadStatus }, change: object) {
  const next = { ...current, ...change } as Record<string, string | undefined>;
  const params = new URLSearchParams(
    Object.entries(next).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  const query = params.toString();
  return query ? `/portal/sales?${query}` : "/portal/sales";
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:border-primary",
      )}
    >
      {children}
    </Link>
  );
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getUserWithRole(["sales", "super_admin"]);
  if (!user) return <NoAccess />;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const params = await searchParams;
  const tier = LEAD_TIERS.find((t) => t === params.tier);
  const status = LEAD_STATUSES.find((s) => s === params.status);
  const current = { tier, status };

  let query = supabase
    .from("leads")
    .select(
      "id, created_at, name, company, source, service_interest, timeline_urgency, score, tier, status",
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_LIMIT);
  if (tier) query = query.eq("tier", tier);
  if (status) query = query.eq("status", status);

  const [{ data: leads }, { data: allLeads }] = await Promise.all([
    query,
    supabase.from("leads").select("tier, status"),
  ]);

  const count = (pred: (row: { tier: LeadTier; status: LeadStatus }) => boolean) =>
    (allLeads ?? []).filter(pred).length;

  return (
    <>
      <PageHeader
        title="Sales"
        description="Every lead from the site's forms, newest first."
      />
      <SalesTabs current="/portal/sales" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="New"
          value={count((l) => l.status === "new")}
          hint="Not yet contacted"
        />
        <StatCard
          label="Hot"
          value={count((l) => l.tier === "hot" && l.status !== "disqualified")}
        />
        <StatCard
          label="Warm"
          value={count((l) => l.tier === "warm" && l.status !== "disqualified")}
        />
        <StatCard label="Qualified" value={count((l) => l.status === "qualified")} />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-14 text-sm">Tier</span>
          <FilterChip href={filterHref(current, { tier: undefined })} active={!tier}>
            All
          </FilterChip>
          {LEAD_TIERS.map((t) => (
            <FilterChip
              key={t}
              href={filterHref(current, { tier: t })}
              active={tier === t}
            >
              {TIER_LABELS[t]}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-14 text-sm">Status</span>
          <FilterChip href={filterHref(current, { status: undefined })} active={!status}>
            All
          </FilterChip>
          {LEAD_STATUSES.map((s) => (
            <FilterChip
              key={s}
              href={filterHref(current, { status: s })}
              active={status === s}
            >
              {STATUS_LABELS[s]}
            </FilterChip>
          ))}
        </div>
      </div>

      <Panel className="mt-6">
        {leads?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground text-xs">
                <tr>
                  <th className="py-2 pr-4 font-medium">Received</th>
                  <th className="py-2 pr-4 font-medium">Lead</th>
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 pr-4 font-medium">Interested in</th>
                  <th className="py-2 pr-4 font-medium">Timeline</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {leads.map((lead) => (
                  <tr key={lead.id} className="align-top">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/portal/sales/${lead.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {lead.name}
                      </Link>
                      {lead.company ? (
                        <p className="text-muted-foreground text-xs">{lead.company}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">{sourceLabel(lead.source)}</td>
                    <td className="py-3 pr-4">{serviceLabel(lead.service_interest)}</td>
                    <td className="py-3 pr-4">{timelineLabel(lead.timeline_urgency)}</td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2 tabular-nums">
                        {lead.score} <TierBadge tier={lead.tier} />
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col items-start gap-2">
                        <StatusBadge status={lead.status} />
                        <LeadStatusForm leadId={lead.id} status={lead.status} compact />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === PAGE_LIMIT ? (
              <p className="text-muted-foreground mt-4 text-xs">
                Showing the latest {PAGE_LIMIT}. Use the filters to narrow it down.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No leads match these filters.</p>
        )}
      </Panel>
    </>
  );
}
