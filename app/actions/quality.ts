"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getUserWithRole } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

export type QualityFormState = { error?: string; success?: string };

const PROJECT_STATUSES: readonly ProjectStatus[] = [
  "active",
  "in_review",
  "delivered",
  "on_hold",
];
const uuid = z.string().uuid();

async function qualityContext() {
  const user = await getUserWithRole(["quality", "super_admin"]);
  if (!user) throw new Error("Not authorized.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");
  return { user, supabase };
}

export async function createProject(
  _prev: QualityFormState,
  formData: FormData,
): Promise<QualityFormState> {
  const { user, supabase } = await qualityContext();
  const name = String(formData.get("name") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "");
  if (name.length < 1 || name.length > 200) return { error: "Enter a project name." };
  if (clientId && !uuid.safeParse(clientId).success) return { error: "Unknown client." };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      client_id: clientId || null,
      description:
        String(formData.get("description") ?? "")
          .trim()
          .slice(0, 2000) || null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  redirect(`/portal/quality/${data.id}`);
}

export async function updateProjectStatus(formData: FormData) {
  const { supabase } = await qualityContext();
  const id = uuid.parse(formData.get("projectId"));
  const status = z
    .enum(PROJECT_STATUSES as [ProjectStatus, ...ProjectStatus[]])
    .parse(formData.get("status"));
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function toggleChecklistItem(formData: FormData) {
  const { user, supabase } = await qualityContext();
  const id = uuid.parse(formData.get("itemId"));
  const done = formData.get("done") === "true";
  const { error } = await supabase
    .from("qa_checklist_items")
    .update({
      done,
      done_at: done ? new Date().toISOString() : null,
      done_by: done ? user.id : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function addChecklistItem(formData: FormData) {
  const { supabase } = await qualityContext();
  const projectId = uuid.parse(formData.get("projectId"));
  const label = z.string().trim().min(1).max(200).parse(formData.get("label"));
  const { count } = await supabase
    .from("qa_checklist_items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  const { error } = await supabase
    .from("qa_checklist_items")
    .insert({ project_id: projectId, label, position: count ?? 0 });
  if (error) throw new Error(error.message);
  refresh();
}

export async function assignTalent(
  _prev: QualityFormState,
  formData: FormData,
): Promise<QualityFormState> {
  const { user, supabase } = await qualityContext();
  const projectId = uuid.safeParse(formData.get("projectId"));
  const talentId = uuid.safeParse(formData.get("talentId"));
  if (!projectId.success || !talentId.success)
    return { error: "Choose someone to assign." };

  const { error } = await supabase.from("project_assignments").insert({
    project_id: projectId.data,
    talent_id: talentId.data,
    role_on_project:
      String(formData.get("roleOnProject") ?? "")
        .trim()
        .slice(0, 100) || null,
    assigned_by: user.id,
  });
  if (error) {
    return {
      error: error.code === "23505" ? "Already assigned to this project." : error.message,
    };
  }
  refresh();
  return { success: "Assigned." };
}

export async function unassignTalent(formData: FormData) {
  const { supabase } = await qualityContext();
  const projectId = uuid.parse(formData.get("projectId"));
  const talentId = uuid.parse(formData.get("talentId"));
  const { error } = await supabase
    .from("project_assignments")
    .delete()
    .eq("project_id", projectId)
    .eq("talent_id", talentId);
  if (error) throw new Error(error.message);
  refresh();
}

export async function saveDeliveryReview(
  _prev: QualityFormState,
  formData: FormData,
): Promise<QualityFormState> {
  const { user, supabase } = await qualityContext();
  const projectId = uuid.safeParse(formData.get("projectId"));
  const talentId = uuid.safeParse(formData.get("talentId"));
  const rating = z.coerce.number().int().min(1).max(5).safeParse(formData.get("rating"));
  if (!projectId.success || !talentId.success) return { error: "Unknown assignment." };
  if (!rating.success) return { error: "Choose a rating from 1 to 5." };

  const { error } = await supabase.from("delivery_reviews").upsert(
    {
      project_id: projectId.data,
      talent_id: talentId.data,
      rating: rating.data,
      notes:
        String(formData.get("notes") ?? "")
          .trim()
          .slice(0, 2000) || null,
      reviewed_by: user.id,
    },
    { onConflict: "project_id,talent_id" },
  );
  if (error) return { error: error.message };
  refresh();
  return { success: "Review saved." };
}
