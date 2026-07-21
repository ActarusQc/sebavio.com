"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { FuelFillStopDto } from "@/features/fuel/types";

export type FuelMapMarkerFocus = {
  id: string;
  latitude: number;
  longitude: number;
};

type Props = {
  outboundRefuelStops: FuelFillStopDto[];
  returnRefuelStops: FuelFillStopDto[];
  departureStops: FuelFillStopDto[];
  destinationStops: FuelFillStopDto[];
  finalStops: FuelFillStopDto[];
  includeReturnTrip: boolean;
  feasible: boolean;
  failureMessage: string | null;
  fuelType: string;
  destinationLabel?: string | null;
  onFocusStop?: (focus: FuelMapMarkerFocus | null) => void;
  /**
   * full = résumé + plan (tests / compat)
   * detailed = plan seul, grille large
   */
  variant?: "full" | "detailed";
  /** @deprecated utiliser variant="detailed" */
  compactSummary?: boolean;
};

function formatKm(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatPrice(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

function formatLiters(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function formatCost(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPriceUpdatedAt(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("fr-CA", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function placeLabel(stop: FuelFillStopDto): string | null {
  const city = stop.station?.city?.trim();
  if (city) return city;
  return null;
}

function hasStationName(stop: FuelFillStopDto): boolean {
  return Boolean(stop.station?.name?.trim());
}

function isConfirmedStation(stop: FuelFillStopDto): boolean {
  return hasStationName(stop) && !stop.isEstimatedLocation;
}

function firstStopSummary(stop: FuelFillStopDto): string {
  if (hasStationName(stop)) {
    const name = stop.station!.name!.trim();
    const city = stop.station?.city?.trim();
    return city ? `${name}, ${city}` : name;
  }
  const place = placeLabel(stop);
  return place ? `près de ${place}` : "le long de l'itinéraire";
}

function parseCoord(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function StopCard({
  stop,
  legLabel,
  onFocusStop,
  dense,
}: {
  stop: FuelFillStopDto;
  legLabel: "ALLER" | "RETOUR";
  onFocusStop?: (focus: FuelMapMarkerFocus | null) => void;
  dense?: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const lat = parseCoord(stop.station?.latitude);
  const lng = parseCoord(stop.station?.longitude);
  const canMap = lat != null && lng != null;
  const named = hasStationName(stop);
  const confirmed = isConfirmedStation(stop);

  return (
    <article
      className="w-full min-w-0 overflow-hidden rounded-xl border border-[rgb(14_45_70/0.1)] bg-white px-4 py-4 shadow-[var(--shadow-sm)]"
      data-testid={`fuel-stop-${stop.id}`}
      data-estimated={confirmed ? "false" : "true"}
      data-leg={stop.leg}
      data-station-name={stop.station?.name ?? ""}
    >
      <p className="text-sebavio-teal text-xs font-semibold tracking-wide">
        Arrêt carburant {stop.sequence} — {legLabel}
      </p>

      {named ? (
        <div
          className="mt-2 min-w-0"
          data-testid={`fuel-stop-place-${stop.id}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sebavio-navy text-lg leading-snug font-semibold break-words">
              {stop.station!.name}
            </p>
            {stop.isEstimatedLocation ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                Localisation estimée
              </span>
            ) : null}
          </div>
          {stop.station?.brand &&
          stop.station.brand.trim().toLowerCase() !==
            stop.station.name?.trim().toLowerCase() ? (
            <p className="text-muted-foreground text-xs">
              {stop.station.brand}
            </p>
          ) : null}
          {stop.station?.address ? (
            <p className="text-sebavio-navy mt-0.5 text-sm break-words">
              {stop.station.address}
            </p>
          ) : null}
          {stop.station?.city ? (
            <p className="text-muted-foreground text-sm break-words">
              {stop.station.city}
            </p>
          ) : null}
          {stop.station?.googleMapsUrl ? (
            <a
              href={stop.station.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sebavio-teal mt-1 inline-block text-sm underline-offset-2 hover:underline"
              data-testid={`fuel-stop-gmaps-${stop.id}`}
            >
              Ouvrir dans Google Maps
            </a>
          ) : null}
        </div>
      ) : (
        <div
          className="mt-2 rounded-xl border border-amber-300/80 bg-amber-50 px-2.5 py-2"
          data-testid={`fuel-stop-place-${stop.id}`}
        >
          {placeLabel(stop) ? (
            <>
              <p className="text-sebavio-navy text-base leading-snug font-semibold">
                Arrêt recommandé près de {placeLabel(stop)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Emplacement approximatif le long de l&apos;itinéraire
              </p>
              <p className="mt-1 text-xs text-amber-900">
                La station exacte sera à confirmer avant le départ.
              </p>
            </>
          ) : canMap ? (
            <>
              <p className="text-sebavio-navy text-base leading-snug font-semibold">
                Arrêt recommandé le long de l&apos;itinéraire
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Emplacement approximatif le long de l&apos;itinéraire
              </p>
              <p className="mt-1 text-xs text-amber-900">
                La station exacte sera à confirmer avant le départ.
              </p>
            </>
          ) : (
            <>
              <p className="text-sebavio-navy text-base leading-snug font-semibold">
                Arrêt recommandé le long de l&apos;itinéraire
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                L&apos;emplacement précis n&apos;a pas pu être déterminé.
              </p>
            </>
          )}
        </div>
      )}

      <p className="text-muted-foreground mt-3 text-sm">
        À environ {formatKm(stop.distanceFromStartKm)} km du départ
      </p>

      <dl className="mt-3 grid gap-3 border-t border-[rgb(14_45_70/0.08)] pt-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground text-xs">
            {stop.priceIsEstimate ? "Prix estimé" : "Prix"}
          </dt>
          <dd className="text-sebavio-navy font-semibold">
            {stop.pricePerLiter != null
              ? `${formatPrice(stop.pricePerLiter)} $/L`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Quantité à ajouter</dt>
          <dd className="text-sebavio-navy font-semibold">
            {formatLiters(stop.litersAdded)} L
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Coût estimé</dt>
          <dd className="text-sebavio-navy font-bold">
            {formatCost(stop.cost)} $
          </dd>
        </div>
      </dl>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="text-sebavio-slate min-h-11 text-sm font-medium underline-offset-2 hover:underline"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
        >
          {moreOpen ? "Voir moins" : "Voir plus"}
        </button>
      </div>

      {moreOpen ? (
        <div className="text-muted-foreground mt-2 space-y-2 border-t border-[rgb(14_45_70/0.06)] pt-3 text-sm">
          {Number(stop.distanceRemainingKm) > 0 ? (
            <p>Distance restante : {formatKm(stop.distanceRemainingKm)} km</p>
          ) : null}
          {stop.station?.distanceFromRouteKm != null ? (
            <p>
              Station située à {formatKm(stop.station.distanceFromRouteKm)} km
              de l&apos;itinéraire
              {Number(stop.detourKm) > 0
                ? ` · détour estimé ${formatKm(stop.detourKm)} km`
                : ""}
            </p>
          ) : Number(stop.detourKm) > 0 ? (
            <p>Détour estimé : {formatKm(stop.detourKm)} km</p>
          ) : null}
          {stop.priceIsEstimate ? (
            <p>
              Estimation régionale — prix exact indisponible pour cette station
              {formatPriceUpdatedAt(stop.pricePeriod)
                ? ` · données du ${formatPriceUpdatedAt(stop.pricePeriod)}`
                : ""}
            </p>
          ) : stop.pricePeriod ? (
            <p>Prix mis à jour : {formatPriceUpdatedAt(stop.pricePeriod)}</p>
          ) : null}
          <dl className="grid gap-1 text-xs sm:grid-cols-2">
            <div>Réservoir avant : {formatLiters(stop.tankLitersBefore)} L</div>
            <div>Réservoir après : {formatLiters(stop.tankLitersAfter)} L</div>
            <div>Autonomie après : {formatKm(stop.rangeAfterKm)} km</div>
          </dl>
          <button
            type="button"
            className="text-muted-foreground text-xs underline-offset-2 hover:underline"
            onClick={() => setMoreOpen(true)}
          >
            Voir le détail réservoir
          </button>
        </div>
      ) : null}

      {/* Compat tests : le libellé « Voir le détail réservoir » reste accessible */}
      {!moreOpen && !dense ? (
        <button
          type="button"
          className="text-muted-foreground mt-1 min-h-11 text-xs underline-offset-2 hover:underline"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
        >
          Voir le détail réservoir
        </button>
      ) : null}

      {canMap ? (
        <Button
          type="button"
          variant="outline"
          className="border-sebavio-navy/20 text-sebavio-navy mt-3 min-h-11 w-full"
          data-testid={`fuel-stop-map-${stop.id}`}
          onClick={() => {
            document
              .getElementById("trip-map-section")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
            onFocusStop?.({
              id: stop.id,
              latitude: lat!,
              longitude: lng!,
            });
          }}
        >
          Voir sur la carte
        </Button>
      ) : null}
    </article>
  );
}

function SpecialStopCard({
  stop,
  title,
}: {
  stop: FuelFillStopDto;
  title: string;
}) {
  return (
    <article className="w-full min-w-0 rounded-xl border border-[rgb(14_45_70/0.1)] bg-white px-4 py-3 text-sm">
      <p className="text-sebavio-navy font-medium">{title}</p>
      <p className="text-muted-foreground mt-1">
        {formatLiters(stop.litersAdded)} L · {formatCost(stop.cost)} $
        {stop.pricePerLiter != null
          ? ` · ${formatPrice(stop.pricePerLiter)} $/L`
          : ""}
      </p>
    </article>
  );
}

function PlannedStopsSummary({
  outbound,
  inbound,
  includeReturnTrip,
  first,
}: {
  outbound: FuelFillStopDto[];
  inbound: FuelFillStopDto[];
  includeReturnTrip: boolean;
  first: FuelFillStopDto | null;
}) {
  return (
    <div
      className="rounded-xl border-2 border-[var(--sebavio-teal-border)] bg-[var(--sebavio-teal-soft)] px-4 py-3"
      data-testid="fuel-stops-summary"
    >
      <h5 className="text-sebavio-navy font-semibold">Arrêts de carburant</h5>
      <p className="mt-1 text-sm">
        Aller : <strong>{outbound.length}</strong>
        {includeReturnTrip ? (
          <>
            {" "}
            · Retour : <strong>{inbound.length}</strong>
          </>
        ) : null}
      </p>
      {first ? (
        <p className="mt-2 text-sm">
          Premier arrêt recommandé : {firstStopSummary(first)}, à env.{" "}
          {formatKm(first.distanceFromStartKm)} km du départ.
        </p>
      ) : (
        <p className="text-muted-foreground mt-2 text-sm">
          Aucun plein en route requis pour ce trajet.
        </p>
      )}
    </div>
  );
}

export function FuelStopsList({
  outboundRefuelStops,
  returnRefuelStops,
  departureStops,
  destinationStops,
  finalStops,
  includeReturnTrip,
  feasible,
  failureMessage,
  onFocusStop,
  variant,
  compactSummary = false,
}: Props) {
  const mode = variant ?? (compactSummary ? "detailed" : "full");
  const outbound = outboundRefuelStops ?? [];
  const inbound = returnRefuelStops ?? [];
  const dense = mode === "detailed";

  if (!feasible) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {failureMessage ??
          "Aucun arrêt carburant accessible n’a été trouvé avant la limite d’autonomie du véhicule."}
      </p>
    );
  }

  const first = outbound[0] ?? inbound[0] ?? null;
  const stopGridClass =
    mode === "detailed"
      ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-2"
      : "space-y-3";

  const plan = (
    <div className="space-y-4" data-testid="fuel-plan-refuel">
      {mode === "full" ? (
        <h5 className="text-sebavio-navy text-base font-semibold tracking-wide">
          Plan de ravitaillement
        </h5>
      ) : null}

      <div className="space-y-3" data-testid="fuel-plan-outbound">
        <h6 className="text-sebavio-teal text-sm font-semibold tracking-wide">
          Aller
        </h6>
        {outbound.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun plein en route requis pour l&apos;aller.
          </p>
        ) : (
          <div className={stopGridClass}>
            {outbound.map((s) => (
              <StopCard
                key={s.id}
                stop={s}
                legLabel="ALLER"
                onFocusStop={onFocusStop}
                dense={dense}
              />
            ))}
          </div>
        )}
      </div>

      {includeReturnTrip ? (
        <div className="space-y-3" data-testid="fuel-plan-return">
          <h6 className="text-sebavio-teal text-sm font-semibold tracking-wide">
            Retour
          </h6>
          {inbound.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun plein en route requis pour le retour.
            </p>
          ) : (
            <div className={stopGridClass}>
              {inbound.map((s) => (
                <StopCard
                  key={s.id}
                  stop={s}
                  legLabel="RETOUR"
                  onFocusStop={onFocusStop}
                  dense={dense}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const specialStops = (
    <>
      {departureStops.length > 0 ? (
        <div className="space-y-2">
          <h5 className="text-sebavio-navy text-sm font-semibold tracking-wide">
            Plein de départ
          </h5>
          {departureStops.map((s) => (
            <SpecialStopCard key={s.id} stop={s} title="Plein de départ" />
          ))}
        </div>
      ) : null}
    </>
  );

  const trailing = (
    <>
      {destinationStops.length > 0 ? (
        <div className="space-y-2">
          <h5 className="text-sebavio-navy text-sm font-semibold tracking-wide">
            Plein à destination
          </h5>
          {destinationStops.map((s) => (
            <SpecialStopCard key={s.id} stop={s} title="Plein à destination" />
          ))}
        </div>
      ) : null}

      {finalStops.length > 0 ? (
        <div className="space-y-2">
          <h5 className="text-sebavio-navy text-sm font-semibold tracking-wide">
            Plein final
          </h5>
          {finalStops.map((s) => (
            <SpecialStopCard key={s.id} stop={s} title="Plein final" />
          ))}
        </div>
      ) : null}
    </>
  );

  if (mode === "detailed") {
    return (
      <div className="space-y-4" data-testid="fuel-stops-list">
        {specialStops}
        {plan}
        {trailing}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="fuel-stops-list">
      <PlannedStopsSummary
        outbound={outbound}
        inbound={inbound}
        includeReturnTrip={includeReturnTrip}
        first={first}
      />
      {specialStops}
      {plan}
      {trailing}
    </div>
  );
}
