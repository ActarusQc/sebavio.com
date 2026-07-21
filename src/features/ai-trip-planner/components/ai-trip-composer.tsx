"use client";

import { useState, type KeyboardEvent } from "react";
import { Loader2, SendHorizonal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  disabled?: boolean;
  sending?: boolean;
  onSend: (value: string) => void;
};

export function AITripComposer({ disabled, sending, onSend }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled || sending) return;
    onSend(text);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-[#e8eef3] bg-white p-3 sm:p-4">
      <div className="focus-within:border-sebavio-navy/40 focus-within:ring-sebavio-navy/15 flex items-end gap-2 rounded-2xl border border-[#d7e0ea] bg-[#fafbfc] px-3 py-2 focus-within:ring-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Écrivez votre réponse…"
          disabled={disabled || sending}
          rows={1}
          aria-label="Votre réponse"
          className="max-h-36 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent px-0 py-2 shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || sending || !value.trim()}
          aria-label={sending ? "Envoi en cours" : "Envoyer le message"}
          className={cn(
            "bg-sebavio-navy hover:bg-sebavio-navy/90 focus-visible:ring-sebavio-navy/50 mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-white transition focus-visible:ring-2 focus-visible:outline-none disabled:opacity-45",
          )}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <SendHorizonal className="size-4" aria-hidden />
          )}
        </button>
      </div>
      <p className="text-sebavio-slate/70 mt-1.5 px-1 text-[0.7rem]">
        Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne
      </p>
    </div>
  );
}
