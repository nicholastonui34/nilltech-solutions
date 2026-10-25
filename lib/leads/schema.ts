import { z } from "zod";

// Shown when a submission fails for any reason — server-side validation, a
// failed insert, or the server action itself being unreachable.
export const SUBMIT_ERROR_MESSAGE =
  "Something went wrong submitting that. Please email info@nilltechsolutions.com or WhatsApp us instead.";

// Honeypot field: real users never fill it in (it's visually hidden), bots
// filling every field do. No Turnstile site key yet (CLAUDE.md §18 open
// gap) — this is a lightweight stand-in, not a replacement for it.
export const honeypotSchema = z.object({
  website: z.string().max(0, "Leave this field empty."),
});

export const contactFormSchema = honeypotSchema.extend({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  message: z.string().trim().min(10, "Tell us a little about what you need."),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const projectEstimatorSchema = honeypotSchema.extend({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email."),
  company: z.string().trim().optional(),
  projectType: z.enum(["website", "custom-software", "ecommerce", "business-systems"]),
  features: z.array(z.string()),
  integrations: z.array(z.string()),
  timelineUrgency: z.enum(["asap", "1-3-months", "3-6-months", "exploring"]),
  budgetBand: z.enum(["under-500k", "500k-2m", "2m-plus", "unsure"]),
  region: z.enum(["primary-market", "secondary-market", "other"]),
});

export type ProjectEstimatorValues = z.infer<typeof projectEstimatorSchema>;

export const tokenEstimatorSchema = honeypotSchema.extend({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email."),
  company: z.string().trim().optional(),
  task: z.enum(["chatbot", "document-processing", "classification", "rag"]),
  monthlyVolume: z.enum(["under-1k", "1k-10k", "10k-100k", "100k-plus"]),
});

export type TokenEstimatorValues = z.infer<typeof tokenEstimatorSchema>;
