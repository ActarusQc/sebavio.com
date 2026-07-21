"use client";

import { MicOff, PhoneOff, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VOICE_STATUS_LABELS } from "@/features/ai/voice/constants";
import { SebavioAssistantIcon } from "@/features/ai/components/sebavio-assistant-icon";
import type { VoiceConversationState } from "@/features/ai/voice/types";

type TranscriptItem = { role: "user" | "assistant"; text: string };

type VoiceSessionPanelProps = {
  open: boolean;
  state: VoiceConversationState;
  muted: boolean;
  error: string | null;
  transcripts: TranscriptItem[];
  onClose: () => void;
  onInterrupt: () => void;
  onToggleMute: () => void;
};

export function VoiceSessionPanel({
  open,
  state,
  muted,
  error,
  transcripts,
  onClose,
  onInterrupt,
  onToggleMute,
}: VoiceSessionPanelProps) {
  if (!open) return null;

  const status = VOICE_STATUS_LABELS[state] ?? "Prêt";
  const orbActive =
    state === "listening" || state === "speaking" || state === "processing";

  return (
    <div
      data-testid="voice-session-panel"
      className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-[#0e2d46] via-[#123a58] to-[#0a1f30] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Session vocale Sebavio"
    >
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-center gap-2">
          <SebavioAssistantIcon size={28} />
          <div>
            <p className="text-sebavio-gold text-sm font-semibold tracking-wide">
              Sebavio
            </p>
            <p className="text-xs text-white/70">Agent vocal</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          aria-label="Fermer"
          data-testid="voice-panel-close"
          onClick={onClose}
        >
          <X className="size-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <div
          data-testid="voice-orb"
          className={cn(
            "relative flex size-36 items-center justify-center rounded-full",
            "from-sebavio-teal/40 via-sebavio-gold/25 to-sebavio-navy bg-gradient-to-br",
            "shadow-[0_0_48px_rgb(45_168_166/0.35)]",
            orbActive && "animate-pulse",
          )}
          aria-hidden
        >
          <div className="size-24 rounded-full bg-white/10 backdrop-blur-sm" />
        </div>
        <p
          className="text-center text-lg font-medium"
          data-testid="voice-status-label"
          aria-live="polite"
        >
          {status}
        </p>
        {error ? (
          <p className="max-w-sm text-center text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="max-h-[28vh] overflow-y-auto px-4 pb-2">
        <ul
          className="mx-auto max-w-lg space-y-2"
          data-testid="voice-transcripts"
        >
          {transcripts.slice(-8).map((t, i) => (
            <li
              key={`${t.role}-${i}-${t.text.slice(0, 12)}`}
              className={cn(
                "rounded-xl px-3 py-2 text-sm",
                t.role === "user"
                  ? "ml-8 bg-white/10"
                  : "bg-sebavio-teal/25 mr-8",
              )}
            >
              <span className="text-sebavio-gold/90 mb-0.5 block text-[10px] font-semibold uppercase">
                {t.role === "user" ? "Vous" : "Sebavio"}
              </span>
              {t.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-center gap-4 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-12 rounded-full"
          aria-label={muted ? "Activer le son" : "Couper le son"}
          data-testid="voice-mute"
          onClick={onToggleMute}
        >
          {muted ? (
            <VolumeX className="size-5" />
          ) : (
            <Volume2 className="size-5" />
          )}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-12 rounded-full"
          aria-label="Interrompre"
          data-testid="voice-interrupt"
          onClick={onInterrupt}
        >
          <MicOff className="size-5" />
        </Button>
        <Button
          type="button"
          size="icon"
          className="size-14 rounded-full bg-red-600 text-white hover:bg-red-700"
          aria-label="Quitter"
          data-testid="voice-quit"
          onClick={onClose}
        >
          <PhoneOff className="size-5" />
        </Button>
      </div>
    </div>
  );
}
