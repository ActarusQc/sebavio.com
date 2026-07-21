export type VoiceConversationState =
  | "idle"
  | "requesting_permission"
  | "connecting"
  | "listening"
  | "processing"
  | "speaking"
  | "interrupted"
  | "disconnected"
  | "error";

export type VoiceUsageMode = "conversation" | "driving";
export type VoiceClientPlatform = "web" | "mobile" | "android_auto" | "carplay";
export type VoiceProviderName = "openai_realtime" | "pipeline" | "mock";

/** Capacité produit — mappée à l’entitlement `ai.voice.enabled`. */
export const VOICE_CAPABILITY = "voice_agent" as const;

export type VoiceAgentEvent =
  | { type: "session.started"; sessionId: string }
  | { type: "user.transcript.partial"; text: string }
  | { type: "user.transcript.final"; text: string }
  | { type: "assistant.transcript.partial"; text: string }
  | { type: "assistant.transcript.final"; text: string; structured?: unknown }
  | { type: "assistant.audio.started" }
  | { type: "assistant.audio.stopped" }
  | { type: "tool.started"; toolName: string }
  | { type: "tool.completed"; toolName: string; result: unknown }
  | { type: "confirmation.required"; action: unknown; message: string }
  | { type: "session.error"; code: string; message: string }
  | { type: "session.ended"; reason: string }
  | { type: "state.changed"; state: VoiceConversationState };

export type VoiceSessionConfig = {
  sessionId: string;
  tripId: string;
  usageMode: VoiceUsageMode;
  clientPlatform: VoiceClientPlatform;
  language: string;
  /** Secret éphémère OpenAI — uniquement Realtime ; jamais la clé principale. */
  clientSecret?: string;
  realtimeModel?: string;
  realtimeVoice?: string;
  /** Chemin relatif endpoint ask */
  askUrl: string;
  endUrl: string;
  heartbeatUrl?: string;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
};

export interface VoiceConversationProvider {
  connect(config: VoiceSessionConfig): Promise<void>;
  disconnect(): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  interruptResponse(): Promise<void>;
  setMuted(muted: boolean): void;
  getState(): VoiceConversationState;
  subscribe(listener: (event: VoiceAgentEvent) => void): () => void;
}
