/**
 * AI model API pricing (CLAUDE.md §7B). This is public vendor pricing, not
 * a NillTech-invented figure, so unlike pricing-rules.ts it's filled in.
 * Claude figures come from Anthropic's own model docs. OpenAI, Google and
 * Manus figures are corroborated by several third-party aggregators that
 * agreed with each other, but not confirmed on each vendor's own pricing
 * page, because this session's network policy blocks direct fetches to
 * them. `lastVerified` makes that staleness visible on the page per spec.
 * Re-verify whenever `lastVerified` is more than ~60 days old, and before
 * 1 Jan 2027, when Gemini 3.7 Flash's introductory rate ends.
 *
 * Manus is an agent product billed by subscription credits, not per token,
 * so it carries a plan summary instead of a token price and the estimator
 * shows that rather than inventing a per-token conversion.
 */

export const lastVerified = "2026-10-25";

export type AiProvider = "Anthropic" | "OpenAI" | "Google" | "Manus";

export const providerLabels: Record<AiProvider, string> = {
  Anthropic: "Anthropic (Claude)",
  OpenAI: "OpenAI (ChatGPT)",
  Google: "Google (Gemini)",
  Manus: "Manus",
};

export type AiModelPricing =
  | {
      kind: "tokens";
      inputPerMillionUsd: number;
      outputPerMillionUsd: number;
    }
  | { kind: "subscription"; summary: string };

export type AiModel = {
  id: string;
  label: string;
  provider: AiProvider;
  pricing: AiModelPricing;
  // Shown under the estimate when this model is selected.
  note?: string;
};

export const aiModels: AiModel[] = [
  {
    id: "claude-haiku-5-5",
    label: "Claude Haiku 5.5",
    provider: "Anthropic",
    pricing: { kind: "tokens", inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.5 },
    note: "Rate for prompts up to 100K tokens; longer prompts cost $0.50 / $2.50 per 1M.",
  },
  {
    id: "claude-sonnet-5-5",
    label: "Claude Sonnet 5.5",
    provider: "Anthropic",
    pricing: { kind: "tokens", inputPerMillionUsd: 2, outputPerMillionUsd: 10 },
  },
  {
    id: "claude-opus-5-5",
    label: "Claude Opus 5.5",
    provider: "Anthropic",
    pricing: { kind: "tokens", inputPerMillionUsd: 4, outputPerMillionUsd: 20 },
  },
  {
    id: "claude-fable-5-1",
    label: "Claude Fable 5.1",
    provider: "Anthropic",
    pricing: { kind: "tokens", inputPerMillionUsd: 10, outputPerMillionUsd: 50 },
  },
  {
    id: "gpt-6-luna",
    label: "GPT-6 Luna",
    provider: "OpenAI",
    pricing: { kind: "tokens", inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.5 },
  },
  {
    id: "gpt-6-1-sol",
    label: "GPT-6.1 Sol",
    provider: "OpenAI",
    pricing: { kind: "tokens", inputPerMillionUsd: 2, outputPerMillionUsd: 10 },
  },
  {
    id: "gpt-6-astra",
    label: "GPT-6 Astra",
    provider: "OpenAI",
    pricing: { kind: "tokens", inputPerMillionUsd: 10, outputPerMillionUsd: 50 },
  },
  {
    id: "gemini-3-7-flash",
    label: "Gemini 3.7 Flash",
    provider: "Google",
    pricing: { kind: "tokens", inputPerMillionUsd: 0.75, outputPerMillionUsd: 3.75 },
    note: "Introductory rate until 31 Dec 2026; then $1.50 / $7.50 per 1M tokens, roughly doubling this estimate.",
  },
  {
    id: "gemini-3-1-pro",
    label: "Gemini 3.1 Pro",
    provider: "Google",
    pricing: { kind: "tokens", inputPerMillionUsd: 2, outputPerMillionUsd: 12 },
  },
  {
    id: "manus",
    label: "Manus (AI agent)",
    provider: "Manus",
    pricing: {
      kind: "subscription",
      summary:
        "Manus bills by credits on a monthly plan, not per token: free (300 credits a day), then $20, $40 or $200 a month for 4,000, 8,000 or 40,000 credits. Credits used depend on how long and complex each task is, so we can't give a per-volume figure; tell us the workflow and we'll size it.",
    },
  },
];

export type TokenTask = "chatbot" | "document-processing" | "classification" | "rag";

// Rough tokens-per-interaction by task, used only to turn "monthly volume"
// into a token estimate — not a precision figure.
const tokensPerInteraction: Record<TokenTask, { input: number; output: number }> = {
  chatbot: { input: 400, output: 250 },
  "document-processing": { input: 3000, output: 500 },
  classification: { input: 300, output: 20 },
  rag: { input: 1500, output: 400 },
};

export type MonthlyVolumeBand = "under-1k" | "1k-10k" | "10k-100k" | "100k-plus";

// Midpoint of each band, used for the estimate.
const volumeMidpoint: Record<MonthlyVolumeBand, number> = {
  "under-1k": 500,
  "1k-10k": 5_000,
  "10k-100k": 50_000,
  "100k-plus": 150_000,
};

export function estimateMonthlyTokenCostUsd({
  modelId,
  task,
  monthlyVolume,
}: {
  modelId: string;
  task: TokenTask;
  monthlyVolume: MonthlyVolumeBand;
}): number | null {
  const model = aiModels.find((m) => m.id === modelId);
  // Subscription-billed products (Manus) have no per-token rate to estimate from.
  if (!model || model.pricing.kind !== "tokens") return null;
  const { inputPerMillionUsd, outputPerMillionUsd } = model.pricing;

  const interactions = volumeMidpoint[monthlyVolume];
  const { input, output } = tokensPerInteraction[task];

  const inputCost = (interactions * input * inputPerMillionUsd) / 1_000_000;
  const outputCost = (interactions * output * outputPerMillionUsd) / 1_000_000;

  return Math.round((inputCost + outputCost) * 100) / 100;
}
