"use client";

import type { LimitedTripPreview } from "@/features/subscriptions/types";
import {
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
} from "@/features/subscriptions/lib/official-plan-slugs";
import {
  formatPassPrice,
  formatPlusPrice,
} from "@/features/subscriptions/lib/format-price";
import { CheckoutButton } from "@/features/subscriptions/components/checkout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";

type UnlockTripPanelProps = {
  tripId: string;
  preview: LimitedTripPreview;
  passPriceCents?: number;
  plusPriceCents?: number;
};

function formatRange(
  range: { min: number; max: number } | null,
  unit: string,
): string {
  if (!range) return "—";
  if (range.min === range.max) {
    return `≈ ${range.min.toLocaleString("fr-CA")} ${unit}`;
  }
  return `≈ ${range.min.toLocaleString("fr-CA")}–${range.max.toLocaleString("fr-CA")} ${unit}`;
}

export function UnlockTripPanel({
  tripId,
  preview,
  passPriceCents = PASS_PRICE_CENTS,
  plusPriceCents = PLUS_PRICE_CENTS,
}: UnlockTripPanelProps) {
  const returnPath = `/dashboard/trips/${tripId}`;

  return (
    <Card
      className="border-sebavio-gold/40 bg-sebavio-surface/80 shadow-sm"
      data-unlock-trip-panel
    >
      <CardHeader>
        <CardTitle className="font-heading text-sebavio-navy text-xl">
          Votre voyage est prêt
        </CardTitle>
        <CardDescription>
          Aperçu approximatif — débloquez l’accès complet pour voir l’itinéraire
          précis, le suivi GPS et le mode voyage.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ul className="text-sebavio-navy/85 grid gap-3 text-sm sm:grid-cols-2">
          <li className="bg-sebavio-sand/15 rounded-lg px-3 py-2.5">
            <span className="text-sebavio-muted block text-xs font-medium tracking-wide uppercase">
              Distance
            </span>
            {formatRange(preview.distanceKmRange, "km")}
          </li>
          <li className="bg-sebavio-sand/15 rounded-lg px-3 py-2.5">
            <span className="text-sebavio-muted block text-xs font-medium tracking-wide uppercase">
              Durée
            </span>
            {formatRange(preview.durationMinutesRange, "min")}
          </li>
          <li className="bg-sebavio-sand/15 rounded-lg px-3 py-2.5">
            <span className="text-sebavio-muted block text-xs font-medium tracking-wide uppercase">
              Arrêts
            </span>
            {formatRange(preview.stopsRange, "")}
          </li>
          <li className="bg-sebavio-sand/15 rounded-lg px-3 py-2.5">
            <span className="text-sebavio-muted block text-xs font-medium tracking-wide uppercase">
              Carburant
            </span>
            {formatRange(preview.fuelLitersRange, "L")}
          </li>
        </ul>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border-sebavio-sand/50 flex flex-col gap-2 rounded-xl border p-4">
            <p className="font-heading text-sebavio-navy text-sm font-semibold">
              Pass 30 jours
            </p>
            <p className="text-sebavio-navy text-lg font-bold">
              {formatPassPrice(passPriceCents)}
            </p>
            <p className="text-sebavio-muted text-xs leading-relaxed">
              Idéal pour un voyage ou des vacances — sans abonnement.
            </p>
            <CheckoutButton
              kind="pass"
              label={`Accéder — ${formatPassPrice(passPriceCents)}`}
              tripId={tripId}
              returnPath={returnPath}
              className="mt-auto"
            />
          </div>
          <div className="border-sebavio-teal/30 bg-sebavio-teal-soft/40 flex flex-col gap-2 rounded-xl border p-4">
            <p className="font-heading text-sebavio-navy text-sm font-semibold">
              Sebavio Plus
            </p>
            <p className="text-sebavio-navy text-lg font-bold">
              {formatPlusPrice(plusPriceCents)}
            </p>
            <p className="text-sebavio-muted text-xs leading-relaxed">
              Accès complet toute l’année — meilleure valeur.
            </p>
            <CheckoutButton
              kind="plus"
              label={`Choisir Plus — ${formatPlusPrice(plusPriceCents)}`}
              tripId={tripId}
              returnPath={returnPath}
              className="mt-auto"
              variant="outline"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
