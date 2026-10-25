"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { getUserWithRole } from "@/lib/auth/dal";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(LEAD_STATUSES as [LeadStatus, ...LeadStatus[]]),
});

/** Moves a lead through the pipeline. RLS limits updates to sales + super_admin. */
export async function updateLeadStatus(formData: FormData) {
  const user = await getUserWithRole(["sales", "super_admin"]);
  if (!user) throw new Error("Not authorized.");

  const parsed = statusSchema.parse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
  });

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");

  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.status })
    .eq("id", parsed.leadId);
  if (error) throw new Error(error.message);

  refresh();
}
