"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  closeConversation,
  pollLiveChat,
  sendAgentMessage,
  type ChatConversationRow,
  type ChatMessageRow,
} from "@/app/actions/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_MAX_MESSAGE_CHARS, CHAT_POLL_MS } from "@/config/chat";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ChatConversationRow["status"], string> = {
  waiting: "Waiting",
  live: "Live",
  closed: "Ended",
  offline_message: "Message",
};

const SENDER_LABELS: Record<ChatMessageRow["sender"], string> = {
  visitor: "Visitor",
  bot: "Assistant",
  agent: "Team",
  system: "Note",
};

const time = (iso: string) =>
  new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));

/**
 * Live chat for sales: while this page is open the agent counts as online,
 * so visitors are offered a person during booking hours. Polls every few
 * seconds (no websockets needed at this volume).
 */
export function LiveChatConsole({ initialSelected }: { initialSelected: string | null }) {
  const [conversations, setConversations] = useState<ChatConversationRow[]>([]);
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lastId = useRef(0);
  const selectedRef = useRef(selected);
  const list = useRef<HTMLOListElement>(null);

  const poll = useCallback(async () => {
    const forId = selectedRef.current;
    const result = await pollLiveChat(forId, lastId.current).catch(() => null);
    if (!result?.ok) return;
    setAvailable(result.available);
    setConversations(result.conversations);
    // Ignore a response for a conversation the agent has since left.
    if (forId !== selectedRef.current || result.messages.length === 0) return;
    lastId.current = result.messages[result.messages.length - 1]!.id;
    setMessages((prev) => [...prev, ...result.messages]);
  }, []);

  useEffect(() => {
    selectedRef.current = selected;
    void poll();
    const timer = window.setInterval(() => void poll(), CHAT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [selected, poll]);

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [messages.length]);

  // A waiting visitor shows in the browser tab title, so it's noticed from other tabs.
  const waiting = conversations.filter((c) => c.status === "waiting").length;
  useEffect(() => {
    const base = "Live chat | NillTech portal";
    document.title = waiting > 0 ? `(${waiting}) waiting | ${base}` : base;
  }, [waiting]);

  const current = conversations.find((c) => c.id === selected) ?? null;
  const open = conversations.filter((c) => c.status === "waiting" || c.status === "live");
  const past = conversations.filter(
    (c) => c.status === "closed" || c.status === "offline_message",
  );

  function choose(id: string) {
    if (id === selected) return;
    selectedRef.current = id;
    lastId.current = 0;
    setMessages([]);
    setError(null);
    setSelected(id);
    window.history.replaceState(null, "", `/portal/sales/chat?c=${id}`);
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    setSending(true);
    setError(null);
    const result = await sendAgentMessage(selected, draft).catch(() => null);
    setSending(false);
    if (!result?.ok) {
      setError(result?.error ?? "Not sent. Try again.");
      return;
    }
    setDraft("");
    void poll();
  }

  async function end() {
    if (
      !selected ||
      !window.confirm("End this chat? The visitor will see that it has ended.")
    ) {
      return;
    }
    await closeConversation(selected).catch(() => null);
    void poll();
  }

  return (
    <div className="space-y-4">
      <p
        role="status"
        className={cn(
          "rounded-lg border px-4 py-3 text-sm",
          available
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-amber-300 bg-amber-50 text-amber-900",
        )}
      >
        {available === null
          ? "Connecting..."
          : available
            ? "You're online: website visitors are offered a chat with a person while this page stays open."
            : "Visitors aren't offered a person right now: it's outside your booking hours (Sales → Availability) or a blocked time. They can still leave a message, which becomes a lead."}
      </p>

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <nav
          aria-label="Conversations"
          className="border-border bg-card rounded-xl border"
        >
          <ConversationList
            title="Open"
            rows={open}
            selected={selected}
            onChoose={choose}
          />
          <ConversationList
            title="Last 7 days"
            rows={past}
            selected={selected}
            onChoose={choose}
          />
        </nav>

        <section
          aria-label="Conversation"
          className="border-border bg-card flex min-h-[28rem] flex-col rounded-xl border"
        >
          {!current ? (
            <p className="text-muted-foreground m-auto p-6 text-center text-sm">
              {open.length > 0
                ? "Pick a conversation to answer."
                : "No open chats. New ones appear here automatically."}
            </p>
          ) : (
            <>
              <header className="border-border flex flex-wrap items-start justify-between gap-3 border-b p-4">
                <div className="text-sm">
                  <p className="font-semibold">
                    {current.visitor_name}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({STATUS_LABELS[current.status]})
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    {current.visitor_email ? (
                      <a href={`mailto:${current.visitor_email}`} className="underline">
                        {current.visitor_email}
                      </a>
                    ) : (
                      "No email given"
                    )}
                    {current.page_path ? ` · from ${current.page_path}` : null}
                  </p>
                  {current.lead_id ? (
                    <Link
                      href={`/portal/sales/${current.lead_id}`}
                      className="text-primary underline"
                    >
                      Open the lead
                    </Link>
                  ) : null}
                </div>
                {current.status === "waiting" || current.status === "live" ? (
                  <Button type="button" variant="outline" size="sm" onClick={end}>
                    End chat
                  </Button>
                ) : null}
              </header>

              <ol
                ref={list}
                aria-live="polite"
                className="flex-1 space-y-3 overflow-y-auto p-4 text-sm"
              >
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 whitespace-pre-wrap",
                      m.sender === "agent" &&
                        "bg-primary text-primary-foreground ml-auto",
                      m.sender === "visitor" && "bg-muted",
                      m.sender === "bot" && "border-border border",
                      m.sender === "system" &&
                        "text-muted-foreground mx-auto text-center text-xs",
                    )}
                  >
                    {m.sender !== "system" ? (
                      <span className="block text-xs opacity-75">
                        {SENDER_LABELS[m.sender]} · {time(m.created_at)}
                      </span>
                    ) : null}
                    {m.body}
                  </li>
                ))}
              </ol>

              {current.status === "waiting" || current.status === "live" ? (
                <form onSubmit={send} className="border-border space-y-2 border-t p-4">
                  <label htmlFor="agent-reply" className="sr-only">
                    Your reply
                  </label>
                  <Textarea
                    id="agent-reply"
                    value={draft}
                    maxLength={CHAT_MAX_MESSAGE_CHARS}
                    rows={3}
                    placeholder="Type your reply"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-destructive text-sm" role="alert">
                      {error}
                    </p>
                    <Button type="submit" size="sm" disabled={sending || !draft.trim()}>
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-muted-foreground border-border border-t p-4 text-sm">
                  {current.status === "offline_message"
                    ? "Left as a message. Reply by email."
                    : "This chat has ended. Follow up by email if needed."}
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ConversationList({
  title,
  rows,
  selected,
  onChoose,
}: {
  title: string;
  rows: ChatConversationRow[];
  selected: string | null;
  onChoose: (id: string) => void;
}) {
  return (
    <div className="border-border border-b p-3 last:border-b-0">
      <h2 className="text-muted-foreground px-1 pb-2 text-xs font-semibold uppercase">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground px-1 text-sm">None.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChoose(c.id)}
                aria-current={c.id === selected ? "true" : undefined}
                className={cn(
                  "hover:bg-muted w-full rounded-md px-2 py-2 text-left text-sm",
                  c.id === selected && "bg-muted",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{c.visitor_name}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 text-xs",
                      c.status === "waiting"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {STATUS_LABELS[c.status]}
                  </span>
                </span>
                <span className="text-muted-foreground block text-xs">
                  {time(c.last_message_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
