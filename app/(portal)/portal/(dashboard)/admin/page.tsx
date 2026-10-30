import { AdminTabs } from "@/components/portal/admin-tabs";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel, StatCard } from "@/components/portal/panel";
import { CHAT_MONTHLY_CAP_KES, CHAT_MONTHLY_CAP_USD_MICROS } from "@/config/chat";
import { getUserWithRole } from "@/lib/auth/dal";
import { daysAgoIso, formatBytes, formatDateTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Supabase Free caps the database at 500 MB; CLAUDE.md §3 sets the Pro
// upgrade trigger at 400 MB.
const DB_LIMIT_BYTES = 500 * 1024 * 1024;
const DB_TRIGGER_BYTES = 400 * 1024 * 1024;

type Integration = {
  name: string;
  status: "configured" | "missing" | "deferred";
  note: string;
};

function integrations(): Integration[] {
  const has = (key: string) => Boolean(process.env[key]);
  return [
    {
      name: "Supabase service role",
      status: has("SUPABASE_SERVICE_ROLE_KEY") ? "configured" : "missing",
      note: "Needed for lead capture and creating users.",
    },
    {
      name: "Cloudflare Turnstile",
      status: has("TURNSTILE_SECRET_KEY") ? "configured" : "missing",
      note: "Public forms only have a honeypot until this is set.",
    },
    {
      name: "Chat assistant (Anthropic)",
      status: has("ANTHROPIC_API_KEY") ? "configured" : "missing",
      note: "Without it the website chat answers from the FAQs only.",
    },
    {
      name: "Resend email",
      status: has("RESEND_API_KEY") ? "configured" : "deferred",
      note: "Deferred by owner decision. No lead alerts or auto-replies yet.",
    },
    {
      name: "SMS (Africa's Talking)",
      status: has("AFRICASTALKING_API_KEY") ? "configured" : "deferred",
      note: "Deferred by owner decision.",
    },
    {
      name: "ID verification",
      status: has("PERSONA_API_KEY") ? "configured" : "deferred",
      note: "Deferred. No vendor chosen yet.",
    },
  ];
}

const statusStyles: Record<Integration["status"], string> = {
  configured: "bg-emerald-100 text-emerald-800",
  missing: "bg-amber-100 text-amber-900",
  deferred: "bg-muted text-muted-foreground",
};

const triggerStyles = {
  triggered: "bg-amber-100 text-amber-900",
  ok: "bg-emerald-100 text-emerald-800",
  check: "bg-muted text-muted-foreground",
} as const;

const triggerLabels = {
  triggered: "triggered",
  ok: "ok",
  check: "check in Vercel",
} as const;

export default async function AdminHealthPage() {
  const user = await getUserWithRole(["super_admin"]);
  if (!user) return <NoAccess />;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const weekAgo = daysAgoIso(7);

  const month = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" })
    .format(new Date())
    .slice(0, 7);

  const [dbSize, leadsTotal, leadsWeek, failedRuns, issuedInvoices, payments, chatUsage] =
    await Promise.all([
      supabase.rpc("admin_database_size_bytes"),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabase
        .from("automation_runs")
        .select("id, created_at, type, error")
        .eq("status", "failed")
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .neq("status", "draft"),
      supabase.from("payments").select("id", { count: "exact", head: true }),
      supabase
        .from("chat_ai_usage")
        .select("requests, cost_usd_micros")
        .eq("month", month)
        .maybeSingle(),
    ]);
  const chatCostMicros = chatUsage.data?.cost_usd_micros ?? 0;
  const chatCapUsedPct = Math.round((chatCostMicros / CHAT_MONTHLY_CAP_USD_MICROS) * 100);

  const dbBytes = dbSize.data ?? null;
  const dbOverTrigger = dbBytes !== null && dbBytes >= DB_TRIGGER_BYTES;
  // Vercel Hobby is for non-commercial use (ADR 0001). Issued invoices or
  // recorded payments mean the business runs through this deployment.
  const commercialUse = (issuedInvoices.count ?? 0) > 0 || (payments.count ?? 0) > 0;

  return (
    <>
      <PageHeader title="Main Admin" description="System health and budget triggers." />
      <AdminTabs current="/portal/admin" />

      {dbOverTrigger ? (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          The database has passed 400 MB, the Supabase Pro upgrade trigger in CLAUDE.md
          §3. The free tier stops at 500 MB.
        </p>
      ) : null}

      {commercialUse ? (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Vercel upgrade trigger: the portal has issued {issuedInvoices.count ?? 0}{" "}
          invoice
          {issuedInvoices.count === 1 ? "" : "s"} and recorded {payments.count ?? 0}{" "}
          payment
          {payments.count === 1 ? "" : "s"}. Vercel&rsquo;s Hobby plan is for
          non-commercial use and pauses the site at its limits, so plan the move to Vercel
          Pro (see ADR 0001).
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Database size"
          value={dbBytes !== null ? formatBytes(dbBytes) : "Unavailable"}
          hint={`Free tier limit ${formatBytes(DB_LIMIT_BYTES)} · upgrade trigger ${formatBytes(DB_TRIGGER_BYTES)}`}
        />
        <StatCard label="Leads, all time" value={leadsTotal.count ?? "n/a"} />
        <StatCard label="Leads, last 7 days" value={leadsWeek.count ?? "n/a"} />
        <StatCard
          label="Chat assistant, this month"
          value={`US$${(chatCostMicros / 1_000_000).toFixed(2)}`}
          hint={`${chatUsage.data?.requests ?? 0} answers · ${chatCapUsedPct}% of the KES ${CHAT_MONTHLY_CAP_KES.toLocaleString("en-KE")} cap; FAQ answers only once reached`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Integrations"
          description="Read from this deployment's environment."
        >
          <ul className="divide-border divide-y">
            {integrations().map((item) => (
              <li key={item.name} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-xs">{item.note}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Failed automations, last 7 days"
          description="From automation_runs (CLAUDE.md §9)."
        >
          {failedRuns.data?.length ? (
            <ul className="divide-border divide-y">
              {failedRuns.data.map((run) => (
                <li key={run.id} className="py-3 text-sm">
                  <p className="font-medium">{run.type}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDateTime(run.created_at)} · {run.error ?? "No error message"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No failures.</p>
          )}
        </Panel>
      </div>

      <Panel
        title="Hosting: Vercel Hobby upgrade triggers"
        description="Any one of these means it's time for Vercel Pro (ADR 0001, CLAUDE.md §3). Hobby pauses the site at its limits instead of charging overage."
        className="mt-6"
      >
        <ul className="divide-border divide-y">
          {[
            {
              name: "Commercial use",
              status: commercialUse ? "triggered" : "ok",
              note: commercialUse
                ? `${issuedInvoices.count ?? 0} issued invoices and ${payments.count ?? 0} payments recorded through the portal. Hobby's terms are non-commercial.`
                : "No invoices issued or payments recorded through the portal yet.",
            },
            {
              name: "Usage approaching a Hobby limit",
              status: "check",
              note: "Bandwidth, function, image optimization and build usage are only shown in Vercel. Check the project's Usage page at least monthly.",
            },
            {
              name: "Team needs Vercel seats",
              status: "check",
              note: "Hobby is a single-person account. Upgrade when anyone besides the owner needs to deploy or manage hosting.",
            },
            {
              name: "Notice from Vercel",
              status: "check",
              note: "Any Vercel email about usage, terms or the account is a trigger.",
            },
          ].map((item) => (
            <li key={item.name} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-muted-foreground text-xs">{item.note}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${triggerStyles[item.status as keyof typeof triggerStyles]}`}
              >
                {triggerLabels[item.status as keyof typeof triggerLabels]}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <a
            href="https://vercel.com/nicholastonui34s-projects/~/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Open Vercel usage
          </a>
        </p>
      </Panel>
    </>
  );
}
