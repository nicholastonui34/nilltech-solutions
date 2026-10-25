"use client";

import { useActionState } from "react";

import {
  assignTalent,
  createProject,
  saveDeliveryReview,
  type QualityFormState,
} from "@/app/actions/quality";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

const initialState: QualityFormState = {};

function Message({ state }: { state: QualityFormState }) {
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

export function CreateProjectForm({
  clients,
}: {
  clients: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createProject, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          name="name"
          required
          maxLength={200}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="project-client">Client (optional)</Label>
        <NativeSelect
          id="project-client"
          name="clientId"
          defaultValue=""
          className="mt-1.5"
        >
          <option value="">No client linked</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="project-description">Description (optional)</Label>
        <Textarea
          id="project-description"
          name="description"
          rows={2}
          className="mt-1.5"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        New projects start with the standard QA checklist: code review, testing, client
        sign-off.
      </p>
      <Message state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}

export function AssignTalentForm({
  projectId,
  talent,
}: {
  projectId: string;
  talent: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(assignTalent, initialState);
  if (!talent.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No approved talent left to assign. Recruitment approves people into the pool.
      </p>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div>
        <Label htmlFor="assign-talent">Person</Label>
        <NativeSelect
          id="assign-talent"
          name="talentId"
          defaultValue=""
          required
          className="mt-1.5"
        >
          <option value="" disabled>
            Choose from the talent pool
          </option>
          {talent.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="assign-role">Role on this project (optional)</Label>
        <Input id="assign-role" name="roleOnProject" maxLength={100} className="mt-1.5" />
      </div>
      <Message state={state} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Assigning…" : "Assign"}
      </Button>
    </form>
  );
}

export function DeliveryReviewForm({
  projectId,
  talentId,
  existing,
}: {
  projectId: string;
  talentId: string;
  existing: { rating: number; notes: string | null } | null;
}) {
  const [state, formAction, pending] = useActionState(saveDeliveryReview, initialState);
  const idPrefix = `review-${talentId}`;
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="talentId" value={talentId} />
      <div className="flex items-center gap-2">
        <Label htmlFor={`${idPrefix}-rating`} className="text-xs">
          Rating
        </Label>
        <NativeSelect
          id={`${idPrefix}-rating`}
          name="rating"
          defaultValue={existing ? String(existing.rating) : ""}
          className="h-8 w-auto"
        >
          <option value="" disabled>
            1–5
          </option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Label htmlFor={`${idPrefix}-notes`} className="sr-only">
        Review notes
      </Label>
      <Textarea
        id={`${idPrefix}-notes`}
        name="notes"
        rows={2}
        placeholder="What went well, what to improve"
        defaultValue={existing?.notes ?? ""}
      />
      <Message state={state} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Saving…" : existing ? "Update review" : "Save review"}
      </Button>
    </form>
  );
}
