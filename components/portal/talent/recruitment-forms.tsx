"use client";

import { useActionState, useState } from "react";

import {
  createFreelancerAccount,
  createTestTask,
  generateTalentDocument,
  recordTaxPin,
  revealTaxPin,
  updateApplication,
  uploadTalentDocument,
  type RecruitmentFormState,
} from "@/app/actions/recruitment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES } from "@/lib/finance/money";
import { RATE_BASES, RATE_BASIS_LABELS } from "@/lib/talent/agreements";
import { DOCUMENT_KIND_LABELS, type TalentDocumentKind } from "@/lib/talent/labels";
import {
  ENGAGEMENT_TYPE_LABELS,
  STAGE_LABELS,
  TALENT_STAGES,
  type EngagementType,
  type TalentStage,
} from "@/lib/talent/options";

const initialState: RecruitmentFormState = {};

function Message({ state }: { state: RecruitmentFormState }) {
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

export function ApplicationStageForm({
  application,
}: {
  application: {
    id: string;
    stage: TalentStage;
    engagementType: EngagementType | null;
    screeningNotes: string | null;
    testTaskNotes: string | null;
    rejectionReason: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateApplication, initialState);
  const [stage, setStage] = useState<TalentStage>(application.stage);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={application.id} />
      <div>
        <Label htmlFor="stage">Stage</Label>
        <NativeSelect
          id="stage"
          name="stage"
          value={stage}
          onChange={(event) => setStage(event.target.value as TalentStage)}
          className="mt-1.5"
        >
          {TALENT_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div>
        <Label htmlFor="screeningNotes">Screening notes</Label>
        <Textarea
          id="screeningNotes"
          name="screeningNotes"
          rows={3}
          defaultValue={application.screeningNotes ?? ""}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="testTaskNotes">
          Test task (what was sent, link, due date, result)
        </Label>
        <Textarea
          id="testTaskNotes"
          name="testTaskNotes"
          rows={3}
          defaultValue={application.testTaskNotes ?? ""}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="engagementType">
          Engagement{" "}
          {stage === "approved" ? "(required to approve)" : "(set when approving)"}
        </Label>
        <NativeSelect
          id="engagementType"
          name="engagementType"
          defaultValue={application.engagementType ?? ""}
          className="mt-1.5"
        >
          <option value="">Not decided</option>
          {(Object.keys(ENGAGEMENT_TYPE_LABELS) as EngagementType[]).map((type) => (
            <option key={type} value={type}>
              {ENGAGEMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </NativeSelect>
      </div>

      {stage === "rejected" ? (
        <div>
          <Label htmlFor="rejectionReason">Reason (internal)</Label>
          <Input
            id="rejectionReason"
            name="rejectionReason"
            defaultValue={application.rejectionReason ?? ""}
            className="mt-1.5"
          />
        </div>
      ) : (
        <input
          type="hidden"
          name="rejectionReason"
          value={application.rejectionReason ?? ""}
        />
      )}

      <Message state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

export function TaxPinForm({ id, hasPin }: { id: string; hasPin: boolean }) {
  const [state, formAction, pending] = useActionState(recordTaxPin, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <Label htmlFor="pin">{hasPin ? "Replace KRA PIN" : "KRA PIN"}</Label>
        <Input
          id="pin"
          name="pin"
          placeholder="A123456789B"
          autoComplete="off"
          required
          className="mt-1.5 uppercase"
        />
      </div>
      <Message state={state} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Saving…" : "Save PIN"}
      </Button>
    </form>
  );
}

export function RevealTaxPinForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(revealTaxPin, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      {state.revealedPin ? (
        <code className="bg-muted rounded px-2 py-1 font-mono text-sm">
          {state.revealedPin}
        </code>
      ) : null}
      <Message state={state} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Loading…" : "View PIN (logged)"}
      </Button>
    </form>
  );
}

export function FreelancerAccountForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    createFreelancerAccount,
    initialState,
  );
  if (state.account) {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"
      >
        <p className="font-medium">Portal access ready for {state.account.email}</p>
        {state.account.temporaryPassword ? (
          <>
            <p className="mt-2">Temporary password (shown once):</p>
            <code className="mt-1 block rounded bg-white px-2 py-1 font-mono break-all select-all">
              {state.account.temporaryPassword}
            </code>
            <p className="mt-2 text-xs">
              Share it privately; they change it after signing in.
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs">
            Linked their existing account and added the Freelancer role.
          </p>
        )}
      </div>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <p className="text-muted-foreground text-xs">
        Creates a portal login (Freelancer role) so they can read and submit test tasks,
        update their details, and later see projects, payments and documents.
      </p>
      <Message state={state} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Creating…" : "Give portal access"}
      </Button>
    </form>
  );
}

export function CreateTestTaskForm({ id, minDate }: { id: string; minDate: string }) {
  const [state, formAction, pending] = useActionState(createTestTask, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          name="title"
          required
          maxLength={200}
          placeholder="For example: Build a booking form"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="task-brief">Brief (the applicant sees this)</Label>
        <Textarea
          id="task-brief"
          name="brief"
          required
          rows={6}
          maxLength={8000}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="task-due">Due date (optional)</Label>
        <Input id="task-due" name="dueOn" type="date" min={minDate} className="mt-1.5" />
      </div>
      <Message state={state} />
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Adding…" : "Add test task"}
      </Button>
    </form>
  );
}

export function UploadDocumentForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(uploadTalentDocument, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <Label htmlFor="doc-kind">Type</Label>
        <NativeSelect
          id="doc-kind"
          name="kind"
          defaultValue="contract"
          className="mt-1.5"
        >
          {(Object.keys(DOCUMENT_KIND_LABELS) as TalentDocumentKind[]).map((kind) => (
            <option key={kind} value={kind}>
              {DOCUMENT_KIND_LABELS[kind]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="doc-title">Title</Label>
        <Input
          id="doc-title"
          name="title"
          required
          maxLength={200}
          placeholder="For example: Freelance services agreement"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="doc-file">PDF file (up to 4 MB)</Label>
        <Input
          id="doc-file"
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          className="mt-1.5"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="requiresAcceptance" className="size-4" />
        They must accept it (they type their name to confirm)
      </label>
      <Message state={state} />
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Uploading…" : "Upload document"}
      </Button>
    </form>
  );
}

type GenerateKind = "nda" | "contract" | "onboarding_letter";

const GENERATE_LABELS: Record<GenerateKind, string> = {
  nda: "Non-disclosure agreement",
  contract: "Freelance services agreement",
  onboarding_letter: "Onboarding letter",
};

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function GenerateDocumentForm({
  id,
  kinds,
  signatories,
  defaults,
  reviewed,
}: {
  id: string;
  /** Which documents this applicant can get now (by stage and engagement). */
  kinds: GenerateKind[];
  signatories: string[];
  defaults: { role: string; today: string; contactName: string; contactEmail: string };
  reviewed: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    generateTalentDocument,
    initialState,
  );
  const [kind, setKind] = useState<GenerateKind>(kinds[0] ?? "nda");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      {!reviewed ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          These templates were drafted by Claude and haven&rsquo;t been reviewed by an
          advocate yet. Use them knowing that, and have them reviewed soon.
        </p>
      ) : null}
      <Field id="gen-kind" label="Document">
        <NativeSelect
          id="gen-kind"
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as GenerateKind)}
        >
          {kinds.map((k) => (
            <option key={k} value={k}>
              {GENERATE_LABELS[k]}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="gen-signatory" label="Signs for NillTech">
          <NativeSelect
            id="gen-signatory"
            name="signatoryName"
            defaultValue={signatories[0]}
          >
            {signatories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="gen-title" label="Their title">
          <Input
            id="gen-title"
            name="signatoryTitle"
            defaultValue="Director"
            required
            maxLength={80}
          />
        </Field>
      </div>

      {kind === "nda" ? (
        <>
          <Field id="gen-purpose" label="Purpose (completes: in connection with...)">
            <Input
              id="gen-purpose"
              name="purpose"
              required
              maxLength={300}
              defaultValue="providing technology delivery services to NillTech Solutions Ltd and its clients"
            />
          </Field>
          <Field id="gen-years" label="Years it lasts after the engagement ends">
            <Input
              id="gen-years"
              name="durationYears"
              type="number"
              min={1}
              max={10}
              defaultValue={2}
              required
            />
          </Field>
        </>
      ) : null}

      {kind === "contract" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="gen-role" label="Role">
              <Input
                id="gen-role"
                name="role"
                defaultValue={defaults.role}
                required
                maxLength={100}
              />
            </Field>
            <Field id="gen-start" label="Start date">
              <Input
                id="gen-start"
                name="startDate"
                type="date"
                defaultValue={defaults.today}
                required
              />
            </Field>
            <Field id="gen-end" label="End date (optional)">
              <Input id="gen-end" name="endDate" type="date" />
            </Field>
          </div>
          <Field id="gen-scope" label="Services (what they'll do)">
            <Textarea
              id="gen-scope"
              name="scope"
              rows={4}
              required
              maxLength={2000}
              placeholder="For example: Building and maintaining web front ends for NillTech client projects, as assigned in the NillTech portal."
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="gen-rate" label="Rate">
              <Input
                id="gen-rate"
                name="rate"
                inputMode="decimal"
                required
                placeholder="0.00"
              />
            </Field>
            <Field id="gen-currency" label="Currency">
              <NativeSelect id="gen-currency" name="currency" defaultValue="KES">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="gen-basis" label="Basis">
              <NativeSelect id="gen-basis" name="rateBasis" defaultValue="hour">
                {RATE_BASES.map((b) => (
                  <option key={b} value={b}>
                    {RATE_BASIS_LABELS[b]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="gen-pay" label="Pay within (days)">
              <Input
                id="gen-pay"
                name="paymentTermsDays"
                type="number"
                min={0}
                max={90}
                required
              />
            </Field>
            <Field id="gen-notice" label="Notice (days)">
              <Input
                id="gen-notice"
                name="noticeDays"
                type="number"
                min={1}
                max={180}
                required
              />
            </Field>
            <Field id="gen-nonsolicit" label="Non-solicit (months, 0 = none)">
              <Input
                id="gen-nonsolicit"
                name="nonSolicitMonths"
                type="number"
                min={0}
                max={24}
                required
              />
            </Field>
          </div>
        </>
      ) : null}

      {kind === "onboarding_letter" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="gen-role-l" label="Role">
              <Input
                id="gen-role-l"
                name="role"
                defaultValue={defaults.role}
                required
                maxLength={100}
              />
            </Field>
            <Field id="gen-start-l" label="Start date">
              <Input
                id="gen-start-l"
                name="startDate"
                type="date"
                defaultValue={defaults.today}
                required
              />
            </Field>
            <Field id="gen-contact" label="Their NillTech contact">
              <Input
                id="gen-contact"
                name="contactName"
                defaultValue={defaults.contactName}
                required
              />
            </Field>
            <Field id="gen-contact-email" label="Contact's email">
              <Input
                id="gen-contact-email"
                name="contactEmail"
                type="email"
                defaultValue={defaults.contactEmail}
                required
              />
            </Field>
          </div>
          <Field id="gen-pattern" label="Working pattern (optional)">
            <Input
              id="gen-pattern"
              name="workingPattern"
              maxLength={200}
              placeholder="For example: about 20 hours a week, overlapping 10:00 to 15:00 Nairobi time"
            />
          </Field>
          <Field id="gen-tools" label="Tools and channels (optional)">
            <Input id="gen-tools" name="tools" maxLength={300} />
          </Field>
          <Field id="gen-week" label="First week (optional)">
            <Textarea id="gen-week" name="firstWeek" rows={3} maxLength={1500} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="requiresAcceptance" className="size-4" />
            Ask them to confirm they&rsquo;ve read it
          </label>
        </>
      ) : null}

      <p className="text-muted-foreground text-xs">
        Creates a numbered PDF in NillTech&rsquo;s document style and adds it to their
        Documents tab.{" "}
        {kind === "onboarding_letter"
          ? "It links any NDA and agreement already generated for them."
          : "Agreements must be accepted: they type their full name to confirm."}
      </p>
      <Message state={state} />
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Creating…" : `Create ${GENERATE_LABELS[kind].toLowerCase()}`}
      </Button>
    </form>
  );
}
