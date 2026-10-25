import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { canAccess, type AppRole } from "@/config/portal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PortalUser = {
  id: string;
  email: string;
  fullName: string | null;
  roles: AppRole[];
};

/**
 * Data Access Layer for the portal: the one place that reads the session.
 * `getUser()` revalidates the token with Supabase Auth rather than trusting
 * the cookie. Deduplicated per request with React `cache`.
 */
export const getCurrentUser = cache(async (): Promise<PortalUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    roles: (roleRows ?? []).map((row) => row.role),
  };
});

/** Redirects to login when signed out. */
export async function requireUser(): Promise<PortalUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");
  return user;
}

/**
 * Returns the user when they hold one of `roles`, otherwise null so the
 * page can render a "no access" state. Redirects to login when signed out.
 */
export async function getUserWithRole(roles: readonly AppRole[]) {
  const user = await requireUser();
  return canAccess(user.roles, roles) ? user : null;
}
