"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Fuel,
  MapPin,
} from "lucide-react";
import { FormField } from "@/components/common";
import { Button, Input, Skeleton } from "@/components/ui";
import { useTripFuelEstimateContext } from "@/features/fuel/components/trip-fuel-estimate-context";
import { FuelPriceWarningCard } from "@/features/fuel/components/fuel-price-warning-card";
import type { FuelFillStopDto } from "@/features/fuel/types";
import {
  formatCost,
  formatKm,
  formatLiters,
  summarizeDepartureRefill,
  summarizeInitialFuel,
  summarizeStrategy,
  summarizeTripLeg,
  TRIP_FUEL_TYPE_OPTIONS,
  type TripFuelTypeValue,
} from "@/features/fuel/components/trip-fuel-form-shared";
import { BRAND_ASSETS } from "@/features/marketing/lib/brand-assets";
import { cn } from "@/lib/utils";

const selectClass =
  "border-input bg-background text-foreground h-11 w-full min-w-0 max-w-full rounded-md border px-3 text-sm";

function FuelAccordion({
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  title: string;
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className="group rounded-xl border border-[rgb(14_45_70/0.08)] bg-white open:bg-[#fbfdfe]"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-[var(--sebavio-teal)] [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-sebavio-navy text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground truncate text-xs">{summary}</p>
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </summary>
      <div className="space-y-3 border-t border-[rgb(14_45_70/0.06)] px-4 py-4">
        {children}
      </div>
    </details>
  );
}

function Metric({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-[#f5f8fa] px-3 py-3">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p
        className={cn(
          "text-sebavio-navy mt-0.5 font-semibold break-words",
          emphasize ? "text-lg" : "text-base",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SimpleStopRow({
  stop,
  legLabel,
  onFocus,
}: {
  stop: FuelFillStopDto;
  legLabel: "ALLER" | "RETOUR";
  onFocus?: (
    focus: {
      id: string;
      latitude: number;
      longitude: number;
    } | null,
  ) => void;
}) {
  const lat =
    stop.station?.latitude != null ? Number(stop.station.latitude) : NaN;
  const lng =
    stop.station?.longitude != null ? Number(stop.station.longitude) : NaN;
  const canMap = Number.isFinite(lat) && Number.isFinite(lng);
  const name =
    stop.station?.name?.trim() ||
    (stop.station?.city
      ? `Arrêt près de ${stop.station.city}`
      : "Arrêt carburant");
  const city = stop.station?.city?.trim() || null;

  return (
    <li
      className="flex items-start gap-3 rounded-xl border border-[rgb(14_45_70/0.08)] bg-white px-3 py-3"
      data-testid={`fuel-stop-${stop.id}`}
      data-estimated={
        stop.station?.name?.trim() && !stop.isEstimatedLocation
          ? "false"
          : "true"
      }
      data-leg={stop.leg}
      data-station-name={stop.station?.name ?? ""}
    >
      <span
        className="bg-sebavio-teal flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        aria-hidden
      >
        {stop.sequence}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sebavio-teal text-[11px] font-semibold tracking-wide">
          Arrêt carburant {stop.sequence} — {legLabel}
        </p>
        <p className="text-sebavio-navy text-sm leading-snug font-semibold">
          {name}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {city ? `${city} · ` : ""}à {formatKm(stop.distanceFromStartKm)} km du
          départ
        </p>
        <p className="text-sebavio-navy mt-1.5 text-xs font-medium">
          {stop.pricePerLiter != null
            ? `${Number(stop.pricePerLiter).toLocaleString("fr-CA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 3,
              })} $/L`
            : "Prix —"}
          {" · "}
          {formatLiters(stop.litersAdded)} L{" · "}
          {formatCost(stop.cost)} CAD
        </p>
        {canMap ? (
          <button
            type="button"
            className="text-sebavio-teal mt-1.5 inline-flex min-h-9 items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
            data-testid={`fuel-stop-map-${stop.id}`}
            onClick={() => {
              document
                .getElementById("trip-map-section")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
              onFocus?.({ id: stop.id, latitude: lat, longitude: lng });
            }}
          >
            <MapPin className="size-3.5" aria-hidden />
            Voir sur la carte
          </button>
        ) : null}
      </div>
      <ChevronRight
        className="text-muted-foreground mt-1 size-4 shrink-0 opacity-50"
        aria-hidden
      />
    </li>
  );
}

/**
 * Estimation carburant — résumé clair + plan simplifié + paramètres repliés.
 */
export function TripFuelSettingsCard() {
  const {
    form,
    patch,
    setForm,
    estimate,
    calc,
    error,
    pending,
    hasVehicle,
    canCalculate,
    needsManualPrice,
    vehicleLabel,
    distanceKm,
    routeFresh,
    recalculate,
    fdeUnsupported,
    onFocusFuelStop,
    userFuelWarnings,
    vehicleSpecRecalcNotice,
    fuelCalculationStatus,
  } = useTripFuelEstimateContext();

  const openManualPrice = Boolean(needsManualPrice && error);

  const outbound = calc?.outbound?.refuelStops ?? [];
  const inbound =
    calc?.includeReturnTrip || form.includeReturnTrip
      ? (calc?.returnLeg?.refuelStops ?? [])
      : [];
  const stopCount = outbound.length + inbound.length;
  const savingsRaw = estimate?.refuelPlan?.estimatedSavingsVsNaive;
  const savingsNum = savingsRaw != null ? Number(savingsRaw) : null;

  const costValue =
    calc && estimate && !pending ? `${formatCost(calc.moneySpent)} CAD` : "—";
  const litersValue =
    calc && estimate && !pending
      ? `${formatLiters(calc.totalLitersConsumed)} L`
      : "—";
  const stopsValue =
    calc && estimate && !pending && calc.feasible
      ? String(stopCount)
      : pending
        ? "…"
        : "—";
  const remainingValue =
    calc && estimate && !pending
      ? `${formatLiters(calc.remainingFuelL)} L`
      : null;

  const firstRefuelKmRaw =
    calc && estimate && !pending && calc.feasible
      ? (calc.outbound?.refuelStops?.[0]?.distanceFromStartKm ??
        calc.returnLeg?.refuelStops?.[0]?.distanceFromStartKm ??
        null)
      : null;
  const firstRefuelKm =
    firstRefuelKmRaw != null ? Number(firstRefuelKmRaw) : null;

  const usefulTip =
    firstRefuelKm != null && Number.isFinite(firstRefuelKm) && firstRefuelKm > 0
      ? `Premier ravitaillement prévu après environ ${formatKm(String(firstRefuelKm))} km.`
      : calc && estimate && !pending && calc.feasible && stopCount === 0
        ? "Aucun plein en route requis pour ce trajet."
        : null;

  return (
    <section
      id="trip-fuel-section"
      className="trip-card flex scroll-mt-28 flex-col space-y-5 p-5 sm:scroll-mt-32 sm:p-6"
      data-testid="trip-fuel-estimate-panel"
      aria-labelledby="trip-fuel-title"
    >
      <div className="flex gap-3">
        <span
          className="bg-sebavio-teal flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm"
          aria-hidden
        >
          <Image
            src={BRAND_ASSETS.icons.carburant.blanc}
            alt=""
            width={24}
            height={24}
            className="size-6 object-contain"
          />
        </span>
        <div className="min-w-0">
          <h2
            id="trip-fuel-title"
            className="font-heading text-sebavio-navy text-lg font-semibold"
          >
            Plan carburant
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {hasVehicle
              ? (estimate?.vehicleLabel ?? vehicleLabel ?? "Véhicule")
              : "Résumé clair du coût et des arrêts"}
          </p>
        </div>
      </div>

      {!routeFresh || !distanceKm ? (
        <p className="text-muted-foreground text-sm" role="status">
          Calculez d&apos;abord l&apos;itinéraire pour estimer le carburant.
        </p>
      ) : null}

      {canCalculate && pending && !estimate ? (
        <div
          className="space-y-2"
          role="status"
          data-testid="fuel-calc-loading"
        >
          <Skeleton className="h-16 w-full rounded-xl" />
          <p className="text-muted-foreground text-sm">
            Calcul du plan de carburant…
          </p>
        </div>
      ) : null}

      {fuelCalculationStatus === "stale" && !pending ? (
        <div
          className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
          data-testid="fuel-stale-banner"
        >
          <p className="font-medium">Estimation carburant à actualiser</p>
          <p>
            L’itinéraire a été mis à jour, mais Sebavio n’a pas pu recalculer
            immédiatement les arrêts de carburant. La dernière estimation valide
            est affichée temporairement.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-9"
            disabled={pending}
            onClick={recalculate}
            data-testid="fuel-retry-calculation"
          >
            Réessayer le calcul
          </Button>
        </div>
      ) : null}

      {vehicleSpecRecalcNotice || (pending && estimate) ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="status"
        >
          Recalcul de l&apos;itinéraire carburant…
        </p>
      ) : null}

      {canCalculate && calc && estimate && !pending ? (
        <>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            data-testid="fuel-summary-metrics"
          >
            <Metric label="Coût estimé" value={costValue} emphasize />
            <Metric label="Volume total" value={litersValue} />
            <Metric label="Arrêts" value={stopsValue} />
            {remainingValue ? (
              <Metric label="À l'arrivée" value={remainingValue} />
            ) : (
              <Metric
                label="Distance"
                value={`${formatKm(calc.totalDistanceKm)} km`}
              />
            )}
          </div>

          {usefulTip ? (
            <p className="text-sebavio-navy flex items-start gap-2 text-sm font-medium">
              <CircleDollarSign
                className="text-sebavio-teal mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <span>{usefulTip}</span>
            </p>
          ) : null}

          {savingsNum != null && savingsNum > 0.01 ? (
            <p
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-900"
              data-testid="fuel-savings-banner"
            >
              Économie estimée : {formatCost(String(savingsNum))} CAD vs plein
              au départ
            </p>
          ) : null}

          <div className="space-y-3">
            {calc.feasible ? (
              !(calc.includeReturnTrip || form.includeReturnTrip) &&
              stopCount === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucun plein en route requis pour ce trajet.
                </p>
              ) : (
                <div className="space-y-4" data-testid="fuel-stops-list">
                  <div className="space-y-2" data-testid="fuel-plan-outbound">
                    <h4 className="text-sebavio-teal text-xs font-bold tracking-wide uppercase">
                      Aller
                      {outbound.length > 0
                        ? ` · ${outbound.length} arrêt${outbound.length > 1 ? "s" : ""}`
                        : ""}
                    </h4>
                    {outbound.length === 0 ? (
                      <p className="text-muted-foreground rounded-xl border border-dashed border-[rgb(14_45_70/0.12)] bg-[#f8fafb] px-3 py-2.5 text-sm">
                        Aucun plein en route requis pour l&apos;aller.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {outbound.map((s) => (
                          <SimpleStopRow
                            key={s.id}
                            stop={s}
                            legLabel="ALLER"
                            onFocus={onFocusFuelStop}
                          />
                        ))}
                      </ul>
                    )}
                  </div>

                  {(calc.includeReturnTrip || form.includeReturnTrip) && (
                    <div
                      className="space-y-2 border-t border-[rgb(14_45_70/0.08)] pt-4"
                      data-testid="fuel-plan-return"
                    >
                      <h4 className="text-sebavio-teal text-xs font-bold tracking-wide uppercase">
                        Retour
                        {inbound.length > 0
                          ? ` · ${inbound.length} arrêt${inbound.length > 1 ? "s" : ""}`
                          : ""}
                      </h4>
                      {inbound.length === 0 ? (
                        <p className="text-muted-foreground rounded-xl border border-dashed border-[rgb(14_45_70/0.12)] bg-[#f8fafb] px-3 py-2.5 text-sm">
                          Aucun plein en route requis pour le retour.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {inbound.map((s) => (
                            <SimpleStopRow
                              key={s.id}
                              stop={s}
                              legLabel="RETOUR"
                              onFocus={onFocusFuelStop}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              <p className="text-destructive text-sm" role="alert">
                {calc.failureMessage ??
                  "Aucun arrêt carburant accessible n’a été trouvé."}
              </p>
            )}
          </div>
        </>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" data-testid="fuel-calc-error">
          {error}
        </p>
      ) : null}

      {/* Paramètres techniques — repliés par défaut */}
      {hasVehicle ? (
        <FuelAccordion
          title="Modifier les paramètres de carburant"
          summary={
            canCalculate
              ? `${summarizeTripLeg(form.includeReturnTrip, distanceKm)} · ${summarizeInitialFuel(form.initialFuelMode, form.initialFuelValue)}`
              : "Type de carburant et réservoir"
          }
          defaultOpen={openManualPrice}
        >
          <div className="space-y-3" data-testid="fuel-vehicle-section">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                htmlFor="trip-fuel-type"
                label="Type de carburant"
                className="w-full min-w-0"
              >
                <select
                  id="trip-fuel-type"
                  name="fuelType"
                  data-testid="fuel-type-select"
                  className={selectClass}
                  value={form.fuelType}
                  onChange={(e) => {
                    const next = e.target.value as TripFuelTypeValue;
                    setForm((f) => ({
                      ...f,
                      fuelType: next,
                      forceManualPrice: fdeUnsupported.has(next)
                        ? true
                        : f.forceManualPrice,
                    }));
                  }}
                >
                  {TRIP_FUEL_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>

              {canCalculate ? (
                <FormField htmlFor="initial-fuel" label="Niveau du réservoir">
                  <select
                    id="initial-fuel"
                    className={selectClass}
                    value={form.initialFuelMode}
                    onChange={(e) => patch("initialFuelMode", e.target.value)}
                  >
                    <option value="full">Plein</option>
                    <option value="three_quarters">3/4</option>
                    <option value="half">1/2</option>
                    <option value="quarter">1/4</option>
                    <option value="empty">Vide</option>
                    <option value="percentage">Pourcentage personnalisé</option>
                    <option value="litres">Litres personnalisés</option>
                  </select>
                </FormField>
              ) : null}
            </div>

            {canCalculate &&
            (form.initialFuelMode === "percentage" ||
              form.initialFuelMode === "litres") ? (
              <FormField
                htmlFor="initial-value"
                label={
                  form.initialFuelMode === "percentage"
                    ? "Pourcentage"
                    : "Litres"
                }
              >
                <Input
                  id="initial-value"
                  type="number"
                  min={0}
                  step="0.1"
                  className="min-h-11 w-full"
                  value={form.initialFuelValue}
                  onChange={(e) => patch("initialFuelValue", e.target.value)}
                />
              </FormField>
            ) : null}

            {canCalculate ? (
              <FormField htmlFor="dep-mode" label="Situation au départ">
                <select
                  id="dep-mode"
                  className={selectClass}
                  value={form.departureRefillMode}
                  onChange={(e) => patch("departureRefillMode", e.target.value)}
                >
                  <option value="none">Ne pas facturer de plein initial</option>
                  <option value="automatic">Calculer le plein au départ</option>
                  <option value="manual_total">
                    Entrer manuellement le prix du plein
                  </option>
                </select>
              </FormField>
            ) : null}

            {canCalculate && form.departureRefillMode === "manual_total" ? (
              <FormField htmlFor="dep-manual" label="Montant du plein (CAD)">
                <Input
                  id="dep-manual"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="ex. 50.00"
                  className="min-h-11 w-full"
                  value={form.departureManualTotal}
                  onChange={(e) =>
                    patch("departureManualTotal", e.target.value)
                  }
                />
              </FormField>
            ) : null}

            {needsManualPrice ? (
              <FormField
                htmlFor="manual-price"
                label="Prix manuel par litre"
                hint="Aucun prix automatique disponible pour ce type de carburant."
                className="w-full min-w-0"
              >
                <Input
                  id="manual-price"
                  data-testid="manual-price-input"
                  type="number"
                  min={0.001}
                  step="0.001"
                  inputMode="decimal"
                  placeholder="0,000"
                  className="min-h-11 w-full min-w-0"
                  value={form.defaultPricePerLiter}
                  onChange={(e) =>
                    patch("defaultPricePerLiter", e.target.value)
                  }
                />
              </FormField>
            ) : null}

            {canCalculate ? (
              <div className="space-y-2">
                <FuelAccordion
                  title="Paramètres avancés"
                  summary={`${summarizeTripLeg(form.includeReturnTrip, distanceKm)} · ${summarizeStrategy(form.refillStrategy, form.reserveMode, form.reserveValue)}`}
                >
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      id="includeReturnTrip"
                      data-testid="include-return-trip"
                      type="checkbox"
                      checked={form.includeReturnTrip}
                      onChange={(e) =>
                        patch("includeReturnTrip", e.target.checked)
                      }
                    />
                    Calculer l&apos;aller-retour
                  </label>

                  <FormField
                    htmlFor="strategy"
                    label="Stratégie de remplissage"
                  >
                    <select
                      id="strategy"
                      className={selectClass}
                      value={form.refillStrategy}
                      onChange={(e) => patch("refillStrategy", e.target.value)}
                    >
                      <option value="full_tank">
                        Remplir complètement le réservoir
                      </option>
                      <option value="required_only">
                        Ajouter seulement la quantité nécessaire
                      </option>
                      <option value="optimized">Optimisation de coût</option>
                    </select>
                  </FormField>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField htmlFor="reserve-mode" label="Réserve minimale">
                      <select
                        id="reserve-mode"
                        className={selectClass}
                        value={form.reserveMode}
                        onChange={(e) => patch("reserveMode", e.target.value)}
                      >
                        <option value="percentage">
                          Pourcentage du réservoir
                        </option>
                        <option value="litres">Litres</option>
                      </select>
                    </FormField>
                    <FormField htmlFor="reserve-value" label="Valeur">
                      <Input
                        id="reserve-value"
                        type="number"
                        min={0.1}
                        step="0.1"
                        className="min-h-11 w-full"
                        value={form.reserveValue}
                        onChange={(e) => patch("reserveValue", e.target.value)}
                      />
                    </FormField>
                  </div>

                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.refillAtDestination}
                      onChange={(e) =>
                        patch("refillAtDestination", e.target.checked)
                      }
                    />
                    Prévoir un plein à destination
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.finishWithFullTank}
                      onChange={(e) =>
                        patch("finishWithFullTank", e.target.checked)
                      }
                    />
                    Terminer le voyage avec un réservoir plein
                  </label>

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.includeExistingFuelValue}
                      onChange={(e) =>
                        patch("includeExistingFuelValue", e.target.checked)
                      }
                    />
                    <span>
                      Inclure le coût du carburant déjà présent dans le
                      réservoir
                    </span>
                  </label>

                  {!needsManualPrice ? (
                    <label className="text-muted-foreground flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.forceManualPrice}
                        onChange={(e) =>
                          patch("forceManualPrice", e.target.checked)
                        }
                      />
                      Forcer un prix manuel ($/L)
                    </label>
                  ) : null}
                </FuelAccordion>

                <FuelAccordion
                  title="Corrections manuelles"
                  summary={
                    form.defaultPricePerLiter || form.consumptionL100
                      ? "Corrections actives"
                      : "Aucune correction"
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {!needsManualPrice ? (
                      <FormField
                        htmlFor="est-price"
                        label="Prix / L (correction)"
                      >
                        <Input
                          id="est-price"
                          type="number"
                          min={0.001}
                          step="0.001"
                          placeholder="ex. 1.650"
                          className="min-h-11 w-full"
                          value={form.defaultPricePerLiter}
                          onChange={(e) =>
                            patch("defaultPricePerLiter", e.target.value)
                          }
                        />
                      </FormField>
                    ) : null}
                    <FormField htmlFor="est-conso" label="Conso L/100">
                      <Input
                        id="est-conso"
                        type="number"
                        min={0.1}
                        step="0.1"
                        placeholder="ex. 9.4"
                        className="min-h-11 w-full"
                        value={form.consumptionL100}
                        onChange={(e) =>
                          patch("consumptionL100", e.target.value)
                        }
                      />
                    </FormField>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Réservoir :{" "}
                    {summarizeInitialFuel(
                      form.initialFuelMode,
                      form.initialFuelValue,
                    )}{" "}
                    · Départ :{" "}
                    {summarizeDepartureRefill(form.departureRefillMode)}
                  </p>
                </FuelAccordion>

                <Button
                  type="button"
                  className="bg-sebavio-navy hover:bg-sebavio-navy/90 min-h-11 w-full text-white"
                  disabled={pending}
                  onClick={recalculate}
                  data-testid="fuel-recalculate-settings"
                >
                  <Fuel className="size-4" aria-hidden />
                  Recalculer
                </Button>
              </div>
            ) : null}
          </div>
        </FuelAccordion>
      ) : (
        <p className="text-muted-foreground text-sm">
          Sélectionnez un véhicule pour estimer le carburant.
        </p>
      )}

      {canCalculate && estimate && calc ? (
        <FuelPriceWarningCard
          warnings={userFuelWarnings}
          priceUpdatedAt={
            calc.allStops.find((s) => s.pricePeriod)?.pricePeriod ?? null
          }
          pending={pending}
          onRecalculate={recalculate}
        />
      ) : null}
    </section>
  );
}
