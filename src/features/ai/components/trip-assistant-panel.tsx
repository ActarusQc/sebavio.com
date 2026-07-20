"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Sparkles, SendHorizonal, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  applyTripAssistantActionAction,
  getTripAssistantBootstrapAction,
  sendTripAssistantMessageAction,
} from "@/features/ai/actions";
import { QUICK_ACTIONS } from "@/features/ai/constants";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type { ProposedTripAction } from "@/features/ai/schemas/actions";
import { describeProposedAction } from "@/features/ai/services/apply-action-client";
import { TripAssistantAnalysis } from "@/features/ai/components/analysis-sections";
import { TripAssistantSuggestions } from "@/features/ai/components/suggestion-cards";
import { ApplyActionDialog } from "@/features/ai/components/apply-action-dialog";
import { cn } from "@/lib/utils";

type ChatItem =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      structured: TripAssistantResponse | null;
      mode?: "personalized" | "demo";
    };

type TripAssistantPanelProps = {
  tripId: string;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
  tripActive?: boolean;
};

export function TripAssistantPanel({
  tripId,
  liveLatitude,
  liveLongitude,
  tripActive = false,
}: TripAssistantPanelProps) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [booted, setBooted] = useState(false);
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
  const abortVisual = useRef(false);

  useEffect(() => {
    if (!open || booted) return;
    startTransition(async () => {
      const result = await getTripAssistantBootstrapAction(tripId);
      if (!result.ok) {
        setError(result.message);
        setBooted(true);
        return;
      }
      setCanUsePersonalizedAi(result.data.canUsePersonalizedAi);
      setCanUseRecommendations(result.data.canUseRecommendations);
      setAiEnabled(result.data.aiEnabled);
      const history = result.data.conversation?.messages ?? [];
      setMessages(
        history.map((m) =>
          m.role === "user"
            ? { id: m.id, role: "user" as const, content: m.content }
            : {
                id: m.id,
                role: "assistant" as const,
                content: m.content,
                structured: m.structuredPayload,
              },
        ),
      );
      setBooted(true);
    });
  }, [open, booted, tripId]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  function sendMessage(
    message: string,
    requestType:
      (typeof QUICK_ACTIONS)[number]["requestType"] | "chat" = "chat",
  ) {
    const trimmed = message.trim();
    if (!trimmed || pending) return;

    if (
      (requestType === "suggest_activities" || requestType === "weather") &&
      canUsePersonalizedAi &&
      !canUseRecommendations
    ) {
      setError(
        "Les recommandations IA ne sont pas incluses dans votre forfait actuel.",
      );
      return;
    }

    abortVisual.current = false;
    setError(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${prev.length}-${trimmed.length}`,
        role: "user",
        content: trimmed,
      },
    ]);
    setDraft("");

    startTransition(async () => {
      const result = await sendTripAssistantMessageAction({
        tripId,
        message: trimmed,
        requestType,
        includeLiveLocation: tripActive,
        liveLatitude: tripActive ? liveLatitude : null,
        liveLongitude: tripActive ? liveLongitude : null,
      });

      if (abortVisual.current) return;

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
        },
      ]);
    });
  }

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
        },
      ]);
      if (result.data.applied) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="default"
              className="bg-sebavio-navy hover:bg-sebavio-navy/90 gap-2 text-white"
              data-testid="trip-assistant-open"
            />
          }
        >
          <Sparkles className="size-4" aria-hidden />
          Demander à l’assistant
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-[linear-gradient(180deg,#f7fbfd_0%,#ffffff_28%)]"
          aria-labelledby={titleId}
        >
          <SheetHeader>
            <SheetTitle id={titleId} className="flex items-center gap-2">
              <span
                className="bg-sebavio-teal/15 text-sebavio-teal inline-flex size-7 items-center justify-center rounded-full"
                aria-hidden
              >
                <Sparkles className="size-3.5" />
              </span>
              Assistant Sebavio
            </SheetTitle>
            <SheetDescription>
              Une étoile pour éclairer votre route — à partir des données de ce
              voyage.
            </SheetDescription>
          </SheetHeader>

          <SheetBody ref={listRef} className="space-y-4">
            {!canUsePersonalizedAi && booted ? (
              <div
                className="border-sebavio-teal/20 rounded-xl border bg-white/80 p-4 text-sm"
                role="status"
              >
                <p className="text-sebavio-navy font-medium">
                  Aperçu de l’assistant
                </p>
                <p className="text-muted-foreground mt-1">
                  En forfait Découverte, aucune donnée de votre voyage n’est
                  envoyée à l’IA. Passez à un forfait payant pour une analyse
                  personnalisée.
                </p>
                <Button
                  render={<Link href="/pricing" />}
                  className="mt-3"
                  size="sm"
                >
                  Voir les forfaits
                </Button>
              </div>
            ) : null}

            {canUsePersonalizedAi && !aiEnabled && booted ? (
              <p className="text-muted-foreground text-sm" role="status">
                L’assistant est temporairement indisponible.
              </p>
            ) : null}

            {messages.length === 0 && !pending ? (
              <div className="space-y-3">
                <p className="text-sebavio-navy/80 text-sm">
                  Que souhaitez-vous améliorer dans ce voyage ?
                </p>
                <div className="grid gap-2 sm:grid-cols-1">
                  {QUICK_ACTIONS.map((action) => {
                    const lockedRec =
                      (action.requestType === "suggest_activities" ||
                        action.requestType === "weather") &&
                      canUsePersonalizedAi &&
                      !canUseRecommendations;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        disabled={pending || lockedRec}
                        onClick={() =>
                          sendMessage(action.prompt, action.requestType)
                        }
                        className={cn(
                          "border-sebavio-navy/10 hover:border-sebavio-teal/40 hover:bg-sebavio-teal/5 focus-visible:ring-sebavio-teal rounded-xl border bg-white px-3 py-3 text-left text-sm shadow-sm transition focus-visible:ring-2 focus-visible:outline-none",
                          lockedRec && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <span className="text-sebavio-navy font-medium">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[95%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-sebavio-navy ml-auto text-white"
                    : "border-sebavio-navy/10 text-sebavio-navy mr-auto border bg-white",
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.role === "assistant" && m.structured ? (
                  <div className="mt-3 space-y-3">
                    <TripAssistantAnalysis response={m.structured} />
                    <TripAssistantSuggestions
                      suggestions={m.structured.suggestions}
                      warnings={m.structured.warnings}
                      onProposeAction={setPendingAction}
                    />
                    {m.mode === "demo" ? (
                      <Button
                        render={<Link href="/pricing" />}
                        size="sm"
                        variant="outline"
                      >
                        Passer à un forfait payant
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}

            {pending ? (
              <p
                className="text-muted-foreground flex items-center gap-2 text-sm"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Sebavio analyse votre voyage…
              </p>
            ) : null}

            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </SheetBody>

          <SheetFooter className="space-y-2">
            {pending ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  abortVisual.current = true;
                }}
              >
                Masquer l’attente
              </Button>
            ) : null}
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Posez votre question…"
                rows={2}
                disabled={pending}
                className="min-h-[64px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(draft, "chat");
                  }
                }}
                aria-label="Message à l’assistant"
              />
              <Button
                type="button"
                size="icon"
                disabled={pending || !draft.trim()}
                onClick={() => sendMessage(draft, "chat")}
                aria-label="Envoyer"
              >
                <SendHorizonal className="size-4" />
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ApplyActionDialog
        action={pendingAction}
        open={pendingAction != null}
        onOpenChange={(next) => {
          if (!next) {
            setPendingAction(null);
            setLocationError(null);
            setLargeDetourKm(null);
          }
        }}
        onConfirm={(action) => void confirmApply(action)}
        description={
          pendingAction ? describeProposedAction(pendingAction) : null
        }
        locationError={locationError}
        largeDetourKm={largeDetourKm}
      />
    </>
  );
}
