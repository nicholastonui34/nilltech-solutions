"use client";

import { useActionState, useState } from "react";

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
import { CURRENCIES } from "@/lib/finance/money";
import {
  PAYOUT_METHOD_LABELS,
  formatMpesaNumber,
  type PayoutDetails,
  type PayoutMethod,
} from "@/lib/finance/payout";

const initialState: FinanceFormState = {};

function PayoutDetailsSummary({ payout }: { payout: PayoutDetails }) {
  return (
    <dl className="bg-muted/50 grid gap-x-4 gap-y-1 rounded-lg p-3 text-xs sm:grid-cols-[auto_1fr]">
      {payout.mpesaNumber ? (
        <>
          <dt className="text-muted-foreground">M-Pesa</dt>
          <dd>
            {formatMpesaNumber(payout.mpesaNumber)} ({payout.mpesaName})
          </dd>
        </>
      ) : null}
      {payout.bankAccountNumber ? (
        <>
          <dt className="text-muted-foreground">Bank</dt>
          <dd>
            {payout.bankName}
            {payout.bankBranch ? `, ${payout.bankBranch}` : ""}
          </dd>
          <dt className="text-muted-foreground">Account</dt>
          <dd>{payout.bankAccountNumber}</dd>
          <dt className="text-muted-foreground">Beneficiary</dt>
          <dd>{payout.bankAccountName}</dd>
        </>
      ) : null}
      <dt className="text-muted-foreground">Prefers</dt>
      <dd>{PAYOUT_METHOD_LABELS[payout.preferredMethod]}</dd>
    </dl>
  );
}

export function RecordFreelancerPaymentForm({
  talent,
  projects,
  today,
}: {
  talent: { id: string; label: string; payout: PayoutDetails | null }[];
  projects: { id: string; name: string }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    recordFreelancerPayment,
    initialState,
  );
  const [talentId, setTalentId] = useState("");
  const selected = talent.find((t) => t.id === talentId);
  const payout = selected?.payout ?? null;
  const available: PayoutMethod[] = payout
    ? [
        ...(payout.mpesaNumber ? (["mpesa"] as const) : []),
        ...(payout.bankAccountNumber ? (["bank_transfer"] as const) : []),
      ]
    : [];
  const [method, setMethod] = useState<PayoutMethod | "">("");
  const chosen: PayoutMethod | "" =
    method && available.includes(method)
      ? method
      : (payout?.preferredMethod ?? available[0] ?? "");
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="fp-talent">Paid to</Label>
        <NativeSelect
          id="fp-talent"
          name="talentId"
          value={talentId}
          onChange={(event) => {
            setTalentId(event.target.value);
            setMethod("");
          }}
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
      {selected ? (
        payout ? (
          <PayoutDetailsSummary payout={payout} />
        ) : (
          <p
            role="alert"
            className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"
          >
            {selected.label} hasn&rsquo;t added payout details yet. Ask them to add their
            M-Pesa or bank details under Payments in their portal.
          </p>
        )
      ) : null}
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
            value={chosen}
            onChange={(event) => setMethod(event.target.value as PayoutMethod)}
            required
            disabled={!available.length}
            className="mt-1.5"
          >
            {available.length ? null : <option value="">No payout details</option>}
            {available.map((m) => (
              <option key={m} value={m}>
                {m === "mpesa" ? "M-Pesa" : "Bank transfer"}
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
      <Button type="submit" disabled={pending || !available.length}>
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
