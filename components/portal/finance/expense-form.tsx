"use client";

import { useActionState } from "react";

import {
  createExpense,
  updateExpense,
  type FinanceFormState,
} from "@/app/actions/finance";
import { FormMessage } from "@/components/portal/finance/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type ExpenseCategory,
  type PaymentMethod,
} from "@/lib/finance/labels";
import { CURRENCIES, type Currency } from "@/lib/finance/money";

export type ExpenseValues = {
  id: string;
  spent_on: string;
  description: string;
  category: ExpenseCategory;
  amount: string;
  currency: Currency;
  vendor: string | null;
  method: PaymentMethod | null;
  reference: string | null;
  project_id: string | null;
  notes: string | null;
};

const initialState: FinanceFormState = {};

export function ExpenseForm({
  expense,
  projects,
  today,
}: {
  expense?: ExpenseValues;
  projects: { id: string; name: string }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    expense ? updateExpense : createExpense,
    initialState,
  );

  return (
    // A fresh key after each successful add clears the form for the next one.
    <form
      key={expense ? expense.id : state.success}
      action={formAction}
      className="flex flex-col gap-4"
    >
      {expense ? <input type="hidden" name="expenseId" value={expense.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="expense-date">Date paid</Label>
          <Input
            id="expense-date"
            name="spent_on"
            type="date"
            defaultValue={expense?.spent_on ?? today}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="expense-category">Category</Label>
          <NativeSelect
            id="expense-category"
            name="category"
            defaultValue={expense?.category ?? ""}
            required
            className="mt-1.5"
          >
            <option value="" disabled>
              Choose one
            </option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {EXPENSE_CATEGORY_LABELS[category]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div>
        <Label htmlFor="expense-description">Description</Label>
        <Input
          id="expense-description"
          name="description"
          defaultValue={expense?.description}
          placeholder="e.g. Vercel Pro, October"
          required
          className="mt-1.5"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <div>
          <Label htmlFor="expense-amount">Amount</Label>
          <Input
            id="expense-amount"
            name="amount"
            inputMode="decimal"
            defaultValue={expense?.amount}
            placeholder="0.00"
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="expense-currency">Currency</Label>
          <NativeSelect
            id="expense-currency"
            name="currency"
            defaultValue={expense?.currency ?? "KES"}
            className="mt-1.5"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="expense-vendor">Paid to (optional)</Label>
          <Input
            id="expense-vendor"
            name="vendor"
            defaultValue={expense?.vendor ?? ""}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="expense-method">Paid by (optional)</Label>
          <NativeSelect
            id="expense-method"
            name="method"
            defaultValue={expense?.method ?? ""}
            className="mt-1.5"
          >
            <option value="">Not recorded</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label htmlFor="expense-reference">Reference (optional)</Label>
          <Input
            id="expense-reference"
            name="reference"
            defaultValue={expense?.reference ?? ""}
            placeholder="M-Pesa code, receipt no."
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="expense-project">Project (optional)</Label>
          <NativeSelect
            id="expense-project"
            name="project_id"
            defaultValue={expense?.project_id ?? ""}
            className="mt-1.5"
          >
            <option value="">General business cost</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div>
        <Label htmlFor="expense-notes">Notes (optional)</Label>
        <Textarea
          id="expense-notes"
          name="notes"
          rows={2}
          defaultValue={expense?.notes ?? ""}
          className="mt-1.5"
        />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : expense ? "Save expense" : "Add expense"}
      </Button>
    </form>
  );
}
