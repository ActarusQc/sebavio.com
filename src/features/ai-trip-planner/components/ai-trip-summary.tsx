"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  Car,
  CircleDollarSign,
  MapIcon,
  MapPin,
  Settings2,
  Sparkles,
  Users,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISuggestions } from "@/features/ai-trip-planner/components/ai-suggestions";
import { AITripStats } from "@/features/ai-trip-planner/components/ai-trip-stats";
import {
  formatBudgetLevel,
  formatDateRangeFr,
  formatPlaceSummary,
  formatTravelers,
  MISSING_FIELD_LABELS,
} from "@/features/ai-trip-planner/lib/format";
import { formatInterestsListFr } from "@/features/ai-trip-planner/lib/labels";
import { AIItineraryProposal } from "@/features/ai-trip-planner/components/ai-itinerary-proposal";
import type {
  ItineraryProposalDto,
  TripDraft,
} from "@/features/ai-trip-planner/types";
import { cn } from "@/lib/utils";

type RowProps = {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  accent?: boolean;
};

function SummaryRow({ icon, label, value, accent }: RowProps) {
  const display = value?.trim() || "À préciser";
  const pending = !value?.trim();

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="text-sebavio-slate/80 mt-0.5 [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sebavio-slate/70 text-[0.7rem] tracking-wide uppercase">
          {label}
        </p>
        <p
          className={cn(
            "text-sm font-medium",
            pending ? "text-sebavio-slate/55" : "text-sebavio-navy",
            accent && !pending && "inline-flex items-center gap-1.5",
          )}
        >
          {accent && !pending ? (
            <span
              className="bg-sebavio-gold size-1.5 rounded-full"
              aria-hidden
            />
          ) : null}
          {display}
        </p>
      </div>
    </div>
  );
}

type Props = {
  draft: TripDraft;
  missingFields: string[];
  canCreate: boolean;
  creating?: boolean;
  proposal?: ItineraryProposalDto | null;
  onCreate: () => void;
  onContinue: () => void;
  className?: string;
};

export function AITripSummary({
  draft,
  missingFields,
  canCreate,
  creating,
  proposal,
  onCreate,
  onContinue,
  className,
}: Props) {
  const dates = formatDateRangeFr(draft.departureDate, draft.returnDate);
  const travelers = formatTravelers(draft);
  const budget = formatBudgetLevel(draft.budgetLevel);
  const interests =
    draft.interests?.length > 0
      ? formatInterestsListFr(draft.interests)
      : [...draft.travelStyle, ...draft.preferences]
          .filter(Boolean)
          .slice(0, 6)
          .join(" · ");

  const missingLabels = missingFields
    .map((f) => MISSING_FIELD_LABELS[f] ?? f)
    .filter(Boolean);

  return (
    <aside
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-[#dfe7ef] bg-white p-4 shadow-[0_8px_28px_rgba(8,43,70,0.05)] sm:p-5",
        className,
      )}
    >
      <header className="flex items-center gap-2">
        <MapIcon className="text-sebavio-teal size-4" aria-hidden />
        <h2 className="font-heading text-sebavio-navy text-base font-semibold">
          Résumé de mon voyage
        </h2>
      </header>

      <div className="divide-y divide-[#eef2f6]">
        <SummaryRow
          icon={<MapPin />}
          label="Départ"
          value={formatPlaceSummary(draft.origin)}
        />
        <SummaryRow
          icon={<Compass />}
          label="Destination"
          value={formatPlaceSummary(draft.destination)}
        />
        <SummaryRow icon={<CalendarDays />} label="Dates" value={dates} />
        <SummaryRow icon={<Users />} label="Voyageurs" value={travelers} />
        <SummaryRow
          icon={<Car />}
          label="Véhicule"
          value={draft.vehicleLabel}
        />
        <SummaryRow
          icon={<CircleDollarSign />}
          label="Budget"
          value={budget}
          accent
        />
        <SummaryRow
          icon={<Sparkles />}
          label="Intérêts"
          value={interests || null}
        />
        {draft.lodgingSelection?.name ||
        draft.lodgingType ||
        draft.accommodationMode === "decide_later" ? (
          <SummaryRow
            icon={<MapPin />}
            label="Hébergement"
            value={
              draft.lodgingSelection?.name
                ? draft.lodgingType
                  ? `${draft.lodgingSelection.name} (${draft.lodgingType})`
                  : draft.lodgingSelection.name
                : draft.accommodationMode === "decide_later"
                  ? "Hébergement à déterminer"
                  : draft.lodgingRequested
                    ? `${draft.lodgingType ?? "Hébergement"} — à choisir`
                    : draft.lodgingType
            }
          />
        ) : null}
        {draft.pace ? (
          <SummaryRow icon={<Compass />} label="Rythme" value={draft.pace} />
        ) : null}
      </div>

      <AITripStats draft={draft} />

      {proposal ? <AIItineraryProposal proposal={proposal} /> : null}

      <AISuggestions
        suggestions={
          draft.suggestions.length
            ? draft.suggestions
            : draft.activities
                .filter((a) => a.accepted)
                .slice(0, 3)
                .map((a) => ({
                  id: a.id,
                  name: a.name,
                  category: a.category,
                  justification: a.justification,
                  imageUrl: null,
                  accepted: true,
                }))
        }
      />

      <div className="mt-auto space-y-2.5 pt-1">
        {!canCreate && missingLabels.length > 0 ? (
          <p className="text-sebavio-slate text-xs leading-relaxed">
            Informations manquantes : {missingLabels.join(", ")}.
          </p>
        ) : null}
        <Button
          type="button"
          size="lg"
          disabled={!canCreate || creating}
          onClick={onCreate}
          className="bg-sebavio-navy hover:bg-sebavio-navy/90 h-11 w-full text-white hover:brightness-100"
        >
          <Sparkles data-icon="inline-start" />
          {creating ? "Création…" : "Créer le voyage"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onContinue}
          className="h-11 w-full"
        >
          <Settings2 data-icon="inline-start" />
          Continuer à ajuster
        </Button>
      </div>
    </aside>
  );
}
