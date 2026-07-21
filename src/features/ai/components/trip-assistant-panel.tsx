"use client";

import Link from "next/link";
import { Loader2, Paperclip, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SebavioAssistantIcon } from "@/features/ai/components/sebavio-assistant-icon";
import { useTripAssistant } from "@/features/ai/components/trip-assistant-context";
import { TripAssistantAnalysis } from "@/features/ai/components/analysis-sections";
import {
  AssistantSourcesList,
  WebSearchBadge,
} from "@/features/ai/components/assistant-sources";
import { ApplyActionDialog } from "@/features/ai/components/apply-action-dialog";
import { describeProposedAction } from "@/features/ai/services/apply-action-client";
import { QUICK_ACTIONS } from "@/features/ai/constants";
import { cn } from "@/lib/utils";
import type { TripAssistantSuggestion } from "@/features/ai/schemas/response";
import type { ProposedTripAction } from "@/features/ai/schemas/actions";

export function TripAssistantFab() {
  const { open, openPanel } = useTripAssistant();

  return (
    <button
      type="button"
      data-testid="trip-assistant-open"
      onClick={() => openPanel()}
      className={cn(
        "bg-sebavio-navy hover:bg-sebavio-navy/90 focus-visible:ring-sebavio-navy fixed z-40 flex h-[52px] items-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgb(14_45_70/0.28)] transition focus-visible:ring-2 focus-visible:outline-none",
        "right-7 bottom-[max(1.5rem,env(safe-area-inset-bottom))]",
        open && "sm:right-[calc(26.5rem+1.75rem)]",
        "max-sm:right-4 max-sm:left-4 max-sm:justify-center",
      )}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <span aria-hidden className="text-sebavio-gold">
        ✦
      </span>
      Demander à l’assistant
    </button>
  );
}

