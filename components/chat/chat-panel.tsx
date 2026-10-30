"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, UserRound, X } from "lucide-react";

import { CHAT_MAX_MESSAGE_CHARS, CHAT_POLL_MS } from "@/config/chat";
import { siteConfig } from "@/config/site.config";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Sender = "user" | "assistant" | "agent" | "system";
type Message = { key: string; sender: Sender; text: string };
type Mode = "bot" | "live_form" | "live" | "leave" | "left";
type LiveSession = { id: string; token: string; lastId: number };

const GREETING: Message = {
  key: "greeting",
  sender: "assistant",
  text: "Hi! I'm NillTech's assistant. Ask me about our services, prices, booking a call or joining our team.",
};

const STORAGE_KEY = "nilltech-chat";

type Stored = { mode: Mode; messages: Message[]; live: LiveSession | null };

function load(): Stored | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function save(state: Stored) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage blocked: the chat still works for this page.
  }
}

/** Assistant exchange so far, sent along when the visitor asks for a person. */
const transcriptOf = (messages: Message[]) =>
  messages
    .filter(
      (m) => m.key !== "greeting" && (m.sender === "user" || m.sender === "assistant"),
    )
    .slice(-12)
    .map((m) => ({
      role: m.sender as "user" | "assistant",
      content: m.text.slice(0, 1000),
    }));

