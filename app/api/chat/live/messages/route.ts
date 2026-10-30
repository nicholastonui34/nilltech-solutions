import { z } from "zod";

import { CHAT_MAX_MESSAGE_CHARS } from "@/config/chat";
import { sameOrigin, visitorConversation } from "@/lib/chat/live";
import { checkRateLimit } from "@/lib/rate-limit";

const MESSAGE_LIMITS = { maxPerWindow: 60, windowSeconds: 10 * 60, maxPerDay: 400 };

/** New messages for the visitor (polled every few seconds while chatting). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = z.uuid().safeParse(url.searchParams.get("id"));
  const token = url.searchParams.get("token") ?? "";
  const after = Number(url.searchParams.get("after") ?? 0) || 0;
  if (!id.success || !token)
    return Response.json({ error: "Bad request" }, { status: 400 });

  const found = await visitorConversation(id.data, token);
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });

  const { data } = await found.admin
    .from("chat_messages")
    .select("id, sender, body, created_at")
    .eq("conversation_id", id.data)
    .in("sender", ["agent", "system"])
    .gt("id", after)
    .order("id");
  return Response.json({ status: found.conversation.status, messages: data ?? [] });
}

const sendSchema = z.object({
  id: z.uuid(),
  token: z.string().min(10).max(100),
  body: z.string().trim().min(1).max(CHAT_MAX_MESSAGE_CHARS),
});

/** A visitor's message in a live chat. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const parsed = sendSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  if (!(await checkRateLimit("chat_message", MESSAGE_LIMITS))) {
    return Response.json({ error: "Too many messages." }, { status: 429 });
  }

  const found = await visitorConversation(parsed.data.id, parsed.data.token);
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });
  if (found.conversation.status === "closed") {
    return Response.json({ error: "This chat has ended." }, { status: 409 });
  }

  const { data, error } = await found.admin
    .from("chat_messages")
    .insert({
      conversation_id: parsed.data.id,
      sender: "visitor",
      body: parsed.data.body,
    })
    .select("id")
    .single();
  if (error || !data) return Response.json({ error: "Not sent." }, { status: 500 });
  return Response.json({ id: data.id });
}
