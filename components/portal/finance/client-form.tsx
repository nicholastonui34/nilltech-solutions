"use client";

import { useActionState } from "react";

import {
  createClientRecord,
  updateClientRecord,
  type FinanceFormState,
} from "@/app/actions/finance";
import { FormMessage } from "@/components/portal/finance/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ClientValues = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  portalEmail: string | null;
};

const initialState: FinanceFormState = {};

export function ClientForm({ client }: { client?: ClientValues }) {
  const [state, formAction, pending] = useActionState(
    client ? updateClientRecord : createClientRecord,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {client ? <input type="hidden" name="clientId" value={client.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="client-name">Contact name</Label>
          <Input
            id="client-name"
            name="name"
            defaultValue={client?.name}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="client-company">Company (optional)</Label>
          <Input
            id="client-company"
            name="company"
            defaultValue={client?.company ?? ""}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="client-email">Email</Label>
          <Input
            id="client-email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="client-phone">Phone</Label>
          <Input
            id="client-phone"
            name="phone"
            defaultValue={client?.phone ?? ""}
            className="mt-1.5"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="client-address">Billing address</Label>
        <Textarea
          id="client-address"
          name="address"
          rows={2}
          defaultValue={client?.address ?? ""}
          className="mt-1.5"
        />
      </div>
      {client ? (
        <div>
          <Label htmlFor="client-portal">Portal login email (optional)</Label>
          <Input
            id="client-portal"
            name="portalEmail"
            type="email"
            defaultValue={client.portalEmail ?? ""}
            className="mt-1.5"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Lets this client see their issued invoices and receipts at /portal/invoices.
            The account must exist and have the Client role (Main Admin → Users &amp;
            roles).
          </p>
        </div>
      ) : null}
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : client ? "Save client" : "Add client"}
      </Button>
    </form>
  );
}
