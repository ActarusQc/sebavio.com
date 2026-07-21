"use client";

import { useEffect, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { AITripComposer } from "@/features/ai-trip-planner/components/ai-trip-composer";
import { AITripMessage } from "@/features/ai-trip-planner/components/ai-trip-message";
import type { PlannerMessage } from "@/features/ai-trip-planner/types";

type Props = {
  messages: PlannerMessage[];
  sending?: boolean;
  disabled?: boolean;
  error?: string | null;
  onSend: (content: string) => void;
  onRetry?: () => void;
};

export function AITripConversation({
  messages,
  sending,
  disabled,
  error,
  onSend,
  onRetry,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    if (!liveRef.current) return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last) {
      liveRef.current.textContent = last.content;
    }
  }, [messages]);

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_8px_28px_rgba(8,43,70,0.05)] lg:min-h-[36rem]">
      <header className="flex items-center gap-2 border-b border-[#e8eef3] px-4 py-3.5 sm:px-5">
        <Sparkles className="text-sebavio-gold size-4" aria-hidden />
        <h2 className="font-heading text-sebavio-navy text-base font-semibold">
          Assistant de planification
        </h2>
      </header>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message, index) => (
          <AITripMessage
            key={message.id}
            message={message}
            showQuickReplies={
              index === lastAssistantIdx && !sending && !disabled
            }
            onQuickReply={onSend}
            quickRepliesDisabled={disabled || sending}
          />
        ))}

        {sending ? (
          <div
            className="text-sebavio-slate flex items-center gap-2 text-sm"
            role="status"
            aria-live="assertive"
          >
            <Loader2 className="text-sebavio-gold size-4 animate-spin" />
            L’assistant réfléchit…
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            <p>{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-sm font-semibold underline underline-offset-2"
              >
                Réessayer
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div ref={liveRef} className="sr-only" aria-live="polite" />

      <AITripComposer onSend={onSend} disabled={disabled} sending={sending} />
    </section>
  );
}
