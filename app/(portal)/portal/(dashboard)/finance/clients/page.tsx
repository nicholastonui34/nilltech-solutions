import Link from "next/link";

import { ClientForm } from "@/components/portal/finance/client-form";
import { FinanceTabs } from "@/components/portal/finance/finance-tabs";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ClientsPage() {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, company, email, phone, user_id")
    .order("company", { ascending: true, nullsFirst: false })
    .order("name");

  return (
    <>
      <PageHeader title="Finance" description="The people and companies you invoice." />
      <FinanceTabs current="/portal/finance/clients" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title="Clients">
          {clients?.length ? (
            <ul className="divide-border divide-y">
              {clients.map((client) => (
                <li key={client.id} className="py-3">
                  <Link
                    href={`/portal/finance/clients/${client.id}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {client.company ?? client.name}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {[client.company ? client.name : null, client.email, client.phone]
                      .filter(Boolean)
                      .join(" · ") || "No contact details"}
                    {client.user_id ? " · has portal access" : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No clients yet.</p>
          )}
        </Panel>
        <Panel title="Add a client">
          <ClientForm />
        </Panel>
      </div>
    </>
  );
}
