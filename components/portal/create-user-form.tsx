"use client";

import { useActionState } from "react";

import { createUser, type CreateUserState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ALL_ROLES, ROLE_LABELS } from "@/config/portal";

const initialState: CreateUserState = {};

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <div className="flex flex-col gap-4">
      {state.created ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          <p className="font-medium">Account created for {state.created.email}</p>
          <p className="mt-2">Temporary password (shown once):</p>
          <code className="mt-1 block rounded bg-white px-2 py-1 font-mono text-sm break-all select-all">
            {state.created.temporaryPassword}
          </code>
          <p className="mt-2 text-xs">
            Share it privately, not over email. They should change it under &ldquo;Your
            account&rdquo; after signing in.
          </p>
        </div>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="new-user-name">Full name</Label>
          <Input id="new-user-name" name="fullName" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="new-user-email">Email</Label>
          <Input
            id="new-user-email"
            name="email"
            type="email"
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="new-user-role">Initial role (optional)</Label>
          <NativeSelect id="new-user-role" name="role" defaultValue="" className="mt-1.5">
            <option value="">No role yet</option>
            {ALL_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </NativeSelect>
        </div>
        {state.error ? (
          <p role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
