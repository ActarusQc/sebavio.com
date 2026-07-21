import { VoiceEventBus } from "@/features/ai/voice/providers/event-bus";
import type {
  VoiceAgentEvent,
  VoiceConversationProvider,
  VoiceConversationState,
  VoiceSessionConfig,
} from "@/features/ai/voice/types";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Provider pipeline : Web Speech API (STT) + speechSynthesis (TTS) + POST ask.
 */
export class PipelineVoiceProvider implements VoiceConversationProvider {
  private bus = new VoiceEventBus();
  private state: VoiceConversationState = "idle";
  private config: VoiceSessionConfig | null = null;
  private recognition: SpeechRecognitionLike | null = null;
  private muted = false;
  private listening = false;
  private destroyed = false;

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
    if (!this.config || this.destroyed) return;

    this.setState("requesting_permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      this.setState("error");
      this.emit({
        type: "session.error",
        code: "mic_denied",
        message:
          "L’accès au micro est requis pour parler avec l’assistant. Autorisez le micro dans votre navigateur.",
      });
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.setState("error");
      this.emit({
        type: "session.error",
        code: "stt_unavailable",
        message:
          "La reconnaissance vocale n’est pas supportée par ce navigateur.",
      });
      return;
    }

    this.recognition?.abort();
    const recognition = new Ctor();
    recognition.lang = this.config.language || "fr-CA";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += text;
        else interim += text;
      }
      if (interim) {
        this.emit({ type: "user.transcript.partial", text: interim });
      }
      if (finalText.trim()) {
        this.emit({ type: "user.transcript.final", text: finalText.trim() });
        void this.handleFinalTranscript(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      this.setState("error");
      this.emit({
        type: "session.error",
        code: event.error,
        message: "Une erreur de reconnaissance vocale est survenue.",
      });
    };

    recognition.onend = () => {
      this.listening = false;
      if (
        !this.destroyed &&
        this.state !== "processing" &&
        this.state !== "speaking" &&
        this.state !== "error" &&
        this.state !== "disconnected"
      ) {
        this.setState("listening");
      }
    };

    this.recognition = recognition;
    this.listening = true;
    this.setState("listening");
    recognition.start();
  }

  async stopListening(): Promise<void> {
    this.listening = false;
    try {
      this.recognition?.stop();
    } catch {
      /* ignore */
    }
  }

  async interruptResponse(): Promise<void> {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    try {
      this.recognition?.abort();
    } catch {
      /* ignore */
    }
    this.setState("interrupted");
    this.emit({ type: "assistant.audio.stopped" });
    if (!this.destroyed) {
      this.setState("listening");
      if (this.listening) {
        await this.startListening();
      }
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted && typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
  }

  private async handleFinalTranscript(text: string): Promise<void> {
    if (!this.config || this.destroyed) return;
    this.setState("processing");

    try {
      this.emit({ type: "tool.started", toolName: "ask_sebavio" });
      const res = await fetch(this.config.askUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.config.sessionId,
          tripId: this.config.tripId,
          message: text,
          liveLatitude: this.config.liveLatitude ?? null,
          liveLongitude: this.config.liveLongitude ?? null,
        }),
      });

      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          spokenText?: string;
          displayAnswer?: string;
          structured?: unknown;
          confirmationRequired?: boolean;
          proposedAction?: unknown;
        };
        error?: { message?: string; code?: string };
      };

      if (!res.ok || json.success === false) {
        throw new Error(
          json.error?.message ?? "Impossible d’obtenir une réponse vocale.",
        );
      }

      const spoken =
        json.data?.spokenText ??
        json.data?.displayAnswer ??
        "Je n’ai pas de réponse pour le moment.";

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

      await this.speak(spoken);
    } catch (error) {
      this.setState("error");
      this.emit({
        type: "session.error",
        code: "ask_failed",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d’obtenir une réponse vocale.",
      });
    }
  }

  private speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (
        this.muted ||
        typeof window === "undefined" ||
        !window.speechSynthesis
      ) {
        this.setState("listening");
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = this.config?.language || "fr-CA";
      utter.onstart = () => {
        this.setState("speaking");
        this.emit({ type: "assistant.audio.started" });
      };
      utter.onend = () => {
        this.emit({ type: "assistant.audio.stopped" });
        if (!this.destroyed) this.setState("listening");
        resolve();
      };
      utter.onerror = () => {
        this.emit({ type: "assistant.audio.stopped" });
        if (!this.destroyed) this.setState("listening");
        resolve();
      };
      window.speechSynthesis.speak(utter);
    });
  }

  private async cleanup(): Promise<void> {
    try {
      this.recognition?.abort();
    } catch {
      /* ignore */
    }
    this.recognition = null;
    this.listening = false;
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
    this.bus.clear();
  }
}
