import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { scoreLead, type LeadScoringInput } from "@/lib/leads/scoring";
import type { Json } from "@/lib/supabase/types";

export type CreateLeadInput = LeadScoringInput & {
  source: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

export type CreateLeadResult =
  | { ok: true; id: string; tier: "hot" | "warm" | "cold" }
  | { ok: false; reason: "not_configured" | "insert_failed" };

/**
 * Writes a lead via the service-role client and scores it (CLAUDE.md §9).
 * Hot-lead email/SMS alerts are deferred (§3/§18 — no Resend/Africa's
 * Talking account yet), so this only logs the "would have notified sales"
 * step to automation_runs as skipped, rather than pretending to send.
 */
export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, reason: "not_configured" };
  }

  const { score, tier } = scoreLead(input);

  const { data, error } = await admin
    .from("leads")
    .insert({
      source: input.source,
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      service_interest: input.serviceInterest,
      budget_band: input.budgetBand,
      timeline_urgency: input.timelineUrgency,
      region: input.region,
      message: input.message,
      score,
      tier,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error || !data) {
    await admin.from("automation_runs").insert({
      type: "lead_insert",
      status: "failed",
      payload: { source: input.source },
      error: error?.message,
    });
    return { ok: false, reason: "insert_failed" };
  }

  if (tier === "hot") {
    await admin.from("automation_runs").insert({
      type: "hot_lead_notification",
      status: "skipped_not_configured",
      related_entity_type: "leads",
      related_entity_id: data.id,
      payload: {
        reason: "Resend and Africa's Talking are deferred — see CLAUDE.md §3/§18",
      },
    });
  }

  return { ok: true, id: data.id, tier };
}
