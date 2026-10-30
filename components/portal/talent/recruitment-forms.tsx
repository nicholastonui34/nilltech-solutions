"use client";

import { useActionState, useState } from "react";

import {
  createFreelancerAccount,
  createTestTask,
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
