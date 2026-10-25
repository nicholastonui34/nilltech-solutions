import Link from "next/link";

import { FinanceTabs } from "@/components/portal/finance/finance-tabs";
import { InvoiceTable } from "@/components/portal/finance/invoice-table";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { getUserWithRole } from "@/lib/auth/dal";
import { nairobiDateIso } from "@/lib/format";
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from "@/lib/finance/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const { status: statusParam } = await searchParams;
  const status = INVOICE_STATUSES.find((s) => s === statusParam);

  let query = supabase
    .from("invoices")
    .select(
      "id, number, status, currency, total_minor, paid_minor, due_date, created_at, clients(name, company)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (status) query = query.eq("status", status);
  const { data: invoices } = await query;

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
            <Link href="/portal/finance/invoices/new">New invoice</Link>
          </Button>
        }
      />
      <FinanceTabs current="/portal/finance/invoices" />
      <div className="mb-4 flex flex-wrap gap-2">
        {chip("/portal/finance/invoices", !status, "All")}
        {INVOICE_STATUSES.map((s) =>
          chip(
            `/portal/finance/invoices?status=${s}`,
            status === s,
            INVOICE_STATUS_LABELS[s],
          ),
        )}
      </div>
      <Panel>
        {invoices?.length ? (
          <InvoiceTable invoices={invoices} today={nairobiDateIso()} />
        ) : (
          <p className="text-muted-foreground text-sm">No invoices here yet.</p>
        )}
      </Panel>
    </>
  );
}
