"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { getUserWithRole } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// The freelancer's own changes. Each RPC checks that the row belongs to the
// signed-in user and writes the audit log, so these only validate input.

export type FreelancerFormState = { error?: string; success?: string };

async function freelancerClient() {
  const user = await getUserWithRole(["freelancer"]);
  if (!user) throw new Error("Not authorized.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");
  return supabase;
}

function dbMessage(error: { message: string }) {
  return error.message.charAt(0).toUpperCase() + error.message.slice(1) + ".";
}

const field = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "").trim();

export async function updateOwnProfile(
  _prev: FreelancerFormState,
  formData: FormData,
): Promise<FreelancerFormState> {
  const supabase = await freelancerClient();
  const skills = field(formData, "skills")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase.rpc("update_own_talent_profile", {
    _phone: field(formData, "phone"),
    _skills: skills,
    _portfolio_url: field(formData, "portfolioUrl"),
    _profile_url: field(formData, "profileUrl"),
    _availability: field(formData, "availability"),
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Profile saved." };
}

export async function submitTestTask(
  _prev: FreelancerFormState,
  formData: FormData,
): Promise<FreelancerFormState> {
  const supabase = await freelancerClient();
  const taskId = z.string().uuid().safeParse(formData.get("taskId"));
  if (!taskId.success) return { error: "Unknown task." };

  const { error } = await supabase.rpc("submit_test_task", {
    _task_id: taskId.data,
    _url: field(formData, "url"),
    _note: field(formData, "note"),
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Submitted. The recruitment team will review it." };
}

export async function acceptDocument(
  _prev: FreelancerFormState,
  formData: FormData,
): Promise<FreelancerFormState> {
  const supabase = await freelancerClient();
  const documentId = z.string().uuid().safeParse(formData.get("documentId"));
  if (!documentId.success) return { error: "Unknown document." };

  const { error } = await supabase.rpc("accept_talent_document", {
    _document_id: documentId.data,
    _typed_name: field(formData, "typedName"),
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Accepted." };
}

export async function setPayoutDetails(
  _prev: FreelancerFormState,
  formData: FormData,
): Promise<FreelancerFormState> {
  const supabase = await freelancerClient();
  const method = z
    .enum(["mpesa", "bank_transfer"])
    .safeParse(formData.get("preferredMethod"));
  if (!method.success) return { error: "Choose M-Pesa or bank transfer." };

  const bankChoice = field(formData, "bankName");
  const bankName = bankChoice === "other" ? field(formData, "otherBankName") : bankChoice;

  const { error } = await supabase.rpc("set_own_payout_details", {
    _preferred_method: method.data,
    _mpesa_number: field(formData, "mpesaNumber"),
    _mpesa_name: field(formData, "mpesaName"),
    _bank_name: bankName,
    _bank_branch: field(formData, "bankBranch"),
    _bank_account_number: field(formData, "bankAccountNumber"),
    _bank_account_name: field(formData, "bankAccountName"),
  });
  if (error) return { error: dbMessage(error) };

  refresh();
  return { success: "Payout details saved." };
}
