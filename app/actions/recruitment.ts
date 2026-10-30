"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";

import { getUserWithRole } from "@/lib/auth/dal";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  TALENT_STAGES,
  type EngagementType,
  type TalentStage,
} from "@/lib/talent/options";

export type RecruitmentFormState = {
  error?: string;
  success?: string;
  revealedPin?: string;
  account?: { email: string; temporaryPassword: string | null };
};

const RECRUITMENT_ROLES = ["recruitment", "super_admin"] as const;
const uuid = z.string().uuid();

async function recruitmentContext() {
  const user = await getUserWithRole(RECRUITMENT_ROLES);
  if (!user) throw new Error("Not authorized.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase isn't configured.");
  return { user, supabase };
}

const updateSchema = z.object({
  id: uuid,
  stage: z.enum(TALENT_STAGES as [TalentStage, ...TalentStage[]]),
  engagementType: z
    .union([z.enum(["freelance", "full_time"]), z.literal("")])
    .transform((v) => (v || null) as EngagementType | null),
  screeningNotes: z.string().trim().max(4000),
  testTaskNotes: z.string().trim().max(4000),
  rejectionReason: z.string().trim().max(1000),
});

/** Moves an applicant through screening. The DB audit-logs every stage change. */
export async function updateApplication(
  _prev: RecruitmentFormState,
  formData: FormData,
): Promise<RecruitmentFormState> {
  const { user, supabase } = await recruitmentContext();
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    stage: formData.get("stage"),
    engagementType: formData.get("engagementType") ?? "",
    screeningNotes: formData.get("screeningNotes") ?? "",
    testTaskNotes: formData.get("testTaskNotes") ?? "",
    rejectionReason: formData.get("rejectionReason") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  if (d.stage === "approved" && !d.engagementType) {
    return { error: "Choose freelance or full-time before approving." };
  }
  if (d.stage === "rejected" && !d.rejectionReason) {
    return { error: "Add a short reason before marking as not progressed." };
  }

  const { error } = await supabase
    .from("talent_applications")
    .update({
      stage: d.stage,
      engagement_type: d.engagementType,
      screening_notes: d.screeningNotes || null,
      test_task_notes: d.testTaskNotes || null,
      rejection_reason: d.rejectionReason || null,
      updated_by: user.id,
    })
    .eq("id", d.id);
  if (error) return { error: error.message };

  refresh();
  return { success: "Saved." };
}

export async function recordTaxPin(
  _prev: RecruitmentFormState,
  formData: FormData,
): Promise<RecruitmentFormState> {
  const { supabase } = await recruitmentContext();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return { error: "Unknown application." };

  const { error } = await supabase.rpc("set_talent_tax_pin", {
    _application_id: id.data,
    _pin: String(formData.get("pin") ?? ""),
  });
  if (error)
    return {
      error: error.message.charAt(0).toUpperCase() + error.message.slice(1) + ".",
    };

  refresh();
  return { success: "KRA PIN saved (encrypted)." };
}

/** Finance and super admins only (enforced again by the RPC); every view is audit-logged. */
export async function revealTaxPin(
  _prev: RecruitmentFormState,
  formData: FormData,
): Promise<RecruitmentFormState> {
  const user = await getUserWithRole(["finance", "super_admin"]);
  if (!user) return { error: "Only finance or a super admin can view tax PINs." };
  const supabase = await createSupabaseServerClient();
  const id = uuid.safeParse(formData.get("id"));
  if (!supabase || !id.success) return { error: "Unknown application." };

  const { data, error } = await supabase.rpc("get_talent_tax_pin", {
    _application_id: id.data,
  });
  if (error) return { error: error.message };
  return { revealedPin: data ?? "No PIN on file." };
}

/**
 * Gives an applicant a portal login with the `freelancer` role, from the
 * test-task stage onwards (so they can read and submit test tasks),
 * or links an existing account with the same email. Uses the service role
 * (recruiters can't grant roles through RLS), so the audit entry is
 * written explicitly with the recruiter as actor.
 */
export async function createFreelancerAccount(
  _prev: RecruitmentFormState,
  formData: FormData,
): Promise<RecruitmentFormState> {
  const { user, supabase } = await recruitmentContext();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return { error: "Unknown application." };

  const { data: app } = await supabase
    .from("talent_applications")
    .select("id, full_name, email, stage, user_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!app) return { error: "Unknown application." };
  if (!["test_task", "test_review", "approved"].includes(app.stage)) {
    return { error: "Move the applicant to the test task stage first." };
  }
  if (app.user_id) return { error: "This applicant already has a portal account." };

  const admin = getSupabaseAdmin();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY isn't set on this deployment." };

  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listError) return { error: listError.message };
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === app.email.toLowerCase(),
  );

  let userId = existing?.id ?? null;
  let temporaryPassword: string | null = null;
  if (!userId) {
    temporaryPassword = randomBytes(12).toString("base64url");
    const { data: created, error } = await admin.auth.admin.createUser({
      email: app.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: app.full_name },
    });
    if (error || !created.user)
      return { error: error?.message ?? "Couldn't create the account." };
    userId = created.user.id;
  }

  const [{ error: roleError }, { error: linkError }] = await Promise.all([
    admin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "freelancer", granted_by: user.id },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      ),
    admin.from("talent_applications").update({ user_id: userId }).eq("id", app.id),
  ]);
  if (roleError || linkError) return { error: (roleError ?? linkError)!.message };

  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: existing ? "freelancer_account_linked" : "freelancer_account_created",
    entity_type: "talent_applications",
    entity_id: app.id,
    metadata: { email: app.email },
  });

  refresh();
  return { account: { email: app.email, temporaryPassword } };
}

