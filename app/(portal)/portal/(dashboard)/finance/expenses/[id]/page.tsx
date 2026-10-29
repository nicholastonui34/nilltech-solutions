import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { deleteExpense } from "@/app/actions/finance";
import { ExpenseForm } from "@/components/portal/finance/expense-form";
import { PageHeader } from "@/components/portal/page-header";
import { NoAccess, Panel } from "@/components/portal/panel";
import { Button } from "@/components/ui/button";
import { getUserWithRole } from "@/lib/auth/dal";
import { formatDateTime, nairobiDateIso } from "@/lib/format";
import { formatAmount } from "@/lib/finance/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ExpenseDetailPage({
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

  const [{ data: expense }, { data: projects }] = await Promise.all([
    supabase.from("expenses").select("*").eq("id", id).maybeSingle(),
    supabase.from("projects").select("id, name").order("name"),
  ]);
  if (!expense) notFound();

  return (
    <>
      <Link
        href={`/portal/finance/expenses?month=${expense.spent_on.slice(0, 7)}`}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Expenses
      </Link>
      <PageHeader
        title={expense.description}
        description={`Recorded ${formatDateTime(expense.created_at)}. Every change is kept in the audit log.`}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title="Edit expense">
          <ExpenseForm
            expense={{
              id: expense.id,
              spent_on: expense.spent_on,
              description: expense.description,
              category: expense.category,
              // formatAmount adds thousands separators; parseAmountToMinor accepts them.
              amount: formatAmount(expense.amount_minor),
              currency: expense.currency,
              vendor: expense.vendor,
              method: expense.method,
              reference: expense.reference,
              project_id: expense.project_id,
              notes: expense.notes,
            }}
            projects={projects ?? []}
            today={nairobiDateIso()}
          />
        </Panel>
        <Panel title="Delete">
          <p className="text-muted-foreground mb-4 text-sm">
            Remove an expense recorded by mistake. The deletion is kept in the audit log.
          </p>
          <form action={deleteExpense}>
            <input type="hidden" name="expenseId" value={expense.id} />
            <Button type="submit" variant="destructive">
              Delete expense
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
