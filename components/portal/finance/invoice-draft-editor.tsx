"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { saveInvoiceDraft, type FinanceFormState } from "@/app/actions/finance";
import { FormMessage } from "@/components/portal/finance/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  CURRENCIES,
  formatMoney,
  lineTotalMinor,
  parseAmountToMinor,
  type Currency,
} from "@/lib/finance/money";

type Row = { key: number; description: string; quantity: string; unitPrice: string };

const initialState: FinanceFormState = {};

export function InvoiceDraftEditor({
  invoiceId,
  clients,
  initial,
}: {
  invoiceId: string;
  clients: { id: string; label: string }[];
  initial: {
    clientId: string;
    currency: Currency;
    notes: string;
    items: { description: string; quantity: number; unitPriceMinor: number }[];
  };
}) {
  const [state, formAction, pending] = useActionState(saveInvoiceDraft, initialState);
  const [currency, setCurrency] = useState<Currency>(initial.currency);
  const [rows, setRows] = useState<Row[]>(() =>
    initial.items.length
      ? initial.items.map((item, index) => ({
          key: index,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: (item.unitPriceMinor / 100).toFixed(2),
        }))
      : [{ key: 0, description: "", quantity: "1", unitPrice: "" }],
  );

  const update = (key: number, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  const rowTotal = (row: Row) => {
    const price = parseAmountToMinor(row.unitPrice);
    const quantity = Number(row.quantity);
    return price !== null && quantity > 0 ? lineTotalMinor(quantity, price) : 0;
  };
  const total = rows.reduce((sum, row) => sum + rowTotal(row), 0);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          rows
            .filter((row) => row.description.trim() || row.unitPrice.trim())
            .map(({ description, quantity, unitPrice }) => ({
              description,
              quantity,
              unitPrice,
            })),
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="clientId">Client</Label>
          <NativeSelect
            id="clientId"
            name="clientId"
            defaultValue={initial.clientId}
            className="mt-1.5"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <NativeSelect
            id="currency"
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
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

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Line items</legend>
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="border-border grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_90px_140px_120px_auto] sm:items-end sm:border-0 sm:p-0"
            >
              <div>
                <Label
                  htmlFor={`desc-${row.key}`}
                  className={index ? "sm:sr-only" : undefined}
                >
                  Description
                </Label>
                <Input
                  id={`desc-${row.key}`}
                  value={row.description}
                  onChange={(event) =>
                    update(row.key, { description: event.target.value })
                  }
                  maxLength={500}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label
                  htmlFor={`qty-${row.key}`}
                  className={index ? "sm:sr-only" : undefined}
                >
                  Qty
                </Label>
                <Input
                  id={`qty-${row.key}`}
                  inputMode="decimal"
                  value={row.quantity}
                  onChange={(event) => update(row.key, { quantity: event.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label
                  htmlFor={`price-${row.key}`}
                  className={index ? "sm:sr-only" : undefined}
                >
                  Unit price ({currency})
                </Label>
                <Input
                  id={`price-${row.key}`}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={row.unitPrice}
                  onChange={(event) => update(row.key, { unitPrice: event.target.value })}
                  className="mt-1.5"
                />
              </div>
              <p className="text-muted-foreground py-2 text-right text-sm tabular-nums sm:py-1.5">
                {formatMoney(rowTotal(row), currency)}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove line ${index + 1}`}
                onClick={() =>
                  setRows((current) => current.filter((r) => r.key !== row.key))
                }
                disabled={rows.length === 1}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() =>
            setRows((current) => [
              ...current,
              {
                key: Math.max(0, ...current.map((r) => r.key)) + 1,
                description: "",
                quantity: "1",
                unitPrice: "",
              },
            ])
          }
        >
          <Plus /> Add line
        </Button>
      </fieldset>

      <p className="text-right text-lg font-semibold tabular-nums">
        Total {formatMoney(total, currency)}
      </p>

      <div>
        <Label htmlFor="notes">Notes on the invoice (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initial.notes}
          rows={3}
          maxLength={2000}
          className="mt-1.5"
        />
      </div>

      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save draft"}
      </Button>
    </form>
  );
}