// --- Test tasks ---------------------------------------------------------------
// The brief is shown to the applicant in their portal; they submit a link
// there (submit_test_task). Internal review notes stay in "Test task notes".

export async function createTestTask(
  _prev: RecruitmentFormState,
  formData: FormData,
): Promise<RecruitmentFormState> {
  const { supabase } = await recruitmentContext();
  const parsed = z
    .object({
      id: uuid,
      title: z.string().trim().min(3, "Give the task a short title.").max(200),
      brief: z
        .string()
        .trim()
        .min(10, "Write the brief (at least a sentence).")
        .max(8000),
      dueOn: z.union([z.iso.date(), z.literal("")]),
    })
    .safeParse({
      id: formData.get("id"),
      title: formData.get("title") ?? "",
      brief: formData.get("brief") ?? "",
      dueOn: formData.get("dueOn") ?? "",
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase.from("talent_test_tasks").insert({
    application_id: parsed.data.id,
    title: parsed.data.title,
    brief: parsed.data.brief,
    due_on: parsed.data.dueOn || null,
  });
  if (error) return { error: error.message };

  refresh();
  return { success: "Test task added. The applicant sees it in their portal." };
}

export async function markTestTaskReviewed(formData: FormData) {
  const { user, supabase } = await recruitmentContext();
  const taskId = uuid.parse(formData.get("taskId"));
  const { error } = await supabase
    .from("talent_test_tasks")
    .update({ reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteTestTask(formData: FormData) {
  const { supabase } = await recruitmentContext();
  const taskId = uuid.parse(formData.get("taskId"));
  const { error } = await supabase
    .from("talent_test_tasks")
    .delete()
    .eq("id", taskId)
    .is("submitted_at", null);
  if (error) throw new Error(error.message);
  refresh();
}

// --- Documents ----------------------------------------------------------------
// PDFs in the private "talent-documents" bucket. Only the server touches the
// files (service role); who may see a document is decided by RLS on the
// talent_documents row.

const DOCUMENT_BUCKET = "talent-documents";
const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
const DOCUMENT_KINDS = ["contract", "nda", "onboarding_letter", "other"] as const;

export async function uploadTalentDocument(
  _prev: RecruitmentFormState,
  formData: FormData,
): Promise<RecruitmentFormState> {
  const { user, supabase } = await recruitmentContext();
  const parsed = z
    .object({
      id: uuid,
      kind: z.enum(DOCUMENT_KINDS),
      title: z.string().trim().min(3, "Give the document a title.").max(200),
    })
    .safeParse({
      id: formData.get("id"),
      kind: formData.get("kind"),
      title: formData.get("title") ?? "",
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF file." };
  if (file.size > MAX_DOCUMENT_BYTES) return { error: "The file is over 4 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Check the PDF signature, not just the name or the browser's claim.
  if (String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") {
    return { error: "Only PDF files can be uploaded." };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY isn't set on this deployment." };

  const path = `${parsed.data.id}/${randomUUID()}.pdf`;
  const { error: uploadError } = await admin.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("talent_documents").insert({
    talent_id: parsed.data.id,
    kind: parsed.data.kind,
    title: parsed.data.title,
    storage_path: path,
    file_name: file.name.slice(0, 200) || "document.pdf",
    size_bytes: file.size,
    requires_acceptance: formData.get("requiresAcceptance") === "on",
    uploaded_by: user.id,
  });
  if (error) {
    await admin.storage.from(DOCUMENT_BUCKET).remove([path]);
    return { error: error.message };
  }

  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "talent_document_uploaded",
    entity_type: "talent_applications",
    entity_id: parsed.data.id,
    metadata: { title: parsed.data.title, kind: parsed.data.kind },
  });

  refresh();
  return { success: "Uploaded. It's now in the freelancer's portal." };
}

export async function deleteTalentDocument(formData: FormData) {
  const { supabase } = await recruitmentContext();
  const documentId = uuid.parse(formData.get("documentId"));
  // RLS only allows deleting documents that haven't been accepted.
  const { data, error } = await supabase
    .from("talent_documents")
    .delete()
    .eq("id", documentId)
    .select("storage_path");
  if (error) throw new Error(error.message);
  const admin = getSupabaseAdmin();
  if (admin && data?.length) {
    await admin.storage.from(DOCUMENT_BUCKET).remove(data.map((d) => d.storage_path));
  }
  refresh();
}
