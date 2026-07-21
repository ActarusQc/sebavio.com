import { VoiceEventBus } from "@/features/ai/voice/providers/event-bus";
import type {
  VoiceAgentEvent,
  VoiceConversationProvider,
  VoiceConversationState,
  VoiceSessionConfig,
} from "@/features/ai/voice/types";

/** Provider déterministe pour tests Vitest. */
export class MockVoiceProvider implements VoiceConversationProvider {
  private bus = new VoiceEventBus();
  private state: VoiceConversationState = "idle";
  private config: VoiceSessionConfig | null = null;
  muted = false;

  private setState(state: VoiceConversationState): void {
    this.state = state;
    this.emit({ type: "state.changed", state });
  }

  private emit(event: VoiceAgentEvent): void {
    this.bus.emit(event);
  }

  getState(): VoiceConversationState {
    return this.state;
  }

  subscribe(listener: (event: VoiceAgentEvent) => void): () => void {
    return this.bus.subscribe(listener);
  }

  async connect(config: VoiceSessionConfig): Promise<void> {
    this.config = config;
    this.setState("connecting");
    this.emit({ type: "session.started", sessionId: config.sessionId });
    this.setState("listening");
  }

  async disconnect(): Promise<void> {
    this.setState("disconnected");
    this.emit({ type: "session.ended", reason: "user_disconnect" });
    this.bus.clear();
  }

  async startListening(): Promise<void> {
    this.setState("listening");
  }

  async stopListening(): Promise<void> {
    this.setState("idle");
  }

  async interruptResponse(): Promise<void> {
    this.setState("interrupted");
    this.emit({ type: "assistant.audio.stopped" });
    this.setState("listening");
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Aide tests : simule un tour complet. */
  simulateUserUtterance(text: string, spokenReply: string): void {
    this.emit({ type: "user.transcript.final", text });
    this.setState("processing");
    this.emit({ type: "assistant.transcript.final", text: spokenReply });
    this.setState("speaking");
    this.emit({ type: "assistant.audio.started" });
    this.emit({ type: "assistant.audio.stopped" });
    this.setState("listening");
  }

  getConfig(): VoiceSessionConfig | null {
    return this.config;
  }
}
