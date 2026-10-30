"use client";

import { useActionState, useState } from "react";

import {
  acceptDocument,
  setPayoutDetails,
  submitTestTask,
  updateOwnProfile,
  type FreelancerFormState,
} from "@/app/actions/freelancer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { KENYAN_BANKS, OTHER_BANK } from "@/config/kenyan-banks";
import {
  PAYOUT_METHOD_LABELS,
  PAYOUT_METHODS,
  formatMpesaNumber,
  type PayoutDetails,
  type PayoutMethod,
} from "@/lib/finance/payout";

const initialState: FreelancerFormState = {};

function Message({ state }: { state: FreelancerFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="text-sm text-emerald-700">
        {state.success}
      </p>
    );
  }
  return null;
}

export function ProfileEditForm({
  profile,
}: {
  profile: {
    phone: string | null;
    skills: string[];
    portfolioUrl: string | null;
    profileUrl: string | null;
    availability: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateOwnProfile, initialState);
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="phone">Phone (WhatsApp)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={profile.phone ?? ""}
          maxLength={40}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="availability">Availability</Label>
        <Input
          id="availability"
          name="availability"
          defaultValue={profile.availability ?? ""}
          maxLength={200}
          placeholder="For example: 20 hours a week, from 1 December"
          className="mt-1.5"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="skills">Skills (separate with commas)</Label>
        <Input
          id="skills"
          name="skills"
          defaultValue={profile.skills.join(", ")}
          placeholder="React, Node.js, PostgreSQL"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="portfolioUrl">Portfolio link</Label>
        <Input
          id="portfolioUrl"
          name="portfolioUrl"
          type="url"
          inputMode="url"
          defaultValue={profile.portfolioUrl ?? ""}
          placeholder="https://"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="profileUrl">LinkedIn or GitHub</Label>
        <Input
          id="profileUrl"
          name="profileUrl"
          type="url"
          inputMode="url"
          defaultValue={profile.profileUrl ?? ""}
          placeholder="https://"
          className="mt-1.5"
        />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Message state={state} />
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

export function SubmitTestTaskForm({
  taskId,
  current,
}: {
  taskId: string;
  current: { url: string | null; note: string | null };
}) {
  const [state, formAction, pending] = useActionState(submitTestTask, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="taskId" value={taskId} />
      <div>
        <Label htmlFor={`url-${taskId}`}>Link to your work</Label>
        <Input
          id={`url-${taskId}`}
          name="url"
          type="url"
          inputMode="url"
          required
          defaultValue={current.url ?? ""}
          placeholder="https://github.com/... or a shared Google Drive link"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor={`note-${taskId}`}>Note for the reviewer (optional)</Label>
        <Textarea
          id={`note-${taskId}`}
          name="note"
          rows={3}
          maxLength={2000}
          defaultValue={current.note ?? ""}
          className="mt-1.5"
        />
      </div>
      <Message state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Submitting…" : current.url ? "Update submission" : "Submit task"}
      </Button>
    </form>
  );
}

export function AcceptDocumentForm({
  documentId,
  fullName,
}: {
  documentId: string;
  fullName: string;
}) {
  const [state, formAction, pending] = useActionState(acceptDocument, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="documentId" value={documentId} />
      <Label htmlFor={`name-${documentId}`}>
        I have read this document and accept it. Type your full name ({fullName}) to
        confirm.
      </Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={`name-${documentId}`}
          name="typedName"
          required
          autoComplete="name"
          className="max-w-xs"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Accept"}
        </Button>
      </div>
      <Message state={state} />
    </form>
  );
}

const knownBank = (name: string | null) =>
  name !== null && (KENYAN_BANKS as readonly string[]).includes(name);

export function PayoutDetailsForm({ current }: { current: PayoutDetails | null }) {
  const [state, formAction, pending] = useActionState(setPayoutDetails, initialState);
  const [method, setMethod] = useState<PayoutMethod>(current?.preferredMethod ?? "mpesa");
  const [bank, setBank] = useState<string>(
    current?.bankName ? (knownBank(current.bankName) ? current.bankName : "other") : "",
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-sm font-medium">How would you like to be paid?</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {PAYOUT_METHODS.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="preferredMethod"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="size-4"
              />
              {PAYOUT_METHOD_LABELS[m]}
            </label>
          ))}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          You can fill in both. We pay by your preferred method unless we agree otherwise.
        </p>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">
          M-Pesa {method === "mpesa" ? "(required)" : "(optional)"}
        </legend>
        <div>
          <Label htmlFor="mpesaNumber">M-Pesa number</Label>
          <Input
            id="mpesaNumber"
            name="mpesaNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            defaultValue={
              current?.mpesaNumber ? formatMpesaNumber(current.mpesaNumber) : ""
            }
            required={method === "mpesa"}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="mpesaName">Name registered on M-Pesa</Label>
          <Input
            id="mpesaName"
            name="mpesaName"
            autoComplete="name"
            defaultValue={current?.mpesaName ?? ""}
            maxLength={100}
            required={method === "mpesa"}
            className="mt-1.5"
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium">
          Kenyan bank account {method === "bank_transfer" ? "(required)" : "(optional)"}
        </legend>
        <div>
          <Label htmlFor="bankName">Bank</Label>
          <NativeSelect
            id="bankName"
            name="bankName"
            value={bank}
            onChange={(event) => setBank(event.target.value)}
            required={method === "bank_transfer"}
            className="mt-1.5"
          >
            <option value="">Choose your bank</option>
            {KENYAN_BANKS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="other">{OTHER_BANK}</option>
          </NativeSelect>
        </div>
        {bank === "other" ? (
          <div>
            <Label htmlFor="otherBankName">Bank name</Label>
            <Input
              id="otherBankName"
              name="otherBankName"
              defaultValue={
                knownBank(current?.bankName ?? null) ? "" : (current?.bankName ?? "")
              }
              maxLength={100}
              required
              className="mt-1.5"
            />
          </div>
        ) : null}
        <div>
          <Label htmlFor="bankBranch">Branch (optional)</Label>
          <Input
            id="bankBranch"
            name="bankBranch"
            defaultValue={current?.bankBranch ?? ""}
            maxLength={100}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="bankAccountNumber">Account number</Label>
          <Input
            id="bankAccountNumber"
            name="bankAccountNumber"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={current?.bankAccountNumber ?? ""}
            maxLength={30}
            required={method === "bank_transfer"}
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="bankAccountName">
            Beneficiary name (exactly as on the account)
          </Label>
          <Input
            id="bankAccountName"
            name="bankAccountName"
            defaultValue={current?.bankAccountName ?? ""}
            maxLength={100}
            required={method === "bank_transfer"}
            className="mt-1.5"
          />
        </div>
      </fieldset>

      <p className="text-muted-foreground text-xs">
        Only you and the NillTech finance team can see these details. Check them
        carefully: we pay to exactly what you enter here.
      </p>
      <Message state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save payout details"}
      </Button>
    </form>
  );
}
