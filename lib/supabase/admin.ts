import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Service-role Supabase client — bypasses RLS, server-only. Returns null
 * rather than throwing when `SUPABASE_SERVICE_ROLE_KEY` isn't configured
 * yet (the owner still needs to pull it from the dashboard — see
 * CLAUDE.md §17 Phase 1), so callers degrade gracefully instead of
 * crashing the request.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
