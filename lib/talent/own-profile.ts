import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** The signed-in freelancer's own application row (RLS returns only theirs). */
export async function getOwnTalentProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, profile: null };
  const { data: profile } = await supabase
    .from("talent_applications")
    .select(
      "id, full_name, email, phone, country, primary_role, skills, portfolio_url, profile_url, availability, stage, engagement_type, verification_status, tax_pin_recorded_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return { supabase, profile };
}
