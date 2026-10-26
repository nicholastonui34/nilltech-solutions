import Link from "next/link";

import { FinanceTabs } from "@/components/portal/finance/finance-tabs";
import { NewInvoiceForm } from "@/components/portal/finance/new-invoice-form";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { getClientOptions } from "@/lib/finance/queries";

export default async function NewInvoicePage() {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;
  const clients = await getClientOptions();

  return (
    <>
      <PageHeader title="New invoice" description="Start a draft, then add line items." />
      <FinanceTabs current="/portal/finance/invoices" />
      <Panel>
        {clients.length ? (
          <NewInvoiceForm clients={clients} />
        ) : (
          <p className="text-muted-foreground text-sm">
            You need a client first.{" "}
            <Link
              href="/portal/finance/clients"
              className="text-primary underline underline-offset-2"
            >
              Add one
            </Link>
            .
          </p>
        )}
      </Panel>
    </>
  );
}
