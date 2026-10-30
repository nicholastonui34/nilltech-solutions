"use client";

import { useActionState } from "react";

import {
  createInvoiceDraft,
  createQuoteDraft,
  type FinanceFormState,
} from "@/app/actions/finance";
import { FormMessage } from "@/components/portal/finance/form-message";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { CURRENCIES } from "@/lib/finance/money";

const initialState: FinanceFormState = {};

/** Starts an invoice or quote draft for a client. */
export function NewInvoiceForm({
  kind = "invoice",
  clients,
}: {
  kind?: "invoice" | "quote";
  clients: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    kind === "quote" ? createQuoteDraft : createInvoiceDraft,
    initialState,
  );
  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div>
        <Label htmlFor="new-client">Client</Label>
        <NativeSelect
          id="new-client"
          name="clientId"
          defaultValue=""
          required
          className="mt-1.5"
        >
          <option value="" disabled>
            Choose a client
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="new-currency">Currency</Label>
        <NativeSelect
          id="new-currency"
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
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}
