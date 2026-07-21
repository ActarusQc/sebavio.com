"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import {
  applyTripAssistantActionAction,
  getTripAssistantBootstrapAction,
  sendTripAssistantMessageAction,
} from "@/features/ai/actions";
import { QUICK_ACTIONS } from "@/features/ai/constants";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type { ProposedTripAction } from "@/features/ai/schemas/actions";

export type ChatItem =
  | { id: string; role: "user"; content: string; createdAt?: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      structured: TripAssistantResponse | null;
      mode?: "personalized" | "demo";
      createdAt?: string;
    };

export type QuickActionId = (typeof QUICK_ACTIONS)[number]["id"];

type TripAssistantContextValue = {
  tripId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  openPanel: (opts?: {
    quickActionId?: QuickActionId;
    focusInput?: boolean;
  }) => void;
  titleId: string;
  booted: boolean;
  canUsePersonalizedAi: boolean;
  canUseRecommendations: boolean;
  aiEnabled: boolean;
  messages: ChatItem[];
  draft: string;
  setDraft: (v: string) => void;
  error: string | null;
  pending: boolean;
  lastAnalysis: {
    response: TripAssistantResponse;
    createdAt: string;
  } | null;
  pendingAction: ProposedTripAction | null;
  setPendingAction: (a: ProposedTripAction | null) => void;
  locationError: string | null;
  largeDetourKm: number | null;
  clearActionErrors: () => void;
  listRef: RefObject<HTMLDivElement | null>;
  sendMessage: (
    message: string,
    requestType?: (typeof QUICK_ACTIONS)[number]["requestType"] | "chat",
  ) => void;
  runQuickAction: (id: QuickActionId) => void;
  confirmApply: (action: ProposedTripAction) => void;
  abortVisual: () => void;
};

const TripAssistantContext = createContext<TripAssistantContextValue | null>(
  null,
);

type ProviderProps = {
  tripId: string;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
  tripActive?: boolean;
  children: ReactNode;
};

