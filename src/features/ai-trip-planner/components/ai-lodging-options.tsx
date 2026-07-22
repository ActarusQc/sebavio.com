"use client";

import { useState } from "react";
import Image from "next/image";
import { BedDouble, ExternalLink, Eye, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [preview, setPreview] = useState<LodgingOptionDto | null>(null);

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
    <>
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
              <div className="flex gap-3 rounded-xl border border-[#e2eaf1] bg-white p-2.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(option)}
                  className="hover:border-sebavio-gold/50 flex min-w-0 flex-1 gap-3 text-left transition disabled:opacity-50"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#eef3f8]">
                    {option.imageUrl ? (
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
                        <MapPin
                          className="mt-0.5 size-3 shrink-0"
                          aria-hidden
                        />
                        <span className="line-clamp-2">
                          {option.address || option.city}
                        </span>
                      </p>
                    ) : null}
                    {option.rating != null ? (
                      <p className="text-sebavio-navy/80 mt-1 flex items-center gap-1 text-xs">
                        <Star
                          className="text-sebavio-gold size-3"
                          aria-hidden
                        />
                        {option.rating.toFixed(1)}
                        {option.ratingCount != null
                          ? ` (${option.ratingCount} avis)`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={disabled}
                  className="shrink-0 self-center"
                  onClick={() => setPreview(option)}
                >
                  <Eye data-icon="inline-start" />
                  Aperçu
                </Button>
              </div>
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

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-w-lg">
          {preview ? (
            <>
              <DialogHeader>
                <DialogTitle>{preview.name}</DialogTitle>
                <DialogDescription>
                  {preview.address ||
                    preview.city ||
                    "Établissement proposé pour votre séjour"}
                </DialogDescription>
              </DialogHeader>

              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#eef3f8]">
                {preview.imageUrl ? (
                  <Image
                    src={preview.imageUrl}
                    alt={preview.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 512px"
                    unoptimized
                  />
                ) : (
                  <div className="text-sebavio-teal flex h-full w-full items-center justify-center">
                    <BedDouble className="size-10" aria-hidden />
                  </div>
                )}
              </div>

              <div className="text-sebavio-slate space-y-1 text-sm">
                {preview.rating != null ? (
                  <p className="text-sebavio-navy flex items-center gap-1.5">
                    <Star className="text-sebavio-gold size-3.5" aria-hidden />
                    {preview.rating.toFixed(1)}
                    {preview.ratingCount != null
                      ? ` · ${preview.ratingCount} avis`
                      : ""}
                  </p>
                ) : null}
                {preview.address || preview.city ? (
                  <p className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {preview.address || preview.city}
                  </p>
                ) : null}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                {preview.googleMapsUrl ? (
                  <a
                    href={preview.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-sebavio-slate/40 text-sebavio-navy hover:bg-sebavio-slate/10 inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-button)] border bg-transparent px-2.5 text-[0.8rem] font-semibold"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    Voir sur la carte
                  </a>
                ) : (
                  <span />
                )}
                <Button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const selected = preview;
                    setPreview(null);
                    onSelect(selected);
                  }}
                  className="bg-sebavio-navy text-white"
                >
                  Choisir cet établissement
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
