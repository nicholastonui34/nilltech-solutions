import type { Database } from "@/lib/supabase/types";

export type ProjectStatus = Database["public"]["Enums"]["project_status"];

export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  "active",
  "in_review",
  "delivered",
  "on_hold",
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  in_review: "In QA review",
  delivered: "Delivered",
  on_hold: "On hold",
};

export type TalentDocumentKind = "contract" | "nda" | "onboarding_letter" | "other";

export const DOCUMENT_KIND_LABELS: Record<TalentDocumentKind, string> = {
  contract: "Contract",
  nda: "NDA",
  onboarding_letter: "Onboarding letter",
  other: "Other",
};

export const documentKindLabel = (kind: string) =>
  DOCUMENT_KIND_LABELS[kind as TalentDocumentKind] ?? kind;
