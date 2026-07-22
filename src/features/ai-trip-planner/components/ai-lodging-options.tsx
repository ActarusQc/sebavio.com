"use client";

import Image from "next/image";
import { BedDouble, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LodgingOptionDto } from "@/features/ai-trip-planner/types";

type Props = {
  options: LodgingOptionDto[];
  lodgingTypeLabel?: string | null;
  disabled?: boolean;
  onSelect: (option: LodgingOptionDto) => void;
  onSkip?: () => void;
  onRefresh?: () => void;
};

export function AILodgingOptions({
  options,
  lodgingTypeLabel,
  disabled,
  onSelect,
  onSkip,
  onRefresh,
}: Props) {
  if (options.length === 0) {
    return (
      <div className="mt-3 space-y-2 rounded-2xl border border-[#d7e4ef] bg-[#f7fafc] p-3.5">
        <p className="text-sebavio-navy text-sm font-medium">
          Aucun établissement trouvé pour{" "}
          {lodgingTypeLabel?.toLowerCase() ?? "cet hébergement"}.
        </p>
        <div className="flex flex-wrap gap-2">
          {onRefresh ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled}
              onClick={onRefresh}
            >
              Relancer la recherche
            </Button>
          ) : null}
          {onSkip ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={onSkip}
            >
              Sans hébergement
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section
      className="mt-3 space-y-3 rounded-2xl border border-[#d7e4ef] bg-[#f7fafc] p-3.5 sm:p-4"
      aria-label="Options d’hébergement"
    >
      <header className="flex items-center gap-2">
        <BedDouble className="text-sebavio-teal size-4" aria-hidden />
        <p className="text-sebavio-navy text-sm font-semibold">
          {lodgingTypeLabel
            ? `Choisissez un ${lodgingTypeLabel.toLowerCase()}`
            : "Choisissez un hébergement"}
        </p>
      </header>

      <ul className="space-y-2">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option)}
              className="hover:border-sebavio-gold/50 flex w-full gap-3 rounded-xl border border-[#e2eaf1] bg-white p-2.5 text-left transition hover:bg-[#fff9ef] disabled:opacity-50"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#eef3f8]">
                {option.imageUrl ? (
                  // Proxy authentifié /api/places/photo — unoptimized
                  <Image
                    src={option.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <div className="text-sebavio-teal flex h-full w-full items-center justify-center">
                    <BedDouble className="size-5" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-sebavio-navy text-sm font-semibold">
                  {option.name}
                </p>
                {option.address || option.city ? (
                  <p className="text-sebavio-slate mt-0.5 flex items-start gap-1 text-xs">
                    <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
                    <span className="line-clamp-2">
                      {option.address || option.city}
                    </span>
                  </p>
                ) : null}
                {option.rating != null ? (
                  <p className="text-sebavio-navy/80 mt-1 flex items-center gap-1 text-xs">
                    <Star className="text-sebavio-gold size-3" aria-hidden />
                    {option.rating.toFixed(1)}
                    {option.ratingCount != null
                      ? ` (${option.ratingCount} avis)`
                      : ""}
                  </p>
                ) : null}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {onRefresh ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={onRefresh}
          >
            Voir d’autres options
          </Button>
        ) : null}
        {onSkip ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={onSkip}
          >
            Sans hébergement
          </Button>
        ) : null}
      </div>
    </section>
  );
}
