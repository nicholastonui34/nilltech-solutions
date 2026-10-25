import { z } from "zod";

import { honeypotSchema } from "@/lib/leads/schema";
import {
  EAC_COUNTRIES,
  ENGAGEMENT_PREFERENCES,
  TALENT_ROLES,
  type CountryCode,
  type EngagementPreference,
  type TalentRole,
} from "@/lib/talent/options";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => !v || /^https?:\/\/\S+\.\S+/.test(v),
    "Enter a full link starting with https://",
  );

export const talentApplicationSchema = honeypotSchema.extend({
  fullName: z.string().trim().min(2, "Enter your full name.").max(200),
  email: z.string().trim().email("Enter a valid email.").max(200),
  phone: z.string().trim().max(40),
  country: z.enum(EAC_COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]], {
    error: "We're currently hiring within East Africa only.",
  }),
  primaryRole: z.enum(TALENT_ROLES.map((r) => r.value) as [TalentRole, ...TalentRole[]], {
    error: "Choose your main role.",
  }),
  skills: z.string().trim().max(300),
  yearsExperience: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z
      .number({ error: "Enter your years of experience." })
      .int("Use a whole number.")
      .min(0, "Enter 0 or more.")
      .max(60, "Enter 60 or fewer."),
  ),
  engagementPreference: z.enum(
    ENGAGEMENT_PREFERENCES.map((e) => e.value) as [
      EngagementPreference,
      ...EngagementPreference[],
    ],
    { error: "Choose how you'd like to work with us." },
  ),
  portfolioUrl: optionalUrl,
  profileUrl: optionalUrl,
  availability: z.string().trim().max(200),
  message: z.string().trim().max(2000),
  consent: z.boolean().refine((v) => v, "Please confirm you've read the privacy notice."),
});

export type TalentApplicationInput = z.input<typeof talentApplicationSchema>;
export type TalentApplicationValues = z.output<typeof talentApplicationSchema>;
