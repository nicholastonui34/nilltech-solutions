"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";

import { ALL_ROLES, type AppRole } from "@/config/portal";
import { getUserWithRole } from "@/lib/auth/dal";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Every action re-checks super_admin itself rather than trusting that the
// page which rendered the form already did. RLS on user_roles enforces the
// same rule in the database, and its trigger writes the audit log entry.

const roleSchema = z.enum(ALL_ROLES as [AppRole, ...AppRole[]]);

const roleChangeSchema = z.object({
  userId: z.string().uuid(),
  role: roleSchema,
});

async function requireSuperAdmin() {
  const user = await getUserWithRole(["super_admin"]);
  if (!user) throw new Error("Not authorized.");
  return user;
}

export async function grantRole(formData: FormData) {
  const actor = await requireSuperAdmin();
  const parsed = roleChangeSchema.parse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");

  const { error } = await supabase
    .from("user_roles")
    .upsert(
      { user_id: parsed.userId, role: parsed.role, granted_by: actor.id },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);

  refresh();
}

export async function revokeRole(formData: FormData) {
  const actor = await requireSuperAdmin();
  const parsed = roleChangeSchema.parse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  // Never let a super admin remove their own super_admin role — that's
  // the one change that can lock everyone out of role assignment.
  if (parsed.userId === actor.id && parsed.role === "super_admin") {
    throw new Error("You can't remove your own super admin role.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");

  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", parsed.userId)
    .eq("role", parsed.role);
  if (error) throw new Error(error.message);

  refresh();
}

export type CreateUserState = {
  error?: string;
  created?: { email: string; temporaryPassword: string };
};

const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  fullName: z.string().trim().min(2, "Enter their name."),
  role: z.union([roleSchema, z.literal("")]),
});

/**
 * Creates an account with a one-time temporary password, shown to the
 * admin once to share privately. There's no invite email yet: Resend is
 * deferred (CLAUDE.md §8), and Supabase's built-in mailer only delivers to
 * the project's own team members.
 */
export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const actor = await requireSuperAdmin();

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const admin = getSupabaseAdmin();
  const supabase = await createSupabaseServerClient();
  if (!admin || !supabase) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY isn't set on this deployment." };
  }

  const temporaryPassword = randomBytes(12).toString("base64url");

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });
  if (error || !data.user) {
    return { error: error?.message ?? "Couldn't create that account." };
  }

  await admin.from("audit_log").insert({
    actor_id: actor.id,
    action: "user_created",
    entity_type: "auth.users",
    entity_id: data.user.id,
    metadata: { email: parsed.data.email },
  });

  if (parsed.data.role) {
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: data.user.id,
      role: parsed.data.role,
      granted_by: actor.id,
    });
    if (roleError) {
      return {
        error: `Account created, but assigning the role failed: ${roleError.message}`,
        created: { email: parsed.data.email, temporaryPassword },
      };
    }
  }

  refresh();
  return { created: { email: parsed.data.email, temporaryPassword } };
}

// --- Shareholders ------------------------------------------------------------
// The share register (owner, 2026-10-29). RLS limits writes to super_admin
// and a trigger audit-logs every change; ownership % is always derived
// from share counts, never stored.

const shareholderSchema = z.object({
  name: z.string().trim().min(1, "Enter the shareholder's name.").max(200),
  shares: z.coerce.number().int().positive("Shares must be a whole number above zero."),
  holderType: z.enum(["director", "investor"]),
  ownershipPercent: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .refine(
      (v) => v === null || (Number.isFinite(v) && v > 0 && v <= 100),
      "Registered % must be between 0 and 100.",
    ),
  userId: z
    .string()
    .transform((v) => v || null)
    .refine(
      (v) => v === null || z.string().uuid().safeParse(v).success,
      "Unknown login.",
    ),
});

function shareholderFields(formData: FormData) {
  return shareholderSchema.parse({
    name: formData.get("name") ?? "",
    shares: formData.get("shares") ?? "",
    holderType: formData.get("holderType") ?? "",
    ownershipPercent: formData.get("ownershipPercent") ?? "",
    userId: formData.get("userId") ?? "",
  });
}

async function shareholderClient() {
  await requireSuperAdmin();
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");
  return supabase;
}

export async function addShareholder(formData: FormData) {
  const supabase = await shareholderClient();
  const fields = shareholderFields(formData);
  const { error } = await supabase.from("shareholders").insert({
    name: fields.name,
    shares: fields.shares,
    holder_type: fields.holderType,
    ownership_percent: fields.ownershipPercent,
    user_id: fields.userId,
  });
  if (error) {
    throw new Error(
      error.code === "23505"
        ? "That login is already linked to another shareholder."
        : error.message,
    );
  }
  refresh();
}

export async function updateShareholder(formData: FormData) {
  const supabase = await shareholderClient();
  const id = z.string().uuid().parse(formData.get("shareholderId"));
  const fields = shareholderFields(formData);
  const { error } = await supabase
    .from("shareholders")
    .update({
      name: fields.name,
      shares: fields.shares,
      holder_type: fields.holderType,
      ownership_percent: fields.ownershipPercent,
      user_id: fields.userId,
    })
    .eq("id", id);
  if (error) {
    throw new Error(
      error.code === "23505"
        ? "That login is already linked to another shareholder."
        : error.message,
    );
  }
  refresh();
}

export async function deleteShareholder(formData: FormData) {
  const supabase = await shareholderClient();
  const id = z.string().uuid().parse(formData.get("shareholderId"));
  const { error } = await supabase.from("shareholders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
