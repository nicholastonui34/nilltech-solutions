"use client";

import { useActionState } from "react";

import {
  acceptDocument,
  submitTestTask,
  updateOwnProfile,
  type FreelancerFormState,
} from "@/app/actions/freelancer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
