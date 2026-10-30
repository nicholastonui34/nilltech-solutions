"use client";

import { useActionState } from "react";

import {
  recordFreelancerPayment,
  voidFreelancerPayment,
  type FinanceFormState,
} from "@/app/actions/finance";
import { FormMessage } from "@/components/portal/finance/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "@/lib/finance/labels";
import { CURRENCIES } from "@/lib/finance/money";

const initialState: FinanceFormState = {};

export function RecordFreelancerPaymentForm({
  talent,
  projects,
  today,
}: {
  talent: { id: string; label: string }[];
  projects: { id: string; name: string }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    recordFreelancerPayment,
    initialState,
  );
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="fp-talent">Paid to</Label>
        <NativeSelect
          id="fp-talent"
          name="talentId"
          defaultValue=""
          required
          className="mt-1.5"
        >
          <option value="" disabled>
            Choose a person
          </option>
          {talent.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="fp-description">What it&rsquo;s for</Label>
        <Input
          id="fp-description"
          name="description"
          required
          minLength={3}
          maxLength={300}
          placeholder="For example: Frontend work, November"
          className="mt-1.5"
        />
      </div>
      <div className="grid grid-cols-[1fr_100px] gap-3">
        <div>
          <Label htmlFor="fp-amount">Amount</Label>
          <Input
            id="fp-amount"
            name="amount"
            inputMode="decimal"
            required
            placeholder="0.00"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="fp-currency">Currency</Label>
          <NativeSelect
            id="fp-currency"
            name="currency"
            defaultValue="KES"
            className="mt-1.5"
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="fp-method">Method</Label>
          <NativeSelect
            id="fp-method"
            name="method"
            defaultValue="mpesa"
            className="mt-1.5"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label htmlFor="fp-paid-on">Date paid</Label>
          <Input
            id="fp-paid-on"
            name="paidOn"
            type="date"
            max={today}
            defaultValue={today}
            required
            className="mt-1.5"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="fp-reference">Reference (M-Pesa code or bank ref)</Label>
        <Input id="fp-reference" name="reference" maxLength={100} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="fp-project">Project (optional)</Label>
        <NativeSelect id="fp-project" name="projectId" defaultValue="" className="mt-1.5">
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <p className="text-muted-foreground text-xs">
        Recording gives it a number, adds it to Expenses (Talent and contractors), and
        lets the freelancer download a payment advice in their portal.
      </p>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}

export function VoidFreelancerPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, formAction, pending] = useActionState(
    voidFreelancerPayment,
    initialState,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="paymentId" value={paymentId} />
      <div>
        <Label htmlFor={`void-${paymentId}`} className="sr-only">
          Reason for voiding
        </Label>
        <Input
          id={`void-${paymentId}`}
          name="reason"
          required
          minLength={3}
          placeholder="Reason for voiding"
          className="h-8 w-48 text-xs"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="text-destructive"
        disabled={pending}
      >
        {pending ? "Voiding…" : "Void"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
