import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { PipelineVoiceProvider } from "@/features/ai/voice/providers/pipeline-provider";
import type { VoiceSessionConfig } from "@/features/ai/voice/types";

describe("ai voice pipeline provider", () => {
  let recognitionInstance: {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((e: unknown) => void) | null;
    onerror: ((e: unknown) => void) | null;
    onend: (() => void) | null;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    recognitionInstance = {
      lang: "",
      continuous: false,
      interimResults: false,
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    };

    class FakeSpeechRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult = null;
      onerror = null;
      onend = null;
      start = recognitionInstance.start;
      stop = recognitionInstance.stop;
      abort = recognitionInstance.abort;
      constructor() {
        Object.assign(recognitionInstance, this);
        return recognitionInstance as unknown as FakeSpeechRecognition;
      }
    }

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    });

    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      FakeSpeechRecognition;
    (
      window as unknown as { webkitSpeechRecognition?: unknown }
    ).webkitSpeechRecognition = FakeSpeechRecognition;

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop: vi.fn() }],
        })),
      },
    });

    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn((utter: { onend?: () => void; onstart?: () => void }) => {
        utter.onstart?.();
        utter.onend?.();
      }),
    };

    global.fetch = vi.fn(async () =>
      Response.json({
        success: true,
        data: {
          spokenText: "Bonjour du test.",
          structured: { summary: "Bonjour du test." },
        },
      }),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseConfig: VoiceSessionConfig = {
    sessionId: "sess-1",
    tripId: "trip-1",
    usageMode: "conversation",
    clientPlatform: "web",
    language: "fr-CA",
    askUrl: "/api/ai/voice/ask",
    endUrl: "/api/ai/voice/session/sess-1",
  };

  it("passe connecting → listening au connect", async () => {
    const provider = new PipelineVoiceProvider();
    const states: string[] = [];
    provider.subscribe((e) => {
      if (e.type === "state.changed") states.push(e.state);
    });

    await provider.connect(baseConfig);
    expect(provider.getState()).toBe("listening");
    expect(states).toContain("connecting");
    expect(states).toContain("listening");
  });

  it("demande le micro puis démarre la reconnaissance", async () => {
    const provider = new PipelineVoiceProvider();
    await provider.connect(baseConfig);
    await provider.startListening();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    expect(recognitionInstance.start).toHaveBeenCalled();
  });

  it("interrompt et annule speechSynthesis", async () => {
    const provider = new PipelineVoiceProvider();
    await provider.connect(baseConfig);
    await provider.startListening();
    await provider.interruptResponse();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it("nettoie au disconnect", async () => {
    const provider = new PipelineVoiceProvider();
    await provider.connect(baseConfig);
    await provider.startListening();
    await provider.disconnect();
    expect(provider.getState()).toBe("disconnected");
    expect(recognitionInstance.abort).toHaveBeenCalled();
  });

  it("émet erreur si micro refusé", async () => {
    (
      navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>
    ).mockRejectedValueOnce(new Error("denied"));

    const provider = new PipelineVoiceProvider();
    const errors: string[] = [];
    provider.subscribe((e) => {
      if (e.type === "session.error") errors.push(e.code);
    });
    await provider.connect(baseConfig);
    await provider.startListening();
    expect(errors).toContain("mic_denied");
    expect(provider.getState()).toBe("error");
  });
});
