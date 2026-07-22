"use client";

import { useEffect, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { AITripComposer } from "@/features/ai-trip-planner/components/ai-trip-composer";
import { AITripMessage } from "@/features/ai-trip-planner/components/ai-trip-message";
import { AIAddressInput } from "@/features/ai-trip-planner/components/ai-address-input";
import { AIItineraryProposal } from "@/features/ai-trip-planner/components/ai-itinerary-proposal";
import { AILodgingOptions } from "@/features/ai-trip-planner/components/ai-lodging-options";
import { AIPlannerMultiSelect } from "@/features/ai-trip-planner/components/ai-planner-multi-select";
import {
  ANY_INTEREST_LABEL,
  CONTINUE_INTERESTS_LABEL,
  NONE_INTEREST_LABEL,
} from "@/features/ai-trip-planner/lib/travel-interests";
import type {
  ItineraryProposalDto,
  LodgingOptionDto,
  OriginSuggestionDto,
  PlannerMessage,
  RequestedInputDto,
} from "@/features/ai-trip-planner/types";
import type { AddressSelection } from "@/types/address";

type Props = {
  messages: PlannerMessage[];
  sending?: boolean;
  disabled?: boolean;
  error?: string | null;
  requestedInput?: RequestedInputDto;
  /** Autorité serveur — remplace les QR du dernier message. */
  activeQuickReplies?: string[];
  proposal?: ItineraryProposalDto | null;
  lodgingOptions?: LodgingOptionDto[];
  lodgingTypeLabel?: string | null;
  showLodgingPicker?: boolean;
  homeCity?: string | null;
  originSuggestions?: OriginSuggestionDto[];
  onSend: (content: string) => void;
  onSelectAddress?: (
    field: "origin" | "destination",
    address: AddressSelection,
  ) => void;
  onUseHome?: () => void;
  onSelectLodging?: (option: LodgingOptionDto) => void;
  onSkipLodging?: () => void;
  onRefreshLodging?: () => void;
  onRetry?: () => void;
};

export function AITripConversation({
  messages,
  sending,
  disabled,
  error,
  requestedInput,
  activeQuickReplies,
  proposal,
  lodgingOptions = [],
  lodgingTypeLabel,
  showLodgingPicker,
  homeCity,
  originSuggestions,
  onSend,
  onSelectAddress,
  onUseHome,
  onSelectLodging,
  onSkipLodging,
  onRefreshLodging,
  onRetry,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending, requestedInput]);

  useEffect(() => {
    if (!liveRef.current) return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last) {
      liveRef.current.textContent = last.content;
    }
  }, [messages]);

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") return i;
    }
    return -1;
  })();

  const showAddress =
    !disabled &&
    !sending &&
    requestedInput?.type === "address" &&
    (requestedInput.field === "origin" ||
      requestedInput.field === "destination");

  const showMultiChoice =
    !disabled &&
    !sending &&
    requestedInput?.type === "multi_choice" &&
    (requestedInput.choices?.length ?? 0) > 0;

  return (
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_8px_28px_rgba(8,43,70,0.05)] lg:min-h-[36rem]">
      <header className="flex items-center gap-2 border-b border-[#e8eef3] px-4 py-3.5 sm:px-5">
        <Sparkles className="text-sebavio-gold size-4" aria-hidden />
        <h2 className="font-heading text-sebavio-navy text-base font-semibold">
          Assistant de planification
        </h2>
      </header>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message, index) => {
          const isLastAssistant = index === lastAssistantIdx;
          const overrides =
            isLastAssistant && activeQuickReplies
              ? { ...message, quickReplies: activeQuickReplies }
              : message;
          return (
            <AITripMessage
              key={message.id}
              message={overrides}
              showQuickReplies={
                isLastAssistant && !sending && !disabled && !showMultiChoice
              }
              onQuickReply={onSend}
              quickRepliesDisabled={disabled || sending}
            />
          );
        })}

        {proposal && !sending && !showLodgingPicker ? (
          <AIItineraryProposal proposal={proposal} />
        ) : null}

        {showLodgingPicker && onSelectLodging ? (
          <AILodgingOptions
            options={lodgingOptions}
            lodgingTypeLabel={lodgingTypeLabel}
            disabled={disabled || sending}
            onSelect={onSelectLodging}
            onSkip={onSkipLodging}
            onRefresh={onRefreshLodging}
          />
        ) : null}

        {showMultiChoice && requestedInput?.choices ? (
          <AIPlannerMultiSelect
            choices={requestedInput.choices}
            confirmLabel={CONTINUE_INTERESTS_LABEL}
            anyLabel={ANY_INTEREST_LABEL}
            noneLabel={NONE_INTEREST_LABEL}
            minimumSelections={requestedInput.minimumSelections ?? 1}
            maximumSelections={requestedInput.maximumSelections ?? null}
            disabled={disabled || sending}
            onConfirm={(selected) => {
              if (selected.length === 0) {
                onSend(NONE_INTEREST_LABEL);
                return;
              }
              onSend(
                `${CONTINUE_INTERESTS_LABEL} : ${selected
                  .map((c) => c.label)
                  .join(" · ")}`,
              );
            }}
            onAny={() => onSend(ANY_INTEREST_LABEL)}
          />
        ) : null}

        {showAddress && onSelectAddress ? (
          <AIAddressInput
            field={requestedInput.field as "origin" | "destination"}
            placeholder={requestedInput.placeholder}
            homeCity={homeCity}
            suggestions={
              requestedInput.field === "origin" ? originSuggestions : []
            }
            disabled={disabled || sending}
            onSelectAddress={(addr) =>
              onSelectAddress(
                requestedInput.field as "origin" | "destination",
                addr,
              )
            }
            onUseHome={
              requestedInput.field === "origin" ? onUseHome : undefined
            }
            onQuickCity={onSend}
          />
        ) : null}

        {sending ? (
          <div
            className="text-sebavio-slate flex items-center gap-2 text-sm"
            role="status"
            aria-live="assertive"
          >
            <Loader2 className="text-sebavio-gold size-4 animate-spin" />
            L’assistant réfléchit…
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            <p>{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-sm font-semibold underline underline-offset-2"
              >
                Réessayer
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div ref={liveRef} className="sr-only" aria-live="polite" />

      <AITripComposer onSend={onSend} disabled={disabled} sending={sending} />
    </section>
  );
}
