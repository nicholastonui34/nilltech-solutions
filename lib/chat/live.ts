import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Live chat on the visitor side. Visitors have no login: each conversation
// gets a random secret that only the visitor's browser holds (we store its
// SHA-256), and every read or write must present it.

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(24).toString("base64url");

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || new URL(origin).host === new URL(request.url).host;
}

/** The conversation, if the token matches; null otherwise. */
export async function visitorConversation(id: string, token: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("chat_conversations")
    .select("id, status, visitor_token_hash")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.visitor_token_hash !== hashToken(token)) return null;
  return { admin, conversation: data };
}

export async function liveAvailable() {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data } = await admin.rpc("chat_live_available");
  return data === true;
}
