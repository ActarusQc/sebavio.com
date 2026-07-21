import type { VoiceUsageMode } from "@/features/ai/voice/types";
import {
  VOICE_SPOKEN_MAX_CONVERSATION,
  VOICE_SPOKEN_MAX_DRIVING,
} from "@/features/ai/voice/constants";

export type VoiceSummaryInput = {
  summary?: string | null;
  answer?: string | null;
  suggestions?: Array<{
    title?: string | null;
    proposedAction?: unknown;
  }> | null;
};

function truncateSpoken(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${base.trim()}…`;
}

/**
 * Construit le texte à lire à voix haute à partir de la réponse assistant.
 */
export function buildVoiceSpokenText(
  response: VoiceSummaryInput,
  usageMode: VoiceUsageMode = "conversation",
): {
  spokenText: string;
  confirmationRequired: boolean;
  proposedAction: unknown | null;
} {
  const max =
    usageMode === "driving"
      ? VOICE_SPOKEN_MAX_DRIVING
      : VOICE_SPOKEN_MAX_CONVERSATION;

  const base =
    (response.summary && response.summary.trim()) ||
    (response.answer && response.answer.trim()) ||
    "Je n’ai pas de réponse pour le moment.";

  let spokenText = truncateSpoken(base, max);
  const withAction = (response.suggestions ?? []).find(
    (s) => s?.proposedAction != null,
  );
  const confirmationRequired = Boolean(withAction?.proposedAction);
  const proposedAction = withAction?.proposedAction ?? null;

  if (confirmationRequired) {
    const question =
      usageMode === "driving"
        ? " Voulez-vous que je fasse ce changement ?"
        : " Voulez-vous que j’applique cette suggestion ?";
    const room = max - spokenText.length;
    if (room > 20) {
      spokenText = truncateSpoken(`${spokenText}${question}`, max);
    } else {
      spokenText = truncateSpoken(
        `${truncateSpoken(base, Math.max(40, max - question.length))}${question}`,
        max,
      );
    }
  }

  return { spokenText, confirmationRequired, proposedAction };
}
