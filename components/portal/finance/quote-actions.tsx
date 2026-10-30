"use client";

import { useActionState } from "react";

import {
  convertQuoteToInvoice,
  decideQuote,
  sendQuote,
  type FinanceFormState,
} from "@/app/actions/finance";
import { FormMessage } from "@/components/portal/finance/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: FinanceFormState = {};

export function SendQuoteForm({
  quoteId,
  defaultValidUntil,
  minDate,
}: {
  quoteId: string;
  defaultValidUntil: string;
  minDate: string;
}) {
  const [state, formAction, pending] = useActionState(sendQuote, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="quoteId" value={quoteId} />
      <div>
        <Label htmlFor="validUntil">Valid until</Label>
        <Input
          id="validUntil"
          name="validUntil"
          type="date"
          min={minDate}
          defaultValue={defaultValidUntil}
          required
          className="mt-1.5"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        This gives the quote its number and locks it, ready to download and send. Save the
        draft first.
      </p>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Finalising…" : "Finalise quote"}
      </Button>
    </form>
  );
}

export function DecideQuoteForm({
  quoteId,
  current,
}: {
  quoteId: string;
  current: "sent" | "accepted" | "declined";
}) {
  const [state, formAction, pending] = useActionState(decideQuote, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="quoteId" value={quoteId} />
      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          rows={2}
          maxLength={500}
          placeholder="For example: approved by email on 3 November"
          className="mt-1.5"
        />
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        {current !== "accepted" ? (
          <Button type="submit" name="outcome" value="accepted" disabled={pending}>
            Client accepted
          </Button>
        ) : null}
        {current !== "declined" ? (
          <Button
            type="submit"
            name="outcome"
            value="declined"
            variant="outline"
            disabled={pending}
          >
            Client declined
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function ConvertQuoteForm({ quoteId }: { quoteId: string }) {
  const [state, formAction, pending] = useActionState(
    convertQuoteToInvoice,
    initialState,
  );
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="quoteId" value={quoteId} />
      <p className="text-muted-foreground text-xs">
        Creates a draft invoice with the same client, currency and lines. Check it, then
        issue it as usual.
      </p>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create draft invoice"}
      </Button>
    </form>
  );
}
