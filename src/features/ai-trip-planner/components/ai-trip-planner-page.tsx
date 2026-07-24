"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AITripConversation } from "@/features/ai-trip-planner/components/ai-trip-conversation";
import { AITripPlannerHero } from "@/features/ai-trip-planner/components/ai-trip-planner-hero";
import { AITripSummary } from "@/features/ai-trip-planner/components/ai-trip-summary";
import { CreateTripConfirmationDialog } from "@/features/ai-trip-planner/components/create-trip-confirmation-dialog";
import { RestartPlanningDialog } from "@/features/ai-trip-planner/components/restart-planning-dialog";
import { CONFIRM_YES } from "@/features/ai-trip-planner/lib/controls-for-step";
import { useAITripPlanningSession } from "@/features/ai-trip-planner/hooks/use-ai-trip-planning-session";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function AITripPlannerPage() {
  const router = useRouter();
  const conversationAnchorRef = useRef<HTMLDivElement>(null);
  const [restartOpen, setRestartOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    trackEvent("assistant_opened", {
      surface: "assistant",
      path: "/dashboard/ai",
    });
  }, []);

  const {
    session,
    access,
    loading,
    sending,
    creating,
    error,
    successTripId,
    sendMessage,
    selectPlace,
    selectLodging,
    restart,
    createTrip,
    retry,
  } = useAITripPlanningSession();

  const handleSend = async (content: string) => {
    const next = await sendMessage(content);
    if (
      content.trim() === CONFIRM_YES &&
      next?.draft.proposalConfirmed &&
      next.canCreate
    ) {
      trackEvent("assistant_trip_action_confirmed", {
        surface: "assistant",
        path: "/dashboard/ai",
      });
      trackEvent("trip_creation_started", {
        surface: "assistant",
        path: "/dashboard/ai",
      });
      const tripId = await createTrip(next.id);
      if (tripId) {
        trackEvent("trip_created", {
          surface: "assistant",
          path: "/dashboard/ai",
        });
        router.push(`/dashboard/trips/${tripId}`);
      }
    }
  };

  if (loading) {
    return (
      <div
        className="text-sebavio-slate flex min-h-[50vh] items-center justify-center gap-2"
        role="status"
      >
        <Loader2 className="text-sebavio-gold size-5 animate-spin" />
        Chargement de la planification…
      </div>
    );
  }

  if (access && !access.canUse) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 rounded-2xl border border-[#dfe7ef] bg-white p-6 shadow-[0_8px_28px_rgba(8,43,70,0.05)] sm:p-8">
        <div className="text-sebavio-gold flex items-center gap-2">
          <Sparkles className="size-5" aria-hidden />
          <h1 className="font-heading text-sebavio-navy text-xl font-bold">
            Planifier avec l’IA
          </h1>
        </div>
        <p className="text-sebavio-slate text-sm leading-relaxed">
          {access.reason ??
            "La planification de voyage avec l’IA n’est pas incluse dans votre forfait actuel."}
        </p>
        <Button render={<Link href="/dashboard/subscription" />}>
          Voir les abonnements
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-start gap-3 rounded-2xl border border-[#dfe7ef] bg-white p-6">
        <p className="text-sebavio-slate text-sm">
          {error ?? "Aucune session de planification disponible."}
        </p>
        <Button type="button" onClick={() => void retry()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const focusComposer = () => {
    setSummaryOpen(false);
    conversationAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => {
      const el = document.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="Votre réponse"]',
      );
      el?.focus();
    }, 250);
  };

  const handleCreateConfirm = async () => {
    trackEvent("assistant_trip_action_confirmed", {
      surface: "assistant",
      path: "/dashboard/ai",
    });
    trackEvent("trip_creation_started", {
      surface: "assistant",
      path: "/dashboard/ai",
    });
    const tripId = await createTrip();
    if (tripId) {
      trackEvent("trip_created", {
        surface: "assistant",
        path: "/dashboard/ai",
      });
      setCreateOpen(false);
      router.push(`/dashboard/trips/${tripId}`);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <AITripPlannerHero
        onRestart={() => setRestartOpen(true)}
        restartDisabled={creating}
      />

      {successTripId ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          Votre voyage a été créé avec succès. Vous pouvez maintenant consulter
          l’itinéraire, ajuster les arrêts et préparer votre départ.{" "}
          <Link
            href={`/dashboard/trips/${successTripId}`}
            className="font-semibold underline underline-offset-2"
          >
            Ouvrir le voyage
          </Link>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <div ref={conversationAnchorRef}>
          <AITripConversation
            messages={session.messages}
            sending={sending}
            disabled={session.status === "created" || creating}
            error={error}
            requestedInput={session.requestedInput}
            knownDurationDays={session.draft.durationDays}
            activeQuickReplies={
              session.currentStep === "preferences" ||
              session.requestedInput?.type === "multi_choice"
                ? []
                : session.currentStep === "lodging" &&
                    !session.draft.lodgingSelection?.name
                  ? []
                  : session.quickReplies
            }
            proposal={session.proposal}
            showLodgingPicker={
              !session.draft.lodgingSelection?.name &&
              (session.currentStep === "lodging" ||
                Boolean(session.draft.lodgingRequested))
            }
            lodgingOptions={session.draft.lodgingOptions}
            lodgingTypeLabel={session.draft.lodgingType}
            homeCity={session.homeCity}
            originSuggestions={session.originSuggestions}
            onSend={(content) => void handleSend(content)}
            onSelectAddress={(field, address) =>
              void selectPlace(field, { address })
            }
            onUseHome={() => void selectPlace("origin", { useHome: true })}
            onSelectLodging={(option) => void selectLodging({ option })}
            onSkipLodging={() => void selectLodging({ skip: true })}
            onRefreshLodging={() => void selectLodging({ refresh: true })}
            onRetry={() => void retry()}
          />
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <button
            type="button"
            className="text-sebavio-navy mb-3 flex w-full items-center justify-between rounded-xl border border-[#dfe7ef] bg-white px-4 py-3 text-left text-sm font-semibold shadow-sm lg:hidden"
            onClick={() => setSummaryOpen((v) => !v)}
            aria-expanded={summaryOpen}
          >
            Résumé de mon voyage
            <ChevronDown
              className={cn("size-4 transition", summaryOpen && "rotate-180")}
            />
          </button>

          <div className={cn("lg:block", summaryOpen ? "block" : "hidden")}>
            <AITripSummary
              draft={session.draft}
              missingFields={session.missingFields}
              canCreate={session.canCreate && session.status !== "created"}
              creating={creating}
              proposal={session.proposal}
              onCreate={() => setCreateOpen(true)}
              onContinue={focusComposer}
            />
          </div>
        </div>
      </div>

      <RestartPlanningDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        onConfirm={() => void restart()}
      />

      <CreateTripConfirmationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        draft={session.draft}
        creating={creating}
        onConfirm={() => void handleCreateConfirm()}
      />
    </div>
  );
}
