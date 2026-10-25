import { AdminTabs } from "@/components/portal/admin-tabs";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, NotConnected, Panel, StatCard } from "@/components/portal/panel";
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
      name: "Cal.com booking",
      status: has("NEXT_PUBLIC_CAL_COM_LINK") ? "configured" : "missing",
      note: "/contact falls back to WhatsApp without it.",
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

export default async function AdminHealthPage() {
  const user = await getUserWithRole(["super_admin"]);
  if (!user) return <NoAccess />;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const weekAgo = daysAgoIso(7);

  const [dbSize, leadsTotal, leadsWeek, failedRuns] = await Promise.all([
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
  ]);

  const dbBytes = dbSize.data ?? null;
  const dbOverTrigger = dbBytes !== null && dbBytes >= DB_TRIGGER_BYTES;

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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Database size"
          value={dbBytes !== null ? formatBytes(dbBytes) : "Unavailable"}
          hint={`Free tier limit ${formatBytes(DB_LIMIT_BYTES)} · upgrade trigger ${formatBytes(DB_TRIGGER_BYTES)}`}
        />
        <StatCard label="Leads, all time" value={leadsTotal.count ?? "n/a"} />
        <StatCard label="Leads, last 7 days" value={leadsWeek.count ?? "n/a"} />
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

      <div className="mt-6">
        <NotConnected
          title="Vercel Hobby usage"
          reason="Vercel doesn't expose plan usage to the app without an API token. Check bandwidth, function and image-optimization usage in the Vercel dashboard; CLAUDE.md §3 lists the upgrade triggers."
        />
      </div>
    </>
  );
}
