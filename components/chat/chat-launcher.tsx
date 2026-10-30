"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MessageCircle } from "lucide-react";

import { trackEvent } from "@/lib/analytics";

// The chat window (and its code) only loads when someone opens it, so it
// costs the page nothing until then (CLAUDE.md §15).
const ChatPanel = dynamic(() => import("@/components/chat/chat-panel"), { ssr: false });

/** Chat button on every public page (owner, 2026-10-30: replaces phone and WhatsApp numbers). */
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {loaded ? <ChatPanel open={open} onClose={() => setOpen(false)} /> : null}
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setLoaded(true);
            setOpen(true);
            trackEvent("cta_click", { placement: "chat", intent: "open" });
          }}
          className="bg-nilltech-navy fixed right-4 bottom-20 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 lg:right-6 lg:bottom-6"
        >
          <MessageCircle className="size-5" aria-hidden />
          Chat with us
        </button>
      ) : null}
    </>
  );
}
