import type { VoiceConversationState } from "@/features/ai/voice/types";

export const VOICE_STATUS_LABELS: Record<VoiceConversationState, string> = {
  idle: "Prêt",
  requesting_permission: "Autorisation du micro…",
  connecting: "Connexion…",
  listening: "Je vous écoute",
  processing: "Je réfléchis…",
  speaking: "Sebavio parle",
  interrupted: "Interrompu",
  disconnected: "Déconnecté",
  error: "Erreur",
};

export const VOICE_ASK_PATH = "/api/ai/voice/ask";
export const VOICE_SESSION_PATH = "/api/ai/voice/session";
export const VOICE_STATUS_PATH = "/api/ai/voice/status";

export const VOICE_SPOKEN_MAX_CONVERSATION = 280;
export const VOICE_SPOKEN_MAX_DRIVING = 160;
