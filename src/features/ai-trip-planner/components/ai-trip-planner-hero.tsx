"use client";

import Image from "next/image";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  onRestart: () => void;
  restartDisabled?: boolean;
};

export function AITripPlannerHero({ onRestart, restartDisabled }: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_8px_28px_rgba(8,43,70,0.06)]">
      <div className="relative z-10 flex flex-col gap-4 p-5 sm:p-7 lg:max-w-[58%] lg:pr-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-3">
            <h1 className="font-heading text-sebavio-navy text-2xl font-bold tracking-tight sm:text-3xl">
              Planifier un voyage avec l’IA
            </h1>
            <p className="text-sebavio-slate max-w-xl text-sm leading-relaxed sm:text-[0.95rem]">
              Décrivez le voyage que vous imaginez. Sebavio vous aide à
              construire l’itinéraire, les arrêts et les activités avant de
              créer votre voyage.
            </p>
            <Badge
              variant="secondary"
              className="border-transparent bg-[#f8e8c4] px-3 py-1 text-xs font-semibold text-[#8a6418]"
            >
              <Sparkles className="size-3.5" aria-hidden />
              Création guidée par l’IA
            </Badge>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRestart}
            disabled={restartDisabled}
            className="shrink-0"
          >
            <RotateCcw data-icon="inline-start" />
            Recommencer
          </Button>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] lg:block"
        aria-hidden
      >
        <Image
          src="/images/marketing/lifecycle-before-trip.webp"
          alt=""
          fill
          className="object-cover object-center opacity-90"
          sizes="40vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent" />
      </div>
    </section>
  );
}
