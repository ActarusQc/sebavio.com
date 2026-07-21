"use client";

import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { VOICE_STATUS_LABELS } from "@/features/ai/voice/constants";
import type { VoiceConversationState } from "@/features/ai/voice/types";

type VoiceMicButtonProps = {
  state: VoiceConversationState;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
  className?: string;
};

export function VoiceMicButton({
  state,
  disabled,
  active,
  onClick,
  className,
}: VoiceMicButtonProps) {
  const label =
    active && state !== "idle" && state !== "disconnected"
      ? VOICE_STATUS_LABELS[state]
      : "Parler à l’assistant";

  const busy =
    state === "connecting" ||
    state === "processing" ||
    state === "requesting_permission";

  return (
    <button
      type="button"
      data-testid="voice-mic-button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-md transition focus-visible:ring-2 focus-visible:outline-none",
        active
          ? "bg-sebavio-teal hover:bg-sebavio-teal/90 focus-visible:ring-sebavio-teal text-white"
          : "bg-sebavio-navy hover:bg-sebavio-navy/90 focus-visible:ring-sebavio-navy text-white",
        state === "listening" && "ring-sebavio-gold/70 ring-2",
        state === "speaking" && "ring-sebavio-teal/60 ring-2",
        state === "error" && "bg-red-700 hover:bg-red-700/90",
        busy && "opacity-80",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {state === "error" || state === "interrupted" ? (
        <MicOff className="size-4" aria-hidden />
      ) : (
        <Mic className="size-4" aria-hidden />
      )}
    </button>
  );
}
