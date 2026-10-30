import Link from "next/link";

import { FinanceTabs } from "@/components/portal/finance/finance-tabs";
import { QuoteTable } from "@/components/portal/finance/quote-table";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { getUserWithRole } from "@/lib/auth/dal";
import { nairobiDateIso } from "@/lib/format";
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from "@/lib/finance/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const { status: statusParam } = await searchParams;
  const status = QUOTE_STATUSES.find((s) => s === statusParam);

  let query = supabase
    .from("quotes")
    .select(
      "id, number, title, status, currency, total_minor, valid_until, invoice_id, created_at, clients(name, company)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (status) query = query.eq("status", status);
  const { data: quotes } = await query;

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
        title="Finance"
        actions={
          <Button asChild>
            <Link href="/portal/finance/quotes/new">New quote</Link>
          </Button>
        }
      />
      <FinanceTabs current="/portal/finance/quotes" />
      <div className="mb-4 flex flex-wrap gap-2">
        {chip("/portal/finance/quotes", !status, "All")}
        {QUOTE_STATUSES.map((s) =>
          chip(
            `/portal/finance/quotes?status=${s}`,
            status === s,
            QUOTE_STATUS_LABELS[s],
          ),
        )}
      </div>
      <Panel>
        {quotes?.length ? (
          <QuoteTable quotes={quotes} today={nairobiDateIso()} />
        ) : (
          <p className="text-muted-foreground text-sm">No quotes here yet.</p>
        )}
      </Panel>
    </>
  );
}
