"use server";

import { z } from "zod";

import { CHAT_MAX_MESSAGE_CHARS } from "@/config/chat";
import { getUserWithRole } from "@/lib/auth/dal";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AGENT_ROLES = ["sales", "super_admin"] as const;

export type ChatConversationRow = {
  id: string;
  created_at: string;
  last_message_at: string;
  status: "waiting" | "live" | "closed" | "offline_message";
  visitor_name: string;
  visitor_email: string | null;
  page_path: string | null;
  assigned_to: string | null;
  lead_id: string | null;
};

export type ChatMessageRow = {
  id: number;
  created_at: string;
  sender: "visitor" | "bot" | "agent" | "system";
  body: string;
};

export type ChatPollResult =
  | {
      ok: true;
      available: boolean;
      conversations: ChatConversationRow[];
      messages: ChatMessageRow[];
    }
  | { ok: false };

const CONVERSATION_COLUMNS =
  "id, created_at, last_message_at, status, visitor_name, visitor_email, page_path, assigned_to, lead_id";

const pollSchema = z.object({
  selected: z.uuid().nullable(),
  after: z.number().int().min(0),
});

/**
 * One round trip for the Live chat page, every few seconds: marks the agent
 * as online (presence heartbeat), lists open and recent conversations, and
 * returns new messages in the open conversation. RLS limits it to sales and
 * super admins.
 */
export async function pollLiveChat(
  selected: string | null,
  after: number,
): Promise<ChatPollResult> {
  const user = await getUserWithRole(AGENT_ROLES);
  if (!user) return { ok: false };
  const parsed = pollSchema.safeParse({ selected, after });
  if (!parsed.success) return { ok: false };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false };

  const recent = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const admin = getSupabaseAdmin();

  const [, open, closed, messages] = await Promise.all([
    supabase
      .from("chat_agent_presence")
      .upsert({ user_id: user.id, last_seen_at: new Date().toISOString() }),
    supabase
      .from("chat_conversations")
      .select(CONVERSATION_COLUMNS)
      .in("status", ["waiting", "live"])
      .order("last_message_at", { ascending: false })
      .limit(50),
    supabase
      .from("chat_conversations")
      .select(CONVERSATION_COLUMNS)
      .in("status", ["closed", "offline_message"])
      .gte("last_message_at", recent)
      .order("last_message_at", { ascending: false })
      .limit(30),
    parsed.data.selected
      ? supabase
          .from("chat_messages")
          .select("id, created_at, sender, body")
          .eq("conversation_id", parsed.data.selected)
          .gt("id", parsed.data.after)
          .order("id")
          .limit(500)
      : Promise.resolve({ data: [] }),
  ]);

  // Availability uses the presence just written; the check itself is server-only.
  const available = admin
    ? Boolean((await admin.rpc("chat_live_available")).data)
    : false;

  return {
    ok: true,
    available,
    conversations: [
      ...(open.data ?? []),
      ...(closed.data ?? []),
    ] as ChatConversationRow[],
    messages: (messages.data ?? []) as ChatMessageRow[],
  };
}

const sendSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().trim().min(1).max(CHAT_MAX_MESSAGE_CHARS),
});

/** An agent's reply. The first reply moves the chat to Live and assigns it. */
export async function sendAgentMessage(conversationId: string, body: string) {
  const user = await getUserWithRole(AGENT_ROLES);
  if (!user) return { ok: false as const, error: "Not authorized." };
  const parsed = sendSchema.safeParse({ conversationId, body });
  if (!parsed.success)
    return { ok: false as const, error: "Message is empty or too long." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, error: "Supabase isn't configured." };

  const { data: conversation } = await supabase
    .from("chat_conversations")
    .select("status")
    .eq("id", parsed.data.conversationId)
    .maybeSingle();
  if (!conversation) return { ok: false as const, error: "Chat not found." };
  if (conversation.status === "closed") {
    return { ok: false as const, error: "This chat has ended." };
  }

  const { error } = await supabase.from("chat_messages").insert({
    conversation_id: parsed.data.conversationId,
    sender: "agent",
    body: parsed.data.body,
    agent_id: user.id,
  });
  if (error) return { ok: false as const, error: "Not sent. Try again." };
  return { ok: true as const };
}

/** Ends a live chat. The visitor's window shows that the chat has ended. */
export async function closeConversation(conversationId: string) {
  const user = await getUserWithRole(AGENT_ROLES);
  if (!user) return { ok: false as const };
  const id = z.uuid().safeParse(conversationId);
  if (!id.success) return { ok: false as const };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const };

  const { error } = await supabase
    .from("chat_conversations")
    .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: user.id })
    .eq("id", id.data)
    .in("status", ["waiting", "live"]);
  return { ok: !error };
}
