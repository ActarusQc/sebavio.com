"use client";

import {
  formatDistanceKm,
  formatDurationMinutes,
} from "@/features/ai-trip-planner/lib/format";
import type { TripDraft } from "@/features/ai-trip-planner/types";

type Props = {
  draft: TripDraft;
};

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[#e8eef3] bg-white px-3 py-3 text-center shadow-[0_2px_8px_rgba(8,43,70,0.03)]">
      <p className="font-heading text-sebavio-navy text-lg font-bold">
        {value}
      </p>
      <p className="text-sebavio-slate mt-0.5 text-[0.7rem] leading-snug">
        {label}
      </p>
    </div>
  );
}

export function AITripStats({ draft }: Props) {
  const stopsCount =
    draft.stops.filter((s) => s.accepted).length +
    draft.activities.filter((a) => a.accepted).length;
  const activitiesCount = draft.activities.filter((a) => a.accepted).length;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatCard
        value={formatDistanceKm(draft.estimatedDistanceKm) ?? "—"}
        label="Distance estimée"
      />
      <StatCard
        value={formatDurationMinutes(draft.estimatedDurationMinutes) ?? "—"}
        label="Durée estimée"
      />
      <StatCard
        value={stopsCount > 0 ? String(stopsCount) : "—"}
        label="Arrêts suggérés"
      />
      <StatCard
        value={activitiesCount > 0 ? String(activitiesCount) : "—"}
        label="Activités proposées"
      />
    </div>
  );
}
