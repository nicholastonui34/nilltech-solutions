import { FileDown } from "lucide-react";

import { FinanceTabs } from "@/components/portal/finance/finance-tabs";
import {
  RecordFreelancerPaymentForm,
  VoidFreelancerPaymentForm,
} from "@/components/portal/finance/freelancer-payment-forms";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { nairobiDateIso } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import { formatMoney } from "@/lib/finance/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleLabel } from "@/lib/talent/options";

/** Freelancer pay: record payments to approved talent (each also becomes a talent expense). */
export default async function FreelancerPayPage() {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const [{ data: payments }, { data: talent }, { data: projects }] = await Promise.all([
    supabase
      .from("freelancer_payments")
      .select(
        "id, number, paid_on, amount_minor, currency, method, reference, description, payee_name, voided_at, void_reason, projects(name)",
      )
      .order("paid_on", { ascending: false })
      .order("recorded_at", { ascending: false })
      .limit(200),
    supabase
      .from("talent_applications")
      .select("id, full_name, primary_role")
      .eq("stage", "approved")
      .order("full_name"),
    supabase.from("projects").select("id, name").order("name"),
  ]);
  const today = nairobiDateIso();

  return (
    <>
      <PageHeader title="Finance" />
      <FinanceTabs current="/portal/finance/freelancers" />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel title="Payments to freelancers">
          {payments?.length ? (
            <ul className="divide-border divide-y">
              {payments.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p
                        className={
                          p.voided_at ? "font-medium line-through" : "font-medium"
                        }
                      >
                        {p.payee_name} · {formatMoney(p.amount_minor, p.currency)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {p.number} · {p.paid_on} · {PAYMENT_METHOD_LABELS[p.method]}
                        {p.reference ? ` · ref ${p.reference}` : ""} · {p.description}
                        {p.projects?.name ? ` · ${p.projects.name}` : ""}
                      </p>
                      {p.voided_at ? (
                        <p className="text-xs text-red-800">Void: {p.void_reason}</p>
                      ) : null}
                    </div>
                    <a
                      href={`/portal/documents/freelancer-payments/${p.id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      <FileDown className="size-4" /> Advice
                    </a>
                  </div>
                  {!p.voided_at ? <VoidFreelancerPaymentForm paymentId={p.id} /> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No freelancer payments yet.</p>
          )}
        </Panel>

        <Panel title="Record a payment">
          {talent?.length ? (
            <RecordFreelancerPaymentForm
              talent={talent.map((t) => ({
                id: t.id,
                label: `${t.full_name} (${roleLabel(t.primary_role)})`,
              }))}
              projects={projects ?? []}
              today={today}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              No approved talent yet. Recruitment approves applicants first.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
