"use client";

import { useActionState, useState } from "react";

import {
  createFreelancerAccount,
  recordTaxPin,
  revealTaxPin,
  updateApplication,
  type RecruitmentFormState,
} from "@/app/actions/recruitment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
        Creates a portal login (Freelancer role) so they can see their status and
        assignments.
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
