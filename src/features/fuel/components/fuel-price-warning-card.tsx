"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { USER_FUEL_WARNING_COPY } from "@/features/fuel/lib/user-fuel-warnings";

type Props = {
  warnings: string[];
  priceUpdatedAt?: string | null;
  pending?: boolean;
  onRecalculate: () => void;
};

const PRICE_NOTICE = `${USER_FUEL_WARNING_COPY.mayHaveChanged} Ils sont calculés à partir des données les plus récentes disponibles et peuvent varier selon la station.`;

function formatUpdatedAt(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("fr-CA", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Regroupe les avertissements de fraîcheur / estimation des prix
 * dans une seule carte (évite les doublons).
 */
export function FuelPriceWarningCard({
  warnings,
  priceUpdatedAt,
  pending = false,
  onRecalculate,
}: Props) {
  const hasPriceNotice = warnings.some(
    (w) =>
      w === USER_FUEL_WARNING_COPY.mayHaveChanged ||
      w === USER_FUEL_WARNING_COPY.estimate ||
      /changé|estimés|peuvent varier/i.test(w),
  );
  const business = warnings.filter(
    (w) =>
      w !== USER_FUEL_WARNING_COPY.mayHaveChanged &&
      w !== USER_FUEL_WARNING_COPY.estimate,
  );

  if (!hasPriceNotice && business.length === 0) return null;

  const updated = formatUpdatedAt(priceUpdatedAt);

  return (
    <aside
      className="bg-sebavio-orange-soft rounded-[var(--radius-card)] border border-amber-300/80 p-4"
      data-testid="fuel-price-warning-card"
      role="status"
    >
      <div className="flex gap-3">
        <AlertTriangle
          className="text-sebavio-orange mt-0.5 size-5 shrink-0"
          aria-hidden
        />
        <div className="min-w-0 space-y-2">
          {hasPriceNotice ? (
            <p
              className="text-sm text-amber-950"
              data-testid="fuel-user-warning"
            >
              {PRICE_NOTICE}
            </p>
          ) : null}
          {business.map((w) => (
            <p
              key={w}
              className="text-sm text-amber-950"
              data-testid="fuel-user-warning"
            >
              {w}
            </p>
          ))}
          {updated ? (
            <p className="text-xs text-amber-900/80">
              Dernière mise à jour des prix : {updated}
            </p>
          ) : null}
          <Button
            type="button"
            className="bg-sebavio-orange hover:bg-sebavio-orange/90 min-h-11 text-white"
            disabled={pending}
            onClick={onRecalculate}
          >
            Recalculer maintenant
          </Button>
        </div>
      </div>
    </aside>
  );
}
