import { USD_KES_RATE } from "@/config/pricing-rules";

/**
 * Website chat assistant (owner, 2026-10-30). The AI answers from the site's
 * own content only; when it can't, the visitor can talk to a person, open
 * WhatsApp or leave a message.
 */

/** Claude Haiku 5.5: Anthropic's cheapest current model (owner's choice). */
export const CHAT_MODEL = "claude-haiku-5-5";

/**
 * Anthropic's list prices for Claude Haiku 5.5, US dollars per million
 * tokens (prompts under 100K tokens). Checked 2026-10-30 against
 * Anthropic's published model table. Cache reads are billed at 10% of the
 * input price and cache writes at 125%.
 */
export const CHAT_PRICES_USD_PER_MTOK = {
  input: 0.1,
  output: 0.5,
  cacheRead: 0.01,
  cacheWrite: 0.125,
} as const;

/** Monthly AI spend cap (owner, 2026-10-30). Past it, the FAQ-only mode takes over. */
export const CHAT_MONTHLY_CAP_KES = 1_000;
export const CHAT_MONTHLY_CAP_USD_MICROS = Math.round(
  (CHAT_MONTHLY_CAP_KES / USD_KES_RATE) * 1_000_000,
);

/** Per reply: short, chat-sized answers keep cost and reading time low. */
export const CHAT_MAX_OUTPUT_TOKENS = 600;
/** How much history the assistant sees (visitor and assistant turns). */
export const CHAT_MAX_TURNS = 12;
export const CHAT_MAX_MESSAGE_CHARS = 1_000;

/** Live chat: how often the widget and the portal check for new messages. */
export const CHAT_POLL_MS = 4_000;
