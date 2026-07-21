"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CloudRain,
  Clock,
  Fuel,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SebavioAssistantIcon } from "@/features/ai/components/sebavio-assistant-icon";
import { useTripAssistant } from "@/features/ai/components/trip-assistant-context";
import { formatRelativeFr } from "@/features/trips/lib/format-place";
import { cn } from "@/lib/utils";

type AttentionItem = {
  key: string;
  text: string;
  tone: "ok" | "info" | "watch" | "important";
};

function collectAttention(
  analysis:
    | {
        ok: string[];
        watch: string[];
        suggestions: string[];
        missing: string[];
      }
    | null
    | undefined,
  warnings: Array<{ title: string; severity: string }>,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const w of warnings.slice(0, 3)) {
    items.push({
      key: `w-${w.title}`,
      text: w.title,
      tone:
        w.severity === "important"
          ? "important"
          : w.severity === "warning"
            ? "watch"
            : "info",
    });
  }
  if (analysis) {
    for (const t of analysis.watch) {
      if (items.length >= 3) break;
      items.push({ key: `watch-${t}`, text: t, tone: "watch" });
    }
    for (const t of analysis.missing) {
      if (items.length >= 3) break;
      items.push({ key: `missing-${t}`, text: t, tone: "important" });
    }
    for (const t of analysis.suggestions) {
      if (items.length >= 3) break;
      items.push({ key: `sug-${t}`, text: t, tone: "info" });
    }
    if (items.length === 0) {
      for (const t of analysis.ok.slice(0, 2)) {
        items.push({ key: `ok-${t}`, text: t, tone: "ok" });
      }
    }
  }
  return items.slice(0, 3);
}

const TONE_ICON = {
  ok: Clock,
  info: Info,
  watch: CloudRain,
  important: AlertTriangle,
} as const;

const TONE_CLASS = {
  ok: "text-emerald-600",
  info: "text-sky-600",
  watch: "text-amber-600",
  important: "text-rose-600",
} as const;

