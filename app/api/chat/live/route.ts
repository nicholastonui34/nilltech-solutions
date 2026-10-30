import { connection } from "next/server";
import { z } from "zod";

import { CHAT_MAX_MESSAGE_CHARS } from "@/config/chat";
import { hashToken, liveAvailable, newToken, sameOrigin } from "@/lib/chat/live";
import { createLead } from "@/lib/leads/create-lead";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Is a person available right now (agent online, within booking hours)? */
export async function GET() {
  await connection(); // always live, never prerendered
  return Response.json({ available: await liveAvailable() });
}

const transcriptSchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1).max(CHAT_MAX_MESSAGE_CHARS),
    }),
  )
  .max(12);

const startSchema = z.object({
  action: z.literal("start"),
  name: z.string().trim().min(1).max(100),
  email: z.union([z.email().max(200), z.literal("")]),
  path: z.string().startsWith("/").max(300),
  transcript: transcriptSchema,
});

const leaveSchema = z.object({
  action: z.literal("leave_message"),
  name: z.string().trim().min(1).max(100),
  email: z.email().max(200),
  message: z.string().trim().min(2).max(2000),
  path: z.string().startsWith("/").max(300),
  transcript: transcriptSchema,
});

const LIVE_LIMITS = { maxPerWindow: 5, windowSeconds: 10 * 60, maxPerDay: 20 };

const summary = (transcript: z.infer<typeof transcriptSchema>) =>
  transcript
    .map((t) => `${t.role === "user" ? "Visitor" : "Assistant"}: ${t.content}`)
    .join("\n")
    .slice(0, 3000);

/** Start a live chat with a person, or leave a message when nobody is online. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const admin = getSupabaseAdmin();
  if (!admin) return Response.json({ error: "Chat is unavailable." }, { status: 503 });
  if (!(await checkRateLimit("chat_live", LIVE_LIMITS))) {
    return Response.json(
      { error: "Too many requests. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const leave = leaveSchema.safeParse(payload);
  if (leave.success) {
    const d = leave.data;
    const lead = await createLead({
      source: "chat",
      name: d.name,
      email: d.email,
      message: d.message,
      metadata: { page: d.path, chat: summary(d.transcript) || "n/a" },
    });
    if (!lead.ok) {
      return Response.json(
        { error: "We couldn't save your message. Please email us instead." },
        { status: 500 },
      );
    }
    return Response.json({ ok: true });
  }

  const start = startSchema.safeParse(payload);
  if (!start.success) return Response.json({ error: "Bad request" }, { status: 400 });
  if (!(await liveAvailable())) {
    return Response.json({ error: "offline" }, { status: 409 });
  }

  const d = start.data;
  const token = newToken();
  const { data: conversation, error } = await admin
    .from("chat_conversations")
    .insert({
      visitor_token_hash: hashToken(token),
      visitor_name: d.name,
      visitor_email: d.email || null,
      page_path: d.path,
    })
    .select("id")
    .single();
  if (error || !conversation) {
    return Response.json({ error: "Chat is unavailable." }, { status: 500 });
  }

  // The assistant exchange so far, so the agent has context.
  const rows = [
    ...d.transcript.map((t) => ({
      conversation_id: conversation.id,
      sender: t.role === "user" ? "visitor" : "bot",
      body: t.content,
    })),
    {
      conversation_id: conversation.id,
      sender: "system",
      body: `${d.name} asked to talk to a person.`,
    },
  ];
  await admin.from("chat_messages").insert(rows);

  // With an email, the chat is also a lead for follow-up.
  if (d.email) {
    const lead = await createLead({
      source: "chat",
      name: d.name,
      email: d.email,
      message: "Started a live chat on the website.",
      metadata: { page: d.path, chat: summary(d.transcript) || "n/a" },
    });
    if (lead.ok) {
      await admin
        .from("chat_conversations")
        .update({ lead_id: lead.id })
        .eq("id", conversation.id);
    }
  }

  // Retention (12 months), checked now and then.
  if (Math.random() < 0.05) await admin.rpc("delete_old_chats");

  return Response.json({ id: conversation.id, token });
}
