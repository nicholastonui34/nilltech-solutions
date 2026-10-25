import { FinanceTabs } from "@/components/portal/finance/finance-tabs";
import { FinanceSettingsForm } from "@/components/portal/finance/settings-form";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FinanceSettingsPage() {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return <NoAccess />;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <NoAccess />;

  const { data: settings } = await supabase
    .from("finance_settings")
    .select("*")
    .maybeSingle();

  return (
    <>
      <PageHeader
        title="Finance"
        description="Company and payment details printed on new invoices and receipts. Changes are audit-logged."
      />
      <FinanceTabs current="/portal/finance/settings" />
      <Panel className="max-w-3xl">
        {settings ? (
          <>
            <FinanceSettingsForm settings={settings} />
            <p className="text-muted-foreground mt-6 text-xs">
              Last updated {formatDateTime(settings.updated_at)}.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Finance settings haven&rsquo;t been set up in the database yet.
          </p>
        )}
      </Panel>
    </>
  );
}