export function TripAiSummaryCard() {
  const {
    lastAnalysis,
    canUsePersonalizedAi,
    aiEnabled,
    pending,
    booted,
    runQuickAction,
    openPanel,
  } = useTripAssistant();

  const attention = lastAnalysis
    ? collectAttention(
        lastAnalysis.response.analysis,
        lastAnalysis.response.warnings,
      )
    : [];

  const discovery = booted && !canUsePersonalizedAi;
  const unavailable = booted && canUsePersonalizedAi && !aiEnabled;
  const actionsDisabled = discovery || pending || unavailable;

  return (
    <section
      className="trip-card overflow-hidden p-0"
      data-testid="trip-ai-summary-card"
      aria-labelledby="trip-ai-summary-heading"
    >
      <div className="grid gap-0 lg:min-h-[168px] lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.37fr)_minmax(0,0.25fr)]">
        {/* Zone gauche */}
        <div className="flex flex-col justify-between gap-3 border-b border-[rgb(14_45_70/0.07)] p-5 sm:p-6 lg:border-r lg:border-b-0 lg:p-6">
          <div className="flex items-start gap-3.5">
            <SebavioAssistantIcon variant="hero" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="trip-ai-summary-heading"
                  className="font-heading text-sebavio-navy text-[16px] font-bold sm:text-[17px]"
                >
                  Assistant Sebavio
                </h2>
                <Badge className="bg-sebavio-gold/25 text-sebavio-navy h-5 rounded-full border-0 px-2 text-[10px] font-bold tracking-wide">
                  BÊTA
                </Badge>
              </div>
              <p className="text-sebavio-navy/70 mt-1.5 line-clamp-2 text-[13px] leading-snug sm:text-[14px]">
                Je peux analyser votre horaire, votre trajet, la météo et vos
                arrêts de carburant.
              </p>
            </div>
          </div>

          {discovery ? (
            <div className="space-y-2">
              <p className="text-sebavio-navy/80 text-[13px] sm:text-[14px]">
                Débloquez l’analyse intelligente de vos voyages.
              </p>
              <Button
                render={<Link href="/pricing" />}
                className="bg-sebavio-navy hover:bg-sebavio-navy/90 h-[44px] min-w-[210px] rounded-lg px-5 text-[15px] font-semibold text-white shadow-sm"
              >
                Voir les forfaits
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Button
                type="button"
                className="bg-sebavio-navy hover:bg-sebavio-navy/90 h-[44px] min-w-[210px] gap-2 rounded-lg px-5 text-[15px] font-semibold text-white shadow-sm disabled:opacity-60"
                disabled={pending || unavailable}
                onClick={() => runQuickAction("analyze")}
                data-testid="trip-ai-analyze"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Sebavio analyse votre voyage…
                  </>
                ) : (
                  <>
                    <span aria-hidden>✦</span>
                    Analyser mon voyage
                  </>
                )}
              </Button>
              {unavailable ? (
                <p className="text-sebavio-navy/55 text-[12px]" role="status">
                  Assistant temporairement indisponible.
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* Zone centrale */}
        <div className="border-b border-[rgb(14_45_70/0.07)] p-5 sm:p-6 lg:border-r lg:border-b-0">
          {lastAnalysis && attention.length > 0 ? (
            <>
              <p className="text-[15px] font-semibold text-amber-700 sm:text-[16px]">
                {attention.length} élément
                {attention.length > 1 ? "s" : ""} mérite
                {attention.length > 1 ? "nt" : ""} votre attention
              </p>
              <ul className="mt-3 space-y-2.5">
                {attention.map((item) => {
                  const Icon = TONE_ICON[item.tone];
                  return (
                    <li key={item.key} className="flex items-start gap-2.5">
                      <Icon
                        className={cn(
                          "mt-0.5 size-[17px] shrink-0",
                          TONE_CLASS[item.tone],
                        )}
                        aria-hidden
                      />
                      <span className="text-sebavio-navy/90 line-clamp-2 text-[13px] leading-snug sm:text-[14px]">
                        {item.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-[12px]">
                <Clock className="size-3.5" aria-hidden />
                Analyse mise à jour {formatRelativeFr(lastAnalysis.createdAt)}
              </p>
            </>
          ) : (
            <div className="flex h-full flex-col justify-center">
              <p className="text-sebavio-navy/75 text-[14px] leading-relaxed sm:text-[15px]">
                {discovery
                  ? "Aperçu de l’assistant : en forfait Découverte, aucune donnée de votre voyage n’est envoyée à l’IA."
                  : unavailable
                    ? "L’assistant est temporairement indisponible. Vos informations de voyage restent accessibles."
                    : "Lancez une analyse pour vérifier votre horaire, la météo, les activités et les arrêts prévus."}
              </p>
            </div>
          )}
        </div>

        {/* Zone droite — actions rapides */}
        <div className="flex flex-col justify-center gap-2 p-5 sm:p-6">
          <QuickBtn
            label="Vérifier l’horaire"
            icon={<CalendarClock className="size-4 text-sky-700" aria-hidden />}
            disabled={actionsDisabled}
            onClick={() => runQuickAction("schedule")}
          />
          <QuickBtn
            label="Adapter selon la météo"
            icon={<CloudRain className="size-4 text-sky-600" aria-hidden />}
            disabled={actionsDisabled}
            onClick={() => runQuickAction("weather")}
          />
          <QuickBtn
            label="Expliquer le carburant"
            icon={<Fuel className="size-4 text-emerald-600" aria-hidden />}
            disabled={actionsDisabled}
            onClick={() => runQuickAction("fuel")}
          />
          {discovery ? (
            <button
              type="button"
              className="text-sebavio-navy mt-1 text-left text-[13px] font-medium underline-offset-2 hover:underline"
              onClick={() => openPanel()}
            >
              Ouvrir l’aperçu →
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function QuickBtn({
  label,
  onClick,
  disabled,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "border-sebavio-navy/12 text-sebavio-navy hover:border-sebavio-navy/25 focus-visible:ring-sebavio-navy flex h-[42px] w-full items-center justify-start gap-2.5 rounded-lg border bg-white px-3.5 text-[13px] font-semibold shadow-sm transition hover:bg-sky-50 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55 sm:text-[14px]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
