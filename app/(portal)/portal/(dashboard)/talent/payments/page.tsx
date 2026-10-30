import { FileDown } from "lucide-react";

import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel, StatCard } from "@/components/portal/panel";
import { NoTalentProfile } from "@/components/portal/talent/no-profile";
import { TalentTabs } from "@/components/portal/talent/talent-tabs";
import { getUserWithRole } from "@/lib/auth/dal";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import { CURRENCIES, formatMoney } from "@/lib/finance/money";
import { getOwnTalentProfile } from "@/lib/talent/own-profile";

export default async function TalentPaymentsPage() {
  const user = await getUserWithRole(["freelancer"]);
  if (!user) return <NoAccess />;
  const { supabase, profile } = await getOwnTalentProfile(user.id);
  if (!supabase || !profile) return <NoTalentProfile />;

  const { data: payments } = await supabase
    .from("freelancer_payments")
    .select(
      "id, number, paid_on, amount_minor, currency, method, reference, description, voided_at, projects(name)",
    )
    .eq("talent_id", profile.id)
    .order("paid_on", { ascending: false });

  const year = new Date().getFullYear().toString();
  const valid = (payments ?? []).filter((p) => !p.voided_at);
  const totals = CURRENCIES.map((currency) => ({
    currency,
    year: valid
      .filter((p) => p.currency === currency && p.paid_on.startsWith(year))
      .reduce((sum, p) => sum + p.amount_minor, 0),
    all: valid
      .filter((p) => p.currency === currency)
      .reduce((sum, p) => sum + p.amount_minor, 0),
  })).filter((t, i) => i === 0 || t.all > 0);

  return (
    <>
      <PageHeader
        title="Payments"
        description="What NillTech has paid you. Download a payment advice for each one."
      />
      <TalentTabs current="/portal/talent/payments" stage={profile.stage} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {totals.map((t) => [
          <StatCard
            key={`${t.currency}-year`}
            label={`Paid this year (${t.currency})`}
            value={formatMoney(t.year, t.currency)}
          />,
          <StatCard
            key={`${t.currency}-all`}
            label={`Paid in total (${t.currency})`}
            value={formatMoney(t.all, t.currency)}
          />,
        ])}
      </div>

      <Panel>
        {payments?.length ? (
          <ul className="divide-border divide-y">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className={p.voided_at ? "font-medium line-through" : "font-medium"}>
                    {formatMoney(p.amount_minor, p.currency)} · {p.description}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {p.number} · paid {p.paid_on} · {PAYMENT_METHOD_LABELS[p.method]}
                    {p.reference ? ` · ref ${p.reference}` : ""}
                    {p.projects?.name ? ` · ${p.projects.name}` : ""}
                    {p.voided_at ? " · void (recorded in error)" : ""}
                  </p>
                </div>
                <a
                  href={`/portal/documents/freelancer-payments/${p.id}`}
                  target="_blank"
                  rel="noopener"
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <FileDown className="size-4" /> Payment advice
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
        )}
      </Panel>
    </>
  );
}
