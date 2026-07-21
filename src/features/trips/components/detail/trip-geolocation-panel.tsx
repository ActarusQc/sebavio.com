"use client";

import { Crosshair, MapPin, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui";
import type { TripLocationUiState } from "@/features/trips/hooks/use-trip-location-tracking";
import { cn } from "@/lib/utils";

const STATE_LABELS: Record<TripLocationUiState, string> = {
  disabled: "Position désactivée",
  permission_required: "Localisation désactivée",
  active: "Position active",
  approximate: "Position approximative",
  reconnecting: "Reconnexion au GPS…",
  paused: "Position en pause",
  unavailable: "GPS temporairement indisponible",
  denied: "Permission refusée",
  unsupported: "Géolocalisation non supportée",
};

type Props = {
  uiState: TripLocationUiState;
  messageFr?: string | null;
  canCenter: boolean;
  onActivate: () => void;
  onPause: () => void;
  onResume: () => void;
  onRetry: () => void;
  onCenter: () => void;
  className?: string;
};

export function TripGeolocationPanel({
  uiState,
  messageFr,
  canCenter,
  onActivate,
  onPause,
  onResume,
  onRetry,
  onCenter,
  className,
}: Props) {
  if (uiState === "disabled") return null;

  const isActive =
    uiState === "active" ||
    uiState === "approximate" ||
    uiState === "reconnecting";

  const isPermissionPrompt =
    uiState === "permission_required" || uiState === "denied";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-1.5 sm:gap-2.5",
        isPermissionPrompt
          ? "border-[rgb(14_45_70/0.08)] bg-[rgb(248_250_252)]"
          : "border-[rgb(14_45_70/0.08)] bg-white/90",
        className,
      )}
      data-testid="trip-geolocation-panel"
      role="status"
      aria-label="Géolocalisation"
    >
      <MapPin
        className={cn(
          "size-3.5 shrink-0",
          isActive ? "text-sky-700" : "text-sebavio-muted",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sebavio-navy text-[12px] font-medium sm:text-[13px]">
          {STATE_LABELS[uiState]}
          {isPermissionPrompt ? (
            <span className="text-muted-foreground font-normal">
              {" "}
              — Activez-la pour suivre votre progression.
            </span>
          ) : messageFr ? (
            <span className="text-muted-foreground font-normal">
              {" "}
              — {messageFr}
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {uiState === "permission_required" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-sebavio-navy/25 text-sebavio-navy h-8 px-3 text-[12px] font-semibold"
            onClick={onActivate}
            data-testid="trip-geo-activate"
          >
            Activer
          </Button>
        ) : null}
        {uiState === "denied" || uiState === "unavailable" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9"
            onClick={onRetry}
            data-testid="trip-geo-retry"
          >
            Réessayer
          </Button>
        ) : null}
        {isActive ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9"
            onClick={onPause}
            data-testid="trip-geo-pause"
          >
            <Pause className="size-3.5" aria-hidden />
            Pause
          </Button>
        ) : null}
        {uiState === "paused" ? (
          <Button
            type="button"
            size="sm"
            className="bg-sebavio-navy hover:bg-sebavio-navy/90 h-9 text-white"
            onClick={onResume}
            data-testid="trip-geo-resume"
          >
            <Play className="size-3.5" aria-hidden />
            Reprendre
          </Button>
        ) : null}
        {canCenter || isActive || uiState === "paused" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9"
            onClick={onCenter}
            disabled={!canCenter}
            data-testid="trip-geo-center"
            aria-label="Recentrer sur ma position"
          >
            <Crosshair className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
