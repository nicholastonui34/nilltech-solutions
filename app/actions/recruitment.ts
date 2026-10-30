"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";

import { founders } from "@/lib/content/founders";
import { getUserWithRole } from "@/lib/auth/dal";
import { CURRENCIES, parseAmountToMinor, type Currency } from "@/lib/finance/money";
import { buildAgreementPdf } from "@/lib/talent/agreement-pdf";
import {
  RATE_BASES,
  buildContract,
  buildNda,
  buildOnboardingLetter,
  type AgreementDocument,
  type RateBasis,
} from "@/lib/talent/agreements";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  countryLabel,
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

// --- Generated documents --------------------------------------------------------
// NDA, freelance services agreement and onboarding letter, drafted from
// lib/talent/agreements.ts with recruitment's inputs, saved as PDFs next to
// uploaded documents. Business terms always come from the form.

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const displayDate = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`));
const todayIso = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());

const text = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "").trim();
const whole = (min: number, max: number, message: string) =>
  z.coerce.number().int(message).min(min, message).max(max, message);

export async function generateTalentDocument(
  _prev: RecruitmentFormState,
  formData: FormData,
): Promise<RecruitmentFormState> {
  const { user, supabase } = await recruitmentContext();
  const id = uuid.safeParse(formData.get("id"));
  const kind = z
    .enum(["nda", "contract", "onboarding_letter"])
    .safeParse(formData.get("kind"));
  if (!id.success) return { error: "Unknown application." };
  if (!kind.success) return { error: "Choose a document." };

  const { data: app } = await supabase
    .from("talent_applications")
    .select("id, full_name, email, phone, country, stage, engagement_type")
    .eq("id", id.data)
    .maybeSingle();
  if (!app) return { error: "Unknown application." };
  if (
    kind.data === "nda" &&
    !["test_task", "test_review", "approved"].includes(app.stage)
  ) {
    return { error: "An NDA can be generated from the test-task stage onwards." };
  }
  if (kind.data !== "nda") {
    if (app.stage !== "approved") return { error: "Approve the applicant first." };
    if (app.engagement_type !== "freelance") {
      return {
        error:
          "These templates are for freelancers. For a full-time hire, upload an employment contract reviewed by your advocate.",
      };
    }
  }

  const signatoryName = text(formData, "signatoryName");
  const signatoryTitle = text(formData, "signatoryTitle");
  if (!founders.some((f) => f.name === signatoryName))
    return { error: "Choose who signs for NillTech." };
  if (signatoryTitle.length < 2 || signatoryTitle.length > 80) {
    return { error: "Enter the signatory's title, for example Director." };
  }

  // Link earlier generated documents (latest NDA and agreement) by reference.
  const { data: earlier } = await supabase
    .from("talent_documents")
    .select("kind, reference, uploaded_at")
    .eq("talent_id", app.id)
    .not("reference", "is", null)
    .order("uploaded_at", { ascending: false });
  const latestRef = (k: string) => earlier?.find((d) => d.kind === k)?.reference ?? null;

  const { data: reference, error: numberError } = await supabase.rpc(
    "next_talent_document_number",
    { _kind: kind.data },
  );
  if (numberError || !reference)
    return { error: numberError?.message ?? "Couldn't number the document." };

  const common = {
    reference,
    date: displayDate(todayIso()),
    freelancer: {
      name: app.full_name,
      email: app.email,
      phone: app.phone,
      country: countryLabel(app.country),
    },
    signatory: { name: signatoryName, title: signatoryTitle },
  };

  let doc: AgreementDocument;
  let params: Record<string, unknown>;
  if (kind.data === "nda") {
    const parsed = z
      .object({
        purpose: z.string().min(10, "Describe the purpose of the NDA.").max(300),
        durationYears: whole(
          1,
          10,
          "The NDA should last 1 to 10 years after the engagement.",
        ),
      })
      .safeParse({
        purpose: text(formData, "purpose"),
        durationYears: text(formData, "durationYears"),
      });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    params = parsed.data;
    doc = buildNda({ ...common, ...parsed.data });
  } else if (kind.data === "contract") {
    const parsed = z
      .object({
        role: z.string().min(2, "Enter the role.").max(100),
        startDate: z.iso.date("Choose the start date."),
        endDate: z.union([z.iso.date(), z.literal("")]),
        scope: z
          .string()
          .min(20, "Describe the services (at least a sentence).")
          .max(2000),
        currency: z.enum(CURRENCIES as [Currency, ...Currency[]]),
        rateBasis: z.enum(RATE_BASES as unknown as [RateBasis, ...RateBasis[]]),
        paymentTermsDays: whole(0, 90, "Payment terms must be 0 to 90 days."),
        noticeDays: whole(1, 180, "Notice must be 1 to 180 days."),
        nonSolicitMonths: whole(0, 24, "Non-solicitation must be 0 to 24 months."),
      })
      .safeParse({
        role: text(formData, "role"),
        startDate: text(formData, "startDate"),
        endDate: text(formData, "endDate"),
        scope: text(formData, "scope"),
        currency: text(formData, "currency"),
        rateBasis: text(formData, "rateBasis"),
        paymentTermsDays: text(formData, "paymentTermsDays"),
        noticeDays: text(formData, "noticeDays"),
        nonSolicitMonths: text(formData, "nonSolicitMonths"),
      });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    const rateMinor = parseAmountToMinor(text(formData, "rate"));
    if (rateMinor === null || rateMinor <= 0) return { error: "Enter the rate." };
    if (parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) {
      return { error: "The end date must be after the start date." };
    }
    params = { ...parsed.data, rateMinor };
    doc = buildContract({
      ...common,
      ...parsed.data,
      startDate: displayDate(parsed.data.startDate),
      endDate: parsed.data.endDate ? displayDate(parsed.data.endDate) : null,
      rateMinor,
      ndaReference: latestRef("nda"),
    });
  } else {
    const parsed = z
      .object({
        role: z.string().min(2, "Enter the role.").max(100),
        startDate: z.iso.date("Choose the start date."),
        contactName: z.string().min(2, "Enter the NillTech contact's name.").max(100),
        contactEmail: z.email("Enter the NillTech contact's email."),
        workingPattern: z.string().max(200),
        tools: z.string().max(300),
        firstWeek: z.string().max(1500),
      })
      .safeParse({
        role: text(formData, "role"),
        startDate: text(formData, "startDate"),
        contactName: text(formData, "contactName"),
        contactEmail: text(formData, "contactEmail"),
        workingPattern: text(formData, "workingPattern"),
        tools: text(formData, "tools"),
        firstWeek: text(formData, "firstWeek"),
      });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };
    params = parsed.data;
    doc = buildOnboardingLetter({
      ...common,
      role: parsed.data.role,
      startDate: displayDate(parsed.data.startDate),
      reportingTo: { name: parsed.data.contactName, email: parsed.data.contactEmail },
      workingPattern: parsed.data.workingPattern || null,
      tools: parsed.data.tools || null,
      firstWeek: parsed.data.firstWeek || null,
      ndaReference: latestRef("nda"),
      contractReference: latestRef("contract"),
    });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY isn't set on this deployment." };

  const bytes = await buildAgreementPdf(doc);
  const path = `${app.id}/${randomUUID()}.pdf`;
  const { error: uploadError } = await admin.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) return { error: uploadError.message };

  const requiresAcceptance =
    kind.data !== "onboarding_letter" || formData.get("requiresAcceptance") === "on";
  const { error } = await supabase.from("talent_documents").insert({
    talent_id: app.id,
    kind: kind.data,
    title: `${doc.shortTitle} (${reference})`,
    storage_path: path,
    file_name: `${reference}.pdf`,
    size_bytes: bytes.byteLength,
    requires_acceptance: requiresAcceptance,
    uploaded_by: user.id,
    reference,
    generated_from: { ...params, signatory: common.signatory },
  });
  if (error) {
    await admin.storage.from(DOCUMENT_BUCKET).remove([path]);
    return { error: error.message };
  }

  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "talent_document_generated",
    entity_type: "talent_applications",
    entity_id: app.id,
    metadata: { reference, kind: kind.data },
  });

  refresh();
  return {
    success: `${doc.shortTitle} ${reference} created and added to their Documents.`,
  };
}
