"use client";

import { useActionState } from "react";

import {
  issueCreditNote,
  issueInvoice,
  recordPayment,
  recordRefund,
  voidInvoice,
  type FinanceFormState,
} from "@/app/actions/finance";
import { FormMessage } from "@/components/portal/finance/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "@/lib/finance/labels";

const initialState: FinanceFormState = {};

export function IssueInvoiceForm({
  invoiceId,
  defaultDueDate,
  minDate,
}: {
  invoiceId: string;
  defaultDueDate: string;
  minDate: string;
}) {
  const [state, formAction, pending] = useActionState(issueInvoice, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div>
        <Label htmlFor="dueDate">Due date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          min={minDate}
          defaultValue={defaultDueDate}
          required
          className="mt-1.5"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Issuing assigns the next invoice number and locks the invoice. Save the draft
        first.
      </p>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Issuing…" : "Issue invoice"}
      </Button>
    </form>
  );
}

export function RecordPaymentForm({
  invoiceId,
  currency,
  balance,
  today,
}: {
  invoiceId: string;
  currency: string;
  balance: string;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(recordPayment, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div>
        <Label htmlFor="amount">Amount received ({currency})</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          defaultValue={balance}
          required
          className="mt-1.5"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="method">Method</Label>
          <NativeSelect id="method" name="method" defaultValue="mpesa" className="mt-1.5">
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label htmlFor="paidOn">Date paid</Label>
          <Input
            id="paidOn"
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
        <Label htmlFor="reference">Reference (M-Pesa code or bank ref)</Label>
        <Input id="reference" name="reference" maxLength={100} className="mt-1.5" />
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}

export function VoidInvoiceForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState(voidInvoice, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" name="reason" required minLength={3} className="mt-1.5" />
      </div>
      <p className="text-muted-foreground text-xs">
        Voiding keeps the number on record and can&rsquo;t be undone. Only invoices with
        no payments or credit notes can be voided; otherwise issue a credit note.
      </p>
      <FormMessage state={state} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Voiding…" : "Void invoice"}
      </Button>
    </form>
  );
}

export function IssueCreditNoteForm({
  invoiceId,
  currency,
  maxAmount,
}: {
  invoiceId: string;
  currency: string;
  /** What's left to credit, as a decimal string. */
  maxAmount: string;
}) {
  const [state, formAction, pending] = useActionState(issueCreditNote, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div>
        <Label htmlFor="creditAmount">Amount to credit ({currency})</Label>
        <Input
          id="creditAmount"
          name="amount"
          inputMode="decimal"
          defaultValue={maxAmount}
          required
          className="mt-1.5"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Up to {currency} {maxAmount}. Use the full amount to cancel the invoice.
        </p>
      </div>
      <div>
        <Label htmlFor="creditReason">Reason (printed on the credit note)</Label>
        <Input
          id="creditReason"
          name="reason"
          required
          minLength={3}
          maxLength={500}
          className="mt-1.5"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Issuing assigns the next credit note number and reduces the balance due. It
        can&rsquo;t be undone.
      </p>
      <FormMessage state={state} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Issuing…" : "Issue credit note"}
      </Button>
    </form>
  );
}

export function RecordRefundForm({
  invoiceId,
  currency,
  maxAmount,
  today,
}: {
  invoiceId: string;
  currency: string;
  /** The client's credit on this invoice, as a decimal string. */
  maxAmount: string;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(recordRefund, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div>
        <Label htmlFor="refundAmount">Amount refunded ({currency})</Label>
        <Input
          id="refundAmount"
          name="amount"
          inputMode="decimal"
          defaultValue={maxAmount}
          required
          className="mt-1.5"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="refundMethod">Method</Label>
          <NativeSelect
            id="refundMethod"
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
          <Label htmlFor="refundedOn">Date refunded</Label>
          <Input
            id="refundedOn"
            name="refundedOn"
            type="date"
            max={today}
            defaultValue={today}
            required
            className="mt-1.5"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="refundReference">Reference (M-Pesa code or bank ref)</Label>
        <Input id="refundReference" name="reference" maxLength={100} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="refundReason">Reason</Label>
        <Input
          id="refundReason"
          name="reason"
          required
          minLength={3}
          maxLength={500}
          className="mt-1.5"
        />
      </div>
      <FormMessage state={state} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Recording…" : "Record refund"}
      </Button>
    </form>
  );
}
