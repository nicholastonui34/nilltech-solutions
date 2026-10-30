import { z } from "zod";

import { CHAT_MAX_MESSAGE_CHARS, CHAT_MAX_TURNS } from "@/config/chat";
import { askAssistant } from "@/lib/chat/assistant";
import { matchFaq } from "@/lib/chat/faq-match";
import { sameOrigin } from "@/lib/chat/live";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(CHAT_MAX_MESSAGE_CHARS),
      }),
    )
    .min(1)
    .max(40),
});

// Generous for a real conversation, pointless for a script.
const CHAT_LIMITS = { maxPerWindow: 30, windowSeconds: 10 * 60, maxPerDay: 150 };

const NOT_SURE =
  "I'm not sure about that one. Would you like to talk to someone from our team?";
const TO_PERSON = "Of course. Choose how you'd like to reach our team below.";

// Asking for a person, in English or Swahili (used when the AI is off).
const WANTS_PERSON =
  /\b(person|human|agent|someone|somebody|real people|staff|whatsapp|call me|mtu|binadamu)\b/i;

/**
 * Website chat assistant. Answers with Claude Haiku from the site's own
 * content; falls back to matching the site's FAQs when the AI is off (no
 * key, monthly cap reached or an error). Conversations aren't stored here.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });

  if (!(await checkRateLimit("chat", CHAT_LIMITS))) {
    return Response.json({
      reply:
        "You've sent a lot of messages in a short time. Please wait a few minutes, or ask to talk to a person.",
      handoff: true,
      mode: "limit",
    });
  }

  // Recent turns only, starting with a visitor message.
  const recent = parsed.data.messages.slice(-CHAT_MAX_TURNS);
  while (recent.length && recent[0].role !== "user") recent.shift();
  const last = recent.at(-1);
  if (!last || last.role !== "user") {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const ai = await askAssistant(recent);
  if (ai.ok) return Response.json({ reply: ai.text, handoff: ai.handoff, mode: "ai" });

  if (WANTS_PERSON.test(last.content)) {
    return Response.json({ reply: TO_PERSON, handoff: true, mode: "faq" });
  }
  const answer = matchFaq(last.content);
  return Response.json({
    reply: answer ?? NOT_SURE,
    handoff: !answer,
    mode: "faq",
  });
}
