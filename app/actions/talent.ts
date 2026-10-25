"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SUBMIT_ERROR_MESSAGE } from "@/lib/leads/schema";
import { talentApplicationSchema } from "@/lib/talent/schema";
import { TURNSTILE_FAILED_MESSAGE, verifyTurnstile } from "@/lib/turnstile";

export type TalentSubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Public "Join as freelancer" form (CLAUDE.md §9, §13). Writes through the
 * service role — there is no insert policy for anon on talent_applications.
 * The applicant acknowledgement email is deferred with Resend (§8), so the
 * would-be send is logged as skipped rather than pretended.
 */
export async function submitTalentApplication(
  input: unknown,
): Promise<TalentSubmitResult> {
  const parsed = talentApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }
  const data = parsed.data;
  if (data.website) return { ok: false, error: SUBMIT_ERROR_MESSAGE }; // honeypot
  if (!(await verifyTurnstile(data.turnstileToken))) {
    return { ok: false, error: TURNSTILE_FAILED_MESSAGE };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: SUBMIT_ERROR_MESSAGE };

  const { data: row, error } = await admin
    .from("talent_applications")
    .insert({
      full_name: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      country: data.country,
      primary_role: data.primaryRole,
      skills: data.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 20),
      years_experience: data.yearsExperience,
      engagement_preference: data.engagementPreference,
      portfolio_url: data.portfolioUrl || null,
      profile_url: data.profileUrl || null,
      availability: data.availability || null,
      message: data.message || null,
      consent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !row) {
    await admin.from("automation_runs").insert({
      type: "talent_application_insert",
      status: "failed",
      error: error?.message ?? "no row returned",
    });
    return { ok: false, error: SUBMIT_ERROR_MESSAGE };
  }

  await admin.from("automation_runs").insert({
    type: "talent_application_ack_email",
    status: "skipped_not_configured",
    related_entity_type: "talent_applications",
    related_entity_id: row.id,
  });

  return { ok: true };
}
