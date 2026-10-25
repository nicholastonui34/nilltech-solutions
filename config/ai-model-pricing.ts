/**
 * AI model API pricing (CLAUDE.md §7B) — this is public vendor pricing,
 * not a NillTech-invented figure, so unlike pricing-rules.ts it's filled
 * in. Still corroborated only by third-party aggregators, not confirmed
 * on each vendor's own pricing page (this session's network policy
 * blocked direct fetches to them) — `lastVerified` makes that staleness
 * visible on the page per spec. Re-verify before the estimator sees real
 * traffic, and whenever `lastVerified` is more than ~60 days old.
 *
 * OpenAI's GPT-5.x line is deliberately excluded: third-party figures for
 * it disagreed by 5-10x across sources during this pass, too unreliable
 * to show a cost estimate against.
 */

export const lastVerified = "2026-10-25";

export type AiModel = {
  id: string;
  label: string;
  provider: "Anthropic" | "Google";
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
};

export const aiModels: AiModel[] = [
  {
    id: "claude-haiku-4.5",
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    inputPerMillionUsd: 1.0,
    outputPerMillionUsd: 5.0,
  },
  {
    id: "claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    provider: "Anthropic",
    inputPerMillionUsd: 3.0,
    outputPerMillionUsd: 15.0,
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    provider: "Google",
    inputPerMillionUsd: 0.1,
    outputPerMillionUsd: 0.4,
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "Google",
    inputPerMillionUsd: 0.3,
    outputPerMillionUsd: 2.5,
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
  if (!model) return null;

  const interactions = volumeMidpoint[monthlyVolume];
  const { input, output } = tokensPerInteraction[task];

  const inputCost = (interactions * input * model.inputPerMillionUsd) / 1_000_000;
  const outputCost = (interactions * output * model.outputPerMillionUsd) / 1_000_000;

  return Math.round((inputCost + outputCost) * 100) / 100;
}
