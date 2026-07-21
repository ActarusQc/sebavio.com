"use client";

import { ExternalLink, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  RestaurantRecommendation,
  TripAssistantResponse,
} from "@/features/ai/schemas/response";
import type { ProposedTripAction } from "@/features/ai/schemas/actions";
import { cn } from "@/lib/utils";

function priceLabel(level: RestaurantRecommendation["priceLevel"]): string {
  switch (level) {
    case "budget":
      return "Économique";
    case "moderate":
      return "Modéré";
    case "premium":
    case "upscale":
    case "fine_dining":
      return "Haut de gamme";
    default:
      return "Prix non confirmé";
  }
}

function openingLabel(status: RestaurantRecommendation["openingStatus"]): {
  text: string;
  className: string;
} {
  switch (status.value) {
    case "verified_open":
      return {
        text: status.label || "Ouvert : vérifié",
        className: "text-emerald-700",
      };
    case "likely_open":
      return {
        text: status.label || "Probablement ouvert",
        className: "text-emerald-700",
      };
    case "closed":
    case "likely_closed":
      return {
        text: status.label || "Fermé à cette heure",
        className: "text-rose-700",
      };
    default:
      return {
        text: status.label || "Horaire à confirmer",
        className: "text-amber-800",
      };
  }
}

/** Jamais d’ISO brut dans l’UI. */
function displayArrival(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (/\d{4}-\d{2}-\d{2}T/.test(raw) || /Z$/i.test(raw)) {
    try {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        return new Intl.DateTimeFormat("fr-CA", {
          timeZone: "America/Toronto",
          hour: "numeric",
          minute: "2-digit",
          hourCycle: "h23",
        })
          .format(d)
          .replace(":", " h ");
      }
    } catch {
      return null;
    }
    return null;
  }
  return raw;
}

function mapsUrl(r: RestaurantRecommendation): string | null {
  if (r.location.latitude != null && r.location.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${r.location.latitude},${r.location.longitude}`;
  }
  if (r.location.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.location.address}`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.city}`)}`;
}

function officialUrl(
  r: RestaurantRecommendation,
  response: TripAssistantResponse,
): string | null {
  for (const id of r.sourceIds) {
    const s = response.sources.find((x) => x.id === id);
    if (s && (s.sourceType === "official" || s.sourceType === "reservation")) {
      return s.url;
    }
  }
  const first = r.sourceIds
    .map((id) => response.sources.find((x) => x.id === id))
    .find(Boolean);
  return first?.url ?? null;
}

export function RestaurantRecommendationCards({
  response,
  onProposeAction,
}: {
  response: TripAssistantResponse;
  onProposeAction?: (action: ProposedTripAction) => void;
}) {
  const items = (response.restaurantRecommendations ?? []).slice(0, 3);
  if (items.length === 0) return null;

  return (
    <div
      className="space-y-2"
      data-testid="trip-assistant-restaurants"
      aria-label="Recommandations de restaurants"
    >
      {items.map((r) => {
        const open = openingLabel(r.openingStatus);
        const map = mapsUrl(r);
        const site = officialUrl(r, response);
        const arrival = displayArrival(r.estimatedArrivalTime);
        const action =
          onProposeAction &&
          ({
            type: "add_activity" as const,
            title: r.name,
            description: `Repas · ${r.city}`,
            durationMinutes: Math.max(15, r.estimatedMealDurationMinutes ?? 60),
            direction: "outbound" as const,
            placement: "outbound" as const,
            latitude: r.location.latitude,
            longitude: r.location.longitude,
            address: r.location.address,
            locationSource: "ai_suggested" as const,
          } satisfies ProposedTripAction);

        return (
          <article
            key={`${r.name}-${r.city}`}
            className="border-sebavio-navy/10 rounded-xl border bg-white p-3 text-xs shadow-sm"
          >
            <header className="space-y-0.5">
              <h4 className="text-sebavio-navy text-sm font-semibold">
                {r.name}
              </h4>
              <p className="text-muted-foreground">
                {[r.category ?? r.cuisineType, r.city]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </header>

            <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {arrival ? (
                <div>
                  <dt className="text-sebavio-navy/70 font-medium">
                    Arrivée estimée
                  </dt>
                  <dd>{arrival}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-sebavio-navy/70 font-medium">Détour</dt>
                <dd>
                  {r.routeImpact.estimatedDetourMinutes != null
                    ? `environ ${r.routeImpact.estimatedDetourMinutes} min`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sebavio-navy/70 font-medium">Prix</dt>
                <dd>{priceLabel(r.priceLevel)}</dd>
              </div>
              <div>
                <dt className="text-sebavio-navy/70 font-medium">Ouverture</dt>
                <dd className={cn("font-medium", open.className)}>
                  {open.text}
                </dd>
              </div>
            </dl>

            <p className="text-sebavio-navy/90 mt-2 leading-relaxed">
              {r.recommendationReason}
            </p>
            {r.verificationNote ? (
              <p className="text-muted-foreground mt-1 italic">
                {r.verificationNote}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {map ? (
                <Button
                  render={<a href={map} target="_blank" rel="noreferrer" />}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                >
                  <MapPin className="size-3.5" aria-hidden />
                  Voir sur la carte
                </Button>
              ) : null}
              {site ? (
                <Button
                  render={<a href={site} target="_blank" rel="noreferrer" />}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Site officiel
                </Button>
              ) : null}
              {action && onProposeAction ? (
                <Button
                  type="button"
                  size="sm"
                  className="bg-sebavio-navy hover:bg-sebavio-navy/90 gap-1.5 text-white"
                  onClick={() => onProposeAction(action)}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Ajouter au voyage
                </Button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