export function TripAssistantSheet() {
  const {
    open,
    setOpen,
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
    listRef,
    sendMessage,
    pendingAction,
    setPendingAction,
    locationError,
    largeDetourKm,
    clearActionErrors,
    confirmApply,
    abortVisual,
  } = useTripAssistant();

  const lastStructured = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.structured);

  const suggestions =
    lastStructured && lastStructured.role === "assistant"
      ? (lastStructured.structured?.suggestions ?? [])
      : [];
  const proposed =
    suggestions.find((s) => s.proposedAction != null)?.proposedAction ?? null;
  const proposedSuggestion = suggestions.find((s) => s.proposedAction != null);

  const statusLabel = !booted
    ? null
    : !aiEnabled
      ? "Temporairement indisponible"
      : canUsePersonalizedAi
        ? "En ligne"
        : "Aperçu";

  // Découverte : démo autorisée ; indisponible si AI_ENABLED=false
  const inputDisabled = pending || (booted && !aiEnabled);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-[100vw] border-l bg-[#f7fafc] p-0 sm:max-w-[420px]"
          aria-labelledby={titleId}
          showCloseButton
        >
          <SheetHeader className="border-b border-[rgb(14_45_70/0.08)] bg-white px-4 py-3">
            <SheetTitle
              id={titleId}
              className="flex items-center gap-2.5 text-base"
            >
              <SebavioAssistantIcon size={28} />
              <span className="text-sebavio-navy">Assistant Sebavio</span>
              {statusLabel ? (
                <span
                  className={cn(
                    "ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    statusLabel === "En ligne"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800",
                  )}
                >
                  {statusLabel === "En ligne" ? (
                    <span
                      className="size-1.5 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                  ) : null}
                  {statusLabel}
                </span>
              ) : null}
            </SheetTitle>
          </SheetHeader>

          <SheetBody
            ref={listRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            {!canUsePersonalizedAi && booted ? (
              <div
                className="border-sebavio-teal/20 rounded-xl border bg-white/90 p-4 text-sm"
                role="status"
              >
                <p className="text-sebavio-navy font-medium">
                  Aperçu de l’assistant
                </p>
                <p className="text-muted-foreground mt-1">
                  En forfait Découverte, aucune donnée de votre voyage n’est
                  envoyée à l’IA. Passez à un forfait compatible pour une
                  analyse personnalisée.
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
                L’Assistant Sebavio est temporairement indisponible.
              </p>
            ) : null}

            {messages.length === 0 && !pending ? (
              <div className="space-y-3">
                <p className="text-sebavio-navy/80 text-sm">
                  Que souhaitez-vous améliorer dans ce voyage ?
                </p>
                <div className="grid gap-2">
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
                        disabled={pending || lockedRec || !aiEnabled}
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
                  "flex gap-2",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {m.role === "assistant" ? (
                  <SebavioAssistantIcon size={22} className="mt-1" />
                ) : null}
                <div
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm",
                    m.role === "user"
                      ? "text-sebavio-navy bg-sky-50"
                      : "border-sebavio-navy/10 text-sebavio-navy border bg-white",
                  )}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </p>
                  {m.role === "assistant" && m.structured ? (
                    <div className="mt-3 space-y-3">
                      <WebSearchBadge
                        used={Boolean(m.structured.webSearchUsed)}
                      />
                      <TripAssistantAnalysis response={m.structured} />
                      <AssistantSourcesList
                        sources={m.structured.sources ?? []}
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
              </div>
            ))}

            {suggestions.length > 0 ? (
              <SuggestionsStrip
                suggestions={suggestions.slice(0, 3)}
                onPropose={setPendingAction}
              />
            ) : null}

            {proposed && proposedSuggestion ? (
              <ProposedActionCard
                suggestion={proposedSuggestion}
                action={proposed}
                onConfirm={() => setPendingAction(proposed)}
                onDetails={() => setPendingAction(proposed)}
              />
            ) : null}

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

          <SheetFooter className="gap-2 border-t border-[rgb(14_45_70/0.08)] bg-white px-4 py-3">
            {pending ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={abortVisual}
              >
                Masquer l’attente
              </Button>
            ) : null}
            <div className="flex items-end gap-2">
              <div className="relative min-w-0 flex-1">
                <Textarea
                  id="trip-assistant-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Posez une question…"
                  rows={2}
                  disabled={inputDisabled}
                  className="min-h-[64px] resize-none pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(draft, "chat");
                    }
                  }}
                  aria-label="Message à l’assistant"
                />
                <span
                  className="text-muted-foreground pointer-events-none absolute right-2.5 bottom-2.5"
                  aria-hidden
                >
                  <Paperclip className="size-4 opacity-40" />
                </span>
              </div>
              <Button
                type="button"
                size="icon"
                className="bg-sebavio-navy hover:bg-sebavio-navy/90 size-11 shrink-0 text-white"
                disabled={inputDisabled || !draft.trim()}
                onClick={() => sendMessage(draft, "chat")}
                aria-label="Envoyer"
              >
                <SendHorizonal className="size-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-center text-[10px] leading-snug">
              Sebavio peut faire des erreurs. Vérifiez les informations
              importantes.
            </p>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ApplyActionDialog
        action={pendingAction}
        open={pendingAction != null}
        onOpenChange={(next) => {
          if (!next) {
            setPendingAction(null);
            clearActionErrors();
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

function SuggestionsStrip({
  suggestions,
  onPropose,
}: {
  suggestions: TripAssistantSuggestion[];
  onPropose: (a: ProposedTripAction) => void;
}) {
  return (
    <div data-testid="trip-assistant-suggestions-strip">
      <p className="text-sebavio-navy mb-2 text-sm font-semibold">
        Suggestions pour vous
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((s) => {
          const deferred =
            s.proposedAction?.type === "create_detour" ||
            s.proposedAction?.type === "other";
          return (
            <button
              key={s.id}
              type="button"
              disabled={!s.proposedAction || deferred}
              onClick={() => {
                if (s.proposedAction) onPropose(s.proposedAction);
              }}
              className={cn(
                "min-w-[8.5rem] shrink-0 rounded-xl border px-3 py-2.5 text-left text-xs shadow-sm transition",
                s.type === "pause" && "border-violet-200 bg-violet-50",
                s.type === "weather" && "border-sky-200 bg-sky-50",
                s.type === "fuel_explanation" &&
                  "border-emerald-200 bg-emerald-50",
                s.type === "activity" && "border-orange-200 bg-orange-50",
                (s.type === "schedule" || s.type === "route_suggestion") &&
                  "border-slate-200 bg-white",
                (!s.proposedAction || deferred) && "opacity-60",
              )}
            >
              <span className="text-sebavio-navy line-clamp-2 font-semibold">
                {s.title}
              </span>
              {s.estimatedDelayMinutes != null ? (
                <span className="text-muted-foreground mt-0.5 block">
                  +{s.estimatedDelayMinutes} min
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProposedActionCard({
  suggestion,
  action,
  onConfirm,
  onDetails,
}: {
  suggestion: TripAssistantSuggestion;
  action: ProposedTripAction;
  onConfirm: () => void;
  onDetails: () => void;
}) {
  const deferred = action.type === "create_detour" || action.type === "other";
  return (
    <div
      className="border-sebavio-teal/25 rounded-xl border bg-white p-4 shadow-sm"
      data-testid="trip-assistant-proposed-action"
    >
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        Action proposée
      </p>
      <p className="text-sebavio-navy mt-1 text-sm font-semibold">
        {suggestion.title}
      </p>
      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
        {suggestion.description}
      </p>
      {suggestion.estimatedDelayMinutes != null ? (
        <p className="text-sebavio-navy mt-2 text-xs font-medium">
          Impact · +{suggestion.estimatedDelayMinutes} min
        </p>
      ) : null}
      {deferred ? (
        <p className="mt-3 text-xs text-amber-800">
          Cette modification ne peut pas encore être appliquée automatiquement.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-sebavio-navy hover:bg-sebavio-navy/90 text-white"
            onClick={onConfirm}
          >
            Confirmer l’ajout
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onDetails}>
            Voir les détails
          </Button>
        </div>
      )}
    </div>
  );
}

/** Compat : ancien export utilisé par la page. */
export function TripAssistantPanel(props: {
  tripId: string;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
  tripActive?: boolean;
}) {
  // Conservé pour imports legacy — préférer Provider + Fab + Sheet.
  void props;
  return null;
}
