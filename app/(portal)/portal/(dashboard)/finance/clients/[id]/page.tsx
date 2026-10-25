import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ClientForm } from "@/components/portal/finance/client-form";
import { InvoiceTable } from "@/components/portal/finance/invoice-table";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { getUserWithRole } from "@/lib/auth/dal";
import { listAuthUsers } from "@/lib/auth/users";
import { nairobiDateIso } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const [{ data: client }, { data: invoices }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("invoices")
      .select(
        "id, number, status, currency, total_minor, paid_minor, due_date, created_at, clients(name, company)",
      )
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!client) notFound();

  // Show the linked login's email (auth emails need the service role).
  const portalEmail = client.user_id
    ? ((await listAuthUsers())?.find((u) => u.id === client.user_id)?.email ?? null)
    : null;

  return (
    <>
      <Link
        href="/portal/finance/clients"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All clients
      </Link>
      <PageHeader
        title={client.company ?? client.name}
        description={client.company ? client.name : undefined}
        actions={
          <Button asChild>
            <Link href="/portal/finance/invoices/new">New invoice</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title="Invoices">
          {invoices?.length ? (
            <InvoiceTable invoices={invoices} today={nairobiDateIso()} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No invoices for this client yet.
            </p>
          )}
        </Panel>
        <Panel title="Details">
          <ClientForm
            client={{
              id: client.id,
              name: client.name,
              company: client.company,
              email: client.email,
              phone: client.phone,
              address: client.address,
              portalEmail,
            }}
          />
        </Panel>
      </div>
    </>
  );
}