export function TripAssistantProvider({
  tripId,
  liveLatitude = null,
  liveLongitude = null,
  tripActive = false,
  children,
}: ProviderProps) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [booted, setBooted] = useState(false);
  const [summaryBooted, setSummaryBooted] = useState(false);
  const [canUsePersonalizedAi, setCanUsePersonalizedAi] = useState(false);
  const [canUseRecommendations, setCanUseRecommendations] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<ProposedTripAction | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [largeDetourKm, setLargeDetourKm] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortVisualRef = useRef(false);
  const pendingQuickRef = useRef<QuickActionId | null>(null);
  const sendingRef = useRef(false);

  const hydrateFromBootstrap = useCallback(
    (data: {
      canUsePersonalizedAi: boolean;
      canUseRecommendations: boolean;
      aiEnabled: boolean;
      conversation: {
        messages: Array<{
          id: string;
          role: string;
          content: string;
          structuredPayload: TripAssistantResponse | null;
          createdAt: string;
        }>;
      } | null;
    }) => {
      setCanUsePersonalizedAi(data.canUsePersonalizedAi);
      setCanUseRecommendations(data.canUseRecommendations);
      setAiEnabled(data.aiEnabled);
      const history = data.conversation?.messages ?? [];
      setMessages(
        history.map((m) =>
          m.role === "user"
            ? {
                id: m.id,
                role: "user" as const,
                content: m.content,
                createdAt: m.createdAt,
              }
            : {
                id: m.id,
                role: "assistant" as const,
                content: m.content,
                structured: m.structuredPayload,
                createdAt: m.createdAt,
              },
        ),
      );
    },
    [],
  );

  // Bootstrap léger au montage (historique DB uniquement — pas d’appel OpenAI).
  useEffect(() => {
    if (summaryBooted) return;
    let cancelled = false;
    void (async () => {
      const result = await getTripAssistantBootstrapAction(tripId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setSummaryBooted(true);
        setBooted(true);
        return;
      }
      hydrateFromBootstrap(result.data);
      setSummaryBooted(true);
      setBooted(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, summaryBooted, hydrateFromBootstrap]);

  useEffect(() => {
    if (!open) return;
    const q = pendingQuickRef.current;
    if (q) {
      pendingQuickRef.current = null;
      const action = QUICK_ACTIONS.find((a) => a.id === q);
      if (action) {
        // Différer pour laisser le sheet s’ouvrir.
        const t = window.setTimeout(() => {
          sendMessageInternal(action.prompt, action.requestType);
        }, 50);
        return () => window.clearTimeout(t);
      }
    }
    const t = window.setTimeout(() => {
      document.getElementById("trip-assistant-input")?.focus();
    }, 120);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus à l’ouverture uniquement
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof el.scrollTo !== "function") return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  function sendMessageInternal(
    message: string,
    requestType:
      (typeof QUICK_ACTIONS)[number]["requestType"] | "chat" = "chat",
  ) {
    const trimmed = message.trim();
    if (!trimmed || sendingRef.current) return;

    if (
      (requestType === "suggest_activities" || requestType === "weather") &&
      canUsePersonalizedAi &&
      !canUseRecommendations
    ) {
      setError(
        "Les recommandations IA ne sont pas incluses dans votre forfait actuel.",
      );
      setOpen(true);
      return;
    }

    abortVisualRef.current = false;
    sendingRef.current = true;
    setError(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${prev.length}-${trimmed.length}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");

    startTransition(async () => {
      try {
        const result = await sendTripAssistantMessageAction({
          tripId,
          message: trimmed,
          requestType,
          includeLiveLocation: tripActive,
          liveLatitude: tripActive ? liveLatitude : null,
          liveLongitude: tripActive ? liveLongitude : null,
        });

        if (abortVisualRef.current) return;

        if (!result.ok) {
          setError(result.message);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${prev.length}-${result.data.response.summary.length}`,
            role: "assistant",
            content: result.data.response.answer,
            structured: result.data.response,
            mode: result.data.mode,
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        sendingRef.current = false;
      }
    });
  }

  const sendMessage = useCallback(
    (
      message: string,
      requestType:
        (typeof QUICK_ACTIONS)[number]["requestType"] | "chat" = "chat",
    ) => {
      setOpen(true);
      sendMessageInternal(message, requestType);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      pending,
      canUsePersonalizedAi,
      canUseRecommendations,
      tripId,
      tripActive,
      liveLatitude,
      liveLongitude,
    ],
  );

  const runQuickAction = useCallback(
    (id: QuickActionId) => {
      const action = QUICK_ACTIONS.find((a) => a.id === id);
      if (!action) return;
      if (!open) {
        pendingQuickRef.current = id;
        setOpen(true);
        return;
      }
      sendMessageInternal(action.prompt, action.requestType);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, pending, canUsePersonalizedAi, canUseRecommendations],
  );

  const openPanel = useCallback(
    (opts?: { quickActionId?: QuickActionId; focusInput?: boolean }) => {
      if (opts?.quickActionId) {
        pendingQuickRef.current = opts.quickActionId;
      }
      setOpen(true);
      if (opts?.focusInput !== false) {
        window.setTimeout(() => {
          document.getElementById("trip-assistant-input")?.focus();
        }, 150);
      }
    },
    [],
  );

  async function confirmApply(action: ProposedTripAction) {
    setPendingAction(null);
    setLocationError(null);
    startTransition(async () => {
      const result = await applyTripAssistantActionAction({
        tripId,
        action,
        confirm: true,
      });
      if (!result.ok) {
        if (
          result.code === "AI_ACTION_LOCATION_REQUIRED" ||
          result.code === "AI_ACTION_LOCATION_OUT_OF_CORRIDOR"
        ) {
          setPendingAction(action);
          setLocationError(result.message);
          return;
        }
        if (result.code === "AI_ACTION_LARGE_DETOUR") {
          setPendingAction(action);
          setLargeDetourKm(
            "estimatedAddedKm" in result &&
              typeof result.estimatedAddedKm === "number"
              ? result.estimatedAddedKm
              : null,
          );
          setLocationError(result.message);
          return;
        }
        setError(result.message);
        return;
      }
      setLargeDetourKm(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${prev.length}`,
          role: "assistant",
          content: result.data.message,
          structured: null,
          createdAt: new Date().toISOString(),
        },
      ]);
      if (result.data.applied) {
        router.refresh();
      }
    });
  }

  const lastAnalysis = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m?.role === "assistant" && m.structured) {
        return {
          response: m.structured,
          createdAt: m.createdAt ?? new Date().toISOString(),
        };
      }
    }
    return null;
  }, [messages]);

  const value: TripAssistantContextValue = {
    tripId,
    open,
    setOpen,
    openPanel,
    titleId,
    booted,
    canUsePersonalizedAi,
    canUseRecommendations,
    aiEnabled,
    messages,
    draft,
    setDraft,
    error,
    pending,
    lastAnalysis,
    pendingAction,
    setPendingAction,
    locationError,
    largeDetourKm,
    clearActionErrors: () => {
      setLocationError(null);
      setLargeDetourKm(null);
    },
    listRef,
    sendMessage,
    runQuickAction,
    confirmApply,
    abortVisual: () => {
      abortVisualRef.current = true;
    },
  };

  return (
    <TripAssistantContext.Provider value={value}>
      {children}
    </TripAssistantContext.Provider>
  );
}

export function useTripAssistant(): TripAssistantContextValue {
  const ctx = useContext(TripAssistantContext);
  if (!ctx) {
    throw new Error(
      "useTripAssistant doit être utilisé dans TripAssistantProvider",
    );
  }
  return ctx;
}
