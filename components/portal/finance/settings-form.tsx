"use client";

import { useActionState } from "react";

import { updateFinanceSettings, type FinanceFormState } from "@/app/actions/finance";
import { FormMessage } from "@/components/portal/finance/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/supabase/types";

type Settings = Database["public"]["Tables"]["finance_settings"]["Row"];

const initialState: FinanceFormState = {};

function Field({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string | number | null;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={`fs-${name}`}>{label}</Label>
      <Input
        id={`fs-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        className="mt-1.5"
      />
    </div>
  );
}

export function FinanceSettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(
    updateFinanceSettings,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Company</h2>
        <Field name="legal_name" label="Legal name" defaultValue={settings.legal_name} />
        <Field name="kra_pin" label="KRA PIN" defaultValue={settings.kra_pin} />
        <Field name="email" label="Email" defaultValue={settings.email} type="email" />
        <Field name="phone" label="Phone" defaultValue={settings.phone} />
        <div className="sm:col-span-2">
          <Label htmlFor="fs-address_lines">Address (one line per row)</Label>
          <Textarea
            id="fs-address_lines"
            name="address_lines"
            rows={3}
            defaultValue={settings.address_lines.join("\n")}
            className="mt-1.5"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">M-Pesa</h2>
        <Field
          name="mpesa_paybill"
          label="Paybill number"
          defaultValue={settings.mpesa_paybill}
        />
        <Field
          name="mpesa_account"
          label="Account number"
          defaultValue={settings.mpesa_account}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Bank transfer</h2>
        <Field
          name="bank_account_name"
          label="Account name"
          defaultValue={settings.bank_account_name}
        />
        <Field
          name="bank_account_number"
          label="Account number"
          defaultValue={settings.bank_account_number}
        />
        <Field name="bank_name" label="Bank" defaultValue={settings.bank_name} />
        <Field
          name="bank_branch"
          label="Branch & address"
          defaultValue={settings.bank_branch}
        />
        <Field name="bank_swift" label="SWIFT code" defaultValue={settings.bank_swift} />
        <div>
          <Label htmlFor="fs-bank_account_currency">Account currency</Label>
          <NativeSelect
            id="fs-bank_account_currency"
            name="bank_account_currency"
            defaultValue={settings.bank_account_currency ?? ""}
            className="mt-1.5"
          >
            <option value="">Not set</option>
            <option value="KES">KES</option>
            <option value="USD">USD</option>
          </NativeSelect>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Invoices</h2>
        <Field
          name="default_payment_terms_days"
          label="Default payment terms (days)"
          defaultValue={settings.default_payment_terms_days}
          type="number"
        />
        <Field
          name="invoice_footer"
          label="Footer line"
          defaultValue={settings.invoice_footer}
        />
      </section>

      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