export default function ChatPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<Stored>(
    () => load() ?? { mode: "bot", messages: [GREETING], live: null },
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoff, setHandoff] = useState(false);
  const [liveAvailable, setLiveAvailable] = useState<boolean | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>("waiting");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { mode, messages, live } = state;
  const update = useCallback((patch: Partial<Stored>) => {
    setState((current) => {
      const next = { ...current, ...patch };
      save(next);
      return next;
    });
  }, []);
  const append = useCallback((message: Message) => {
    setState((current) => {
      const next = { ...current, messages: [...current.messages, message] };
      save(next);
      return next;
    });
  }, []);

  // Scroll to the newest message; focus the input when the chat opens.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, handoff, mode]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, mode]);

  // Escape closes the chat.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const checkAvailability = useCallback(() => {
    fetch("/api/chat/live")
      .then((r) => r.json() as Promise<{ available?: boolean }>)
      .then((d) => setLiveAvailable(Boolean(d.available)))
      .catch(() => setLiveAvailable(false));
  }, []);

  // Live chat: poll for the agent's replies while the chat is live.
  useEffect(() => {
    if (mode !== "live" || !live) return;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/chat/live/messages?id=${live.id}&token=${encodeURIComponent(live.token)}&after=${live.lastId}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: string;
          messages: { id: number; sender: "agent" | "system"; body: string }[];
        };
        if (stopped) return;
        setLiveStatus(data.status);
        if (data.messages.length) {
          setState((current) => {
            const known = new Set(current.messages.map((m) => m.key));
            const fresh = data.messages
              .filter((m) => !known.has(`live-${m.id}`))
              .map(
                (m) =>
                  ({ key: `live-${m.id}`, sender: m.sender, text: m.body }) as Message,
              );
            const lastId = Math.max(live.lastId, ...data.messages.map((m) => m.id));
            const next = {
              ...current,
              messages: [...current.messages, ...fresh],
              live: current.live ? { ...current.live, lastId } : null,
            };
            save(next);
            return next;
          });
        }
      } catch {
        // Try again on the next tick.
      }
    };
    void poll();
    const timer = window.setInterval(poll, CHAT_POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [mode, live]);

  async function sendToAssistant(text: string) {
    const history = [
      ...messages,
      { key: `u-${Date.now()}`, sender: "user" as const, text },
    ];
    append(history.at(-1)!);
    setBusy(true);
    setError(null);
    setHandoff(false);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter(
              (m) =>
                m.key !== "greeting" && (m.sender === "user" || m.sender === "assistant"),
            )
            .map((m) => ({
              role: m.sender,
              content: m.text.slice(0, CHAT_MAX_MESSAGE_CHARS),
            })),
        }),
      });
      if (!res.ok) throw new Error("bad response");
      const data = (await res.json()) as { reply: string; handoff: boolean };
      append({ key: `a-${Date.now()}`, sender: "assistant", text: data.reply });
      if (data.handoff) {
        setHandoff(true);
        checkAvailability();
      }
    } catch {
      setError("Sorry, something went wrong. Please try again, or talk to a person.");
      setHandoff(true);
      checkAvailability();
    } finally {
      setBusy(false);
    }
  }

  async function sendToAgent(text: string) {
    if (!live) return;
    append({ key: `v-${Date.now()}`, sender: "user", text });
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/live/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: live.id, token: live.token, body: text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Not sent. Please try again.");
      }
    } catch {
      setError("Not sent. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim().slice(0, CHAT_MAX_MESSAGE_CHARS);
    if (!text || busy) return;
    setInput("");
    if (mode === "live") void sendToAgent(text);
    else void sendToAssistant(text);
  }

  function askForPerson() {
    setHandoff(true);
    checkAvailability();
  }

  const lastQuestion =
    [...messages].reverse().find((m) => m.sender === "user")?.text ?? "";
  const whatsappHref = `${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
    `Hi NillTech, I was chatting on your website${lastQuestion ? `: ${lastQuestion.slice(0, 300)}` : "."}`,
  )}`;

  async function startLive(form: HTMLFormElement) {
    const data = new FormData(form);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          path: pathname,
          transcript: transcriptOf(messages),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        id?: string;
        token?: string;
        error?: string;
      };
      if (res.status === 409) {
        setLiveAvailable(false);
        update({ mode: "leave" });
        return;
      }
      if (!res.ok || !body.id || !body.token) {
        setError(body.error ?? "We couldn't start the chat. Please try again.");
        return;
      }
      trackEvent("form_submit", { form: "live_chat" });
      setHandoff(false);
      update({
        mode: "live",
        live: { id: body.id, token: body.token, lastId: 0 },
        messages: [
          ...messages,
          {
            key: `sys-${Date.now()}`,
            sender: "system",
            text: "You're now in the queue. Someone from our team will reply here shortly.",
          },
        ],
      });
    } catch {
      setError("We couldn't start the chat. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function leaveMessage(form: HTMLFormElement) {
    const data = new FormData(form);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leave_message",
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
          path: pathname,
          transcript: transcriptOf(messages),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "We couldn't save your message. Please try again.");
        return;
      }
      trackEvent("form_submit", { form: "chat_message" });
      setHandoff(false);
      update({ mode: "left" });
    } catch {
      setError("We couldn't save your message. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function endChat() {
    update({ mode: "bot", live: null, messages: [GREETING] });
    setHandoff(false);
    setLiveStatus("waiting");
  }

  if (!open) return null;

  const fieldClass =
    "border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2";

  return (
    <div
      role="dialog"
      aria-label="Chat with NillTech"
      className="bg-background border-border fixed inset-x-2 bottom-2 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
    >
      <div className="bg-nilltech-navy flex items-center justify-between px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold">
            {mode === "live" ? "Live chat with NillTech" : "NillTech assistant"}
          </p>
          <p className="text-xs text-white/70">
            {mode === "live"
              ? liveStatus === "live"
                ? "Connected to our team"
                : liveStatus === "closed"
                  ? "Chat ended"
                  : "Waiting for someone to join"
              : "Answers from our website, instantly"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="rounded-full p-1.5 hover:bg-white/10"
        >
          <X className="size-5" />
        </button>
      </div>

      <div
        ref={listRef}
        className="flex min-h-[240px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {messages.map((m) => (
          <div
            key={m.key}
            className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
              m.sender === "user"
                ? "bg-nilltech-purple self-end text-white"
                : m.sender === "system"
                  ? "text-muted-foreground self-center bg-transparent text-center text-xs"
                  : "bg-muted self-start",
            )}
          >
            {m.sender === "agent" ? (
              <span className="text-muted-foreground mb-0.5 block text-xs font-medium">
                NillTech team
              </span>
            ) : null}
            {m.text}
          </div>
        ))}
        {busy && mode === "bot" ? (
          <div className="bg-muted text-muted-foreground flex items-center gap-2 self-start rounded-2xl px-3 py-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Typing
          </div>
        ) : null}

        {handoff && mode === "bot" ? (
          <div className="border-border flex flex-col gap-2 rounded-xl border p-3 text-sm">
            <p className="font-medium">How would you like to continue?</p>
            {liveAvailable === null ? (
              <p className="text-muted-foreground text-xs">
                Checking who&rsquo;s available…
              </p>
            ) : liveAvailable ? (
              <button
                type="button"
                onClick={() => update({ mode: "live_form" })}
                className="bg-nilltech-purple rounded-md px-3 py-2 text-left font-medium text-white"
              >
                Chat with a person now
              </button>
            ) : (
              <button
                type="button"
                onClick={() => update({ mode: "leave" })}
                className="bg-nilltech-purple rounded-md px-3 py-2 text-left font-medium text-white"
              >
                Leave a message for our team
              </button>
            )}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("whatsapp_click", { placement: "chat" })}
              className="border-border hover:border-primary rounded-md border px-3 py-2 font-medium"
            >
              Continue on WhatsApp
            </a>
            <Link
              href="/book"
              onClick={() =>
                trackEvent("cta_click", { placement: "chat", intent: "book" })
              }
              className="border-border hover:border-primary rounded-md border px-3 py-2 font-medium"
            >
              Book a call
            </Link>
          </div>
        ) : null}

        {mode === "live_form" ? (
          <form
            className="border-border flex flex-col gap-2 rounded-xl border p-3 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              void startLive(e.currentTarget);
            }}
          >
            <p className="font-medium">Chat with our team</p>
            <label className="text-xs" htmlFor="chat-name">
              Your name
            </label>
            <input
              id="chat-name"
              name="name"
              required
              maxLength={100}
              autoComplete="name"
              className={fieldClass}
            />
            <label className="text-xs" htmlFor="chat-email">
              Email (optional, so we can follow up)
            </label>
            <input
              id="chat-email"
              name="email"
              type="email"
              maxLength={200}
              autoComplete="email"
              className={fieldClass}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="bg-nilltech-purple rounded-md px-3 py-2 font-medium text-white disabled:opacity-60"
              >
                {busy ? "Starting…" : "Start chat"}
              </button>
              <button
                type="button"
                onClick={() => update({ mode: "bot" })}
                className="px-3 py-2"
              >
                Back
              </button>
            </div>
          </form>
        ) : null}

        {mode === "leave" ? (
          <form
            className="border-border flex flex-col gap-2 rounded-xl border p-3 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              void leaveMessage(e.currentTarget);
            }}
          >
            <p className="font-medium">Nobody is online right now</p>
            <p className="text-muted-foreground text-xs">
              Leave a message and we&rsquo;ll reply by email.
            </p>
            <label className="text-xs" htmlFor="leave-name">
              Your name
            </label>
            <input
              id="leave-name"
              name="name"
              required
              maxLength={100}
              autoComplete="name"
              className={fieldClass}
            />
            <label className="text-xs" htmlFor="leave-email">
              Email
            </label>
            <input
              id="leave-email"
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              className={fieldClass}
            />
            <label className="text-xs" htmlFor="leave-message">
              Message
            </label>
            <textarea
              id="leave-message"
              name="message"
              required
              minLength={2}
              maxLength={2000}
              rows={3}
              defaultValue={lastQuestion}
              className={fieldClass}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="bg-nilltech-purple rounded-md px-3 py-2 font-medium text-white disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send message"}
              </button>
              <button
                type="button"
                onClick={() => update({ mode: "bot" })}
                className="px-3 py-2"
              >
                Back
              </button>
            </div>
          </form>
        ) : null}

        {mode === "left" ? (
          <p className="text-muted-foreground self-center text-center text-sm">
            Thanks, your message is with our team. We&rsquo;ll reply by email.
          </p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-destructive px-4 pb-1 text-xs">
          {error}
        </p>
      ) : null}

      {mode === "bot" || mode === "live" || mode === "left" ? (
        <form
          onSubmit={onSubmit}
          className="border-border flex items-end gap-2 border-t p-3"
        >
          <label htmlFor="chat-input" className="sr-only">
            Your message
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={CHAT_MAX_MESSAGE_CHARS}
            placeholder={mode === "live" ? "Message our team" : "Ask a question"}
            disabled={mode === "live" && liveStatus === "closed"}
            className={cn(fieldClass, "max-h-28 resize-none")}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="bg-nilltech-purple rounded-md p-2.5 text-white disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      ) : null}

      <div className="text-muted-foreground flex items-center justify-between gap-2 px-4 pb-3 text-[11px]">
        <span>
          Automated answers can be wrong. See our{" "}
          <Link href="/legal#privacy" className="underline">
            privacy notice
          </Link>
          .
        </span>
        {mode === "bot" && !handoff ? (
          <button
            type="button"
            onClick={askForPerson}
            className="text-primary inline-flex shrink-0 items-center gap-1 font-medium underline"
          >
            <UserRound className="size-3.5" aria-hidden /> Talk to a person
          </button>
        ) : mode === "live" || mode === "left" ? (
          <button type="button" onClick={endChat} className="shrink-0 underline">
            {mode === "live" ? "End chat" : "New chat"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
