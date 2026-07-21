"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createVoiceConversationProvider } from "@/features/ai/voice/providers/create-provider";
import { VOICE_SESSION_PATH } from "@/features/ai/voice/constants";
import type {
  VoiceAgentEvent,
  VoiceConversationState,
  VoiceProviderName,
  VoiceSessionConfig,
  VoiceUsageMode,
} from "@/features/ai/voice/types";

export type VoiceBootstrapInfo = {
  enabled: boolean;
  canUseVoice: boolean;
  provider: VoiceProviderName;
  unavailableMessage: string;
};

type UseVoiceConversationParams = {
  tripId: string;
  usageMode?: VoiceUsageMode;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
  voiceInfo?: VoiceBootstrapInfo | null;
  onTranscript?: (item: {
    role: "user" | "assistant";
    content: string;
    structured?: unknown;
  }) => void;
};

export function useVoiceConversation(params: UseVoiceConversationParams) {
  const {
    tripId,
    usageMode = "conversation",
    liveLatitude = null,
    liveLongitude = null,
    voiceInfo = null,
    onTranscript,
  } = params;

  const [state, setState] = useState<VoiceConversationState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);
  const [transcripts, setTranscripts] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const [active, setActive] = useState(false);

  const providerRef = useRef<ReturnType<
    typeof createVoiceConversationProvider
  > | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const liveRef = useRef({ liveLatitude, liveLongitude });

  useEffect(() => {
    liveRef.current = { liveLatitude, liveLongitude };
  }, [liveLatitude, liveLongitude]);

  const handleEvent = useCallback(
    (event: VoiceAgentEvent) => {
      if (event.type === "state.changed") {
        setState(event.state);
      }
      if (event.type === "session.error") {
        setError(event.message);
        setState("error");
      }
      if (event.type === "user.transcript.final") {
        setTranscripts((prev) => [
          ...prev.slice(-19),
          { role: "user", text: event.text },
        ]);
        onTranscript?.({ role: "user", content: event.text });
      }
      if (event.type === "assistant.transcript.final") {
        setTranscripts((prev) => [
          ...prev.slice(-19),
          { role: "assistant", text: event.text },
        ]);
        onTranscript?.({
          role: "assistant",
          content: event.text,
          structured: event.structured,
        });
      }
      if (event.type === "session.ended") {
        setActive(false);
        setSessionId(null);
      }
    },
    [onTranscript],
  );

  const stop = useCallback(async () => {
    const provider = providerRef.current;
    const sid = sessionId;
    unsubRef.current?.();
    unsubRef.current = null;
    if (provider) {
      await provider.disconnect();
      providerRef.current = null;
    }
    if (sid) {
      try {
        await fetch(`${VOICE_SESSION_PATH}/${sid}`, {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "user_quit" }),
        });
      } catch {
        /* best-effort */
      }
    }
    setActive(false);
    setSessionId(null);
    setState("idle");
  }, [sessionId]);

  const start = useCallback(async () => {
    if (!voiceInfo?.enabled || !voiceInfo.canUseVoice) {
      setError(
        voiceInfo?.unavailableMessage ?? "L’agent vocal n’est pas disponible.",
      );
      return;
    }

    setError(null);
    setState("connecting");

    try {
      const res = await fetch(VOICE_SESSION_PATH, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          usageMode,
          clientPlatform: "web",
        }),
      });
      const json = (await res.json()) as {
        data?: {
          sessionId: string;
          provider: VoiceProviderName;
          clientSecret?: string;
          realtimeModel?: string;
          realtimeVoice?: string;
          language: string;
          askPath: string;
          endPath: string;
          heartbeatPath?: string;
        };
        error?: { message?: string };
      };

      if (!res.ok || !json.data) {
        throw new Error(
          json.error?.message ?? "Impossible de démarrer la session vocale.",
        );
      }

      const data = json.data;
      const provider = createVoiceConversationProvider(data.provider);
      providerRef.current = provider;
      unsubRef.current = provider.subscribe(handleEvent);

      const config: VoiceSessionConfig = {
        sessionId: data.sessionId,
        tripId,
        usageMode,
        clientPlatform: "web",
        language: data.language,
        clientSecret: data.clientSecret,
        realtimeModel: data.realtimeModel,
        realtimeVoice: data.realtimeVoice,
        askUrl: data.askPath,
        endUrl: data.endPath,
        heartbeatUrl: data.heartbeatPath,
        liveLatitude: liveRef.current.liveLatitude,
        liveLongitude: liveRef.current.liveLongitude,
      };

      await provider.connect(config);
      setSessionId(data.sessionId);
      setActive(true);
      await provider.startListening();
    } catch (err) {
      setState("error");
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de démarrer la session vocale.",
      );
    }
  }, [tripId, usageMode, voiceInfo, handleEvent]);

  const interrupt = useCallback(async () => {
    await providerRef.current?.interruptResponse();
  }, []);

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    providerRef.current?.setMuted(next);
  }, []);

  useEffect(() => {
    return () => {
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup unmount only
  }, []);

  return {
    state,
    sessionId,
    error,
    muted,
    setMuted,
    transcripts,
    active,
    start,
    stop,
    interrupt,
    canUseVoice: Boolean(voiceInfo?.enabled && voiceInfo.canUseVoice),
  };
}
