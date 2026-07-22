"use client";

import { Clock3, Fuel, MapPinned, Route } from "lucide-react";
import {
  formatDurationFr,
  getItineraryTypeLabel,
} from "@/features/ai-trip-planner/lib/labels";
import type { ItineraryProposalDto } from "@/features/ai-trip-planner/types";

type Props = {
  proposal: ItineraryProposalDto;
};

export function AIItineraryProposal({ proposal }: Props) {
  const drive = formatDurationFr(proposal.estimatedDurationMinutes);

  return (
    <section
      className="mt-3 space-y-3 rounded-2xl border border-[#d7e4ef] bg-[#f7fafc] p-3.5 sm:p-4"
      aria-label="Proposition d’itinéraire"
    >
      <header className="space-y-1">
        <p className="text-sebavio-slate/80 text-[0.7rem] font-semibold tracking-wide uppercase">
          Proposition d’itinéraire
        </p>
        <h3 className="font-heading text-sebavio-navy text-base font-semibold">
          {proposal.title}
        </h3>
        <p className="text-sebavio-slate text-sm leading-relaxed">
          {proposal.summary}
        </p>
        {proposal.dateLabel ? (
          <p className="text-sebavio-navy/80 text-xs font-medium">
            {proposal.dateLabel}
          </p>
        ) : null}
        {proposal.interestsLabels?.length ? (
          <p className="text-sebavio-navy/90 text-xs">
            <span className="font-semibold">Vos préférences</span>
            {" — "}
            {proposal.interestsLabels.join(", ")}
          </p>
        ) : null}
        {proposal.softWarnings?.length
          ? proposal.softWarnings.map((w) => (
              <p
                key={w}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900"
              >
                {w}
              </p>
            ))
          : null}
      </header>

      <div className="text-sebavio-navy flex flex-wrap gap-3 text-xs">
        {proposal.estimatedDistanceKm != null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2eaf1] bg-white px-2.5 py-1">
            <Route className="text-sebavio-teal size-3.5" aria-hidden />
            {Math.round(proposal.estimatedDistanceKm)} km
          </span>
        ) : null}
        {drive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2eaf1] bg-white px-2.5 py-1">
            <Clock3 className="text-sebavio-teal size-3.5" aria-hidden />
            {drive}
          </span>
        ) : null}
        {proposal.estimatedFuelStops != null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2eaf1] bg-white px-2.5 py-1">
            <Fuel className="text-sebavio-teal size-3.5" aria-hidden />
            {proposal.estimatedFuelStops} arrêt
            {proposal.estimatedFuelStops > 1 ? "s" : ""} carburant
          </span>
        ) : null}
      </div>

      <div className="space-y-3">
        {proposal.days.map((day) => (
          <div
            key={day.day}
            className="rounded-xl border border-[#e4ebf2] bg-white p-3"
          >
            <p className="text-sebavio-navy mb-2 text-xs font-semibold tracking-wide uppercase">
              {day.label}
            </p>
            <ul className="space-y-2">
              {day.items.map((item) => (
                <li
                  key={`${day.day}-${item.name}`}
                  className="flex gap-2 text-sm"
                >
                  <MapPinned
                    className="text-sebavio-gold mt-0.5 size-3.5 shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sebavio-navy font-medium">{item.name}</p>
                    <p className="text-sebavio-slate text-xs">
                      {getItineraryTypeLabel(item.category)}
                      {item.themeLabels?.length
                        ? ` · ${item.themeLabels.join(" · ")}`
                        : ""}
                      {item.justification ? ` — ${item.justification}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
