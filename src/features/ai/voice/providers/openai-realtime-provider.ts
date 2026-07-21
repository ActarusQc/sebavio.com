import { VoiceEventBus } from "@/features/ai/voice/providers/event-bus";
import type {
  VoiceAgentEvent,
  VoiceConversationProvider,
  VoiceConversationState,
  VoiceSessionConfig,
} from "@/features/ai/voice/types";

/**
 * Provider Realtime OpenAI via WebRTC + secret éphémère (jamais la clé serveur).
 */
export class OpenAiRealtimeVoiceProvider implements VoiceConversationProvider {
  private bus = new VoiceEventBus();
  private state: VoiceConversationState = "idle";
  private config: VoiceSessionConfig | null = null;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private muted = false;
  private destroyed = false;
  private pendingToolCalls = new Map<string, string>();

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
    this.destroyed = false;
    this.config = config;
    this.setState("connecting");

    if (!config.clientSecret) {
      this.setState("error");
      this.emit({
        type: "session.error",
        code: "missing_secret",
        message: "Secret de session Realtime manquant.",
      });
      return;
    }

    const pc = new RTCPeerConnection();
    this.pc = pc;

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      let audio = document.getElementById(
        "sebavio-voice-remote-audio",
      ) as HTMLAudioElement | null;
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "sebavio-voice-remote-audio";
        audio.autoplay = true;
        document.body.appendChild(audio);
      }
      audio.srcObject = stream;
      this.setState("speaking");
      this.emit({ type: "assistant.audio.started" });
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.localStream = stream;
    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;
    dc.onmessage = (msg) => {
      void this.handleDataMessage(String(msg.data));
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const model = config.realtimeModel ?? "gpt-4o-realtime-preview";
    const sdpRes = await fetch(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp ?? "",
      },
    );

    if (!sdpRes.ok) {
      this.setState("error");
      this.emit({
        type: "session.error",
        code: "realtime_sdp",
        message: "Impossible d’établir la connexion vocale Realtime.",
      });
      await this.cleanup();
      return;
    }

    const answer = await sdpRes.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answer });

    this.emit({ type: "session.started", sessionId: config.sessionId });
    this.setState("listening");
  }

  async disconnect(): Promise<void> {
    this.destroyed = true;
    await this.cleanup();
    this.setState("disconnected");
    this.emit({ type: "session.ended", reason: "user_disconnect" });
  }

  async startListening(): Promise<void> {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = !this.muted;
      });
    }
    this.setState("listening");
  }

  async stopListening(): Promise<void> {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
    }
  }

  async interruptResponse(): Promise<void> {
    this.sendEvent({ type: "response.cancel" });
    this.setState("interrupted");
    this.emit({ type: "assistant.audio.stopped" });
    if (!this.destroyed) this.setState("listening");
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
      });
    }
  }

  private sendEvent(payload: unknown): void {
    if (this.dc?.readyState === "open") {
      this.dc.send(JSON.stringify(payload));
    }
  }

  private async handleDataMessage(raw: string): Promise<void> {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = String(event.type ?? "");

    if (type === "response.audio_transcript.delta") {
      const delta = String(event.delta ?? "");
      if (delta) {
        this.emit({ type: "assistant.transcript.partial", text: delta });
      }
    }

    if (type === "response.audio_transcript.done") {
      const text = String(event.transcript ?? "");
      if (text) {
        this.emit({ type: "assistant.transcript.final", text });
      }
      this.emit({ type: "assistant.audio.stopped" });
      if (!this.destroyed) this.setState("listening");
    }

    if (type === "conversation.item.input_audio_transcription.completed") {
      const text = String(event.transcript ?? "");
      if (text) {
        this.emit({ type: "user.transcript.final", text });
      }
    }

    if (type === "response.function_call_arguments.done") {
      const name = String(event.name ?? "");
      const callId = String(event.call_id ?? "");
      const argsRaw = String(event.arguments ?? "{}");
      if (name === "ask_sebavio" && callId && this.config) {
        this.pendingToolCalls.set(callId, argsRaw);
        await this.handleAskTool(callId, argsRaw);
      }
    }

    if (type === "error") {
      this.setState("error");
      this.emit({
        type: "session.error",
        code: "realtime_error",
        message: "Erreur de session vocale Realtime.",
      });
    }
  }

  private async handleAskTool(callId: string, argsRaw: string): Promise<void> {
    if (!this.config) return;
    this.setState("processing");
    this.emit({ type: "tool.started", toolName: "ask_sebavio" });

    let message = "";
    try {
      const parsed = JSON.parse(argsRaw) as { message?: string };
      message = (parsed.message ?? "").trim();
    } catch {
      message = "";
    }

    try {
      const res = await fetch(this.config.askUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.config.sessionId,
          tripId: this.config.tripId,
          message: message || "Bonjour",
          liveLatitude: this.config.liveLatitude ?? null,
          liveLongitude: this.config.liveLongitude ?? null,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          spokenText?: string;
          structured?: unknown;
          confirmationRequired?: boolean;
          proposedAction?: unknown;
        };
        error?: { message?: string };
      };

      if (!res.ok || json.success === false) {
        throw new Error(
          json.error?.message ?? "Impossible d’obtenir une réponse vocale.",
        );
      }

      const spoken =
        json.data?.spokenText ??
        "Je n’ai pas pu obtenir de réponse pour le moment.";

      this.emit({
        type: "tool.completed",
        toolName: "ask_sebavio",
        result: json.data,
      });
      this.emit({
        type: "assistant.transcript.final",
        text: spoken,
        structured: json.data?.structured,
      });

      if (json.data?.confirmationRequired && json.data.proposedAction) {
        this.emit({
          type: "confirmation.required",
          action: json.data.proposedAction,
          message: spoken,
        });
      }

      this.sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({ spokenText: spoken }),
        },
      });
      this.sendEvent({ type: "response.create" });
    } catch {
      this.emit({
        type: "session.error",
        code: "ask_failed",
        message: "Impossible d’obtenir une réponse vocale.",
      });
    } finally {
      this.pendingToolCalls.delete(callId);
    }
  }

  private async cleanup(): Promise<void> {
    try {
      this.dc?.close();
    } catch {
      /* ignore */
    }
    this.dc = null;
    try {
      this.pc?.close();
    } catch {
      /* ignore */
    }
    this.pc = null;
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    const audio = document.getElementById("sebavio-voice-remote-audio");
    audio?.remove();
    this.bus.clear();
  }
}
