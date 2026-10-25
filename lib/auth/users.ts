import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type AuthUserSummary = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
};

/**
 * Lists auth users (emails live in auth.users, which RLS can't expose).
 * Uses the service role, so callers must have checked super_admin first.
 * Returns null when the service role key isn't configured.
 */
export async function listAuthUsers(): Promise<AuthUserSummary[] | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  return data.users.map((user) => ({
    id: user.id,
    email: user.email ?? "",
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  }));
}
