import type { Database } from "@/lib/supabase/types";

export type TalentStage = Database["public"]["Enums"]["talent_stage"];
export type EngagementType = Database["public"]["Enums"]["engagement_type"];

/**
 * Hiring is limited to East Africa (owner, 2026-10-25): the EAC member
 * states. The database enforces the same list with a CHECK constraint
 * (talent_applications.country) — change both together.
 */
export const EAC_COUNTRIES = [
  { code: "KE", label: "Kenya" },
  { code: "UG", label: "Uganda" },
  { code: "TZ", label: "Tanzania" },
  { code: "RW", label: "Rwanda" },
  { code: "BI", label: "Burundi" },
  { code: "SS", label: "South Sudan" },
  { code: "CD", label: "DR Congo" },
  { code: "SO", label: "Somalia" },
] as const;

export type CountryCode = (typeof EAC_COUNTRIES)[number]["code"];

/** Roles NillTech hires for (owner, 2026-10-25). Mirrors the DB CHECK on primary_role. */
export const TALENT_ROLES = [
  { value: "frontend", label: "Frontend developer" },
  { value: "backend", label: "Backend developer" },
  { value: "mobile", label: "Mobile developer" },
  { value: "ui_ux", label: "UI/UX designer" },
  { value: "qa", label: "QA engineer" },
  { value: "devops", label: "DevOps engineer" },
  { value: "ai_ml", label: "AI/ML engineer" },
  { value: "project_manager", label: "Project manager" },
] as const;

export type TalentRole = (typeof TALENT_ROLES)[number]["value"];

export const ENGAGEMENT_PREFERENCES = [
  { value: "freelance", label: "Freelance / contract" },
  { value: "full_time", label: "Full-time" },
  { value: "either", label: "Either" },
] as const;

export type EngagementPreference = (typeof ENGAGEMENT_PREFERENCES)[number]["value"];

export const ENGAGEMENT_TYPE_LABELS: Record<EngagementType, string> = {
  freelance: "Freelance",
  full_time: "Full-time",
};

export const TALENT_STAGES: readonly TalentStage[] = [
  "applied",
  "screening",
  "test_task",
  "test_review",
  "approved",
  "rejected",
];

export const STAGE_LABELS: Record<TalentStage, string> = {
  applied: "Applied",
  screening: "Screening",
  test_task: "Test task sent",
  test_review: "Test under review",
  approved: "Approved, in talent pool",
  rejected: "Not progressed",
};

const lookup = (entries: readonly (readonly [string, string])[]) => {
  const map = new Map(entries);
  return (value: string | null) => (value ? (map.get(value) ?? value) : "n/a");
};

export const countryLabel = lookup(EAC_COUNTRIES.map((c) => [c.code, c.label] as const));
export const roleLabel = lookup(TALENT_ROLES.map((r) => [r.value, r.label] as const));
export const preferenceLabel = lookup(
  ENGAGEMENT_PREFERENCES.map((e) => [e.value, e.label] as const),
);
