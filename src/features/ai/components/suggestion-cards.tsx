"use client";

import { Button } from "@/components/ui/button";
import type {
  TripAssistantSuggestion,
  TripAssistantWarning,
} from "@/features/ai/schemas/response";
import type { ProposedTripAction } from "@/features/ai/schemas/actions";

export function TripAssistantSuggestions({
  suggestions,
  warnings,
  onProposeAction,
}: {
  suggestions: TripAssistantSuggestion[];
  warnings: TripAssistantWarning[];
  onProposeAction: (action: ProposedTripAction) => void;
}) {
  return (
    <div className="space-y-2">
      {warnings.map((w) => (
        <div
          key={`${w.code}-${w.title}`}
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
          role="status"
        >
          <p className="font-medium">{w.title}</p>
          <p className="mt-0.5 opacity-90">{w.description}</p>
        </div>
      ))}

      {suggestions.map((s) => {
        const action = s.proposedAction;
        const deferred =
          action?.type === "create_detour" || action?.type === "other";
        return (
          <article
            key={s.id}
            className="border-sebavio-navy/10 rounded-xl border bg-[linear-gradient(135deg,#ffffff,#f3fafb)] p-3 text-xs shadow-sm"
          >
            <h4 className="text-sebavio-navy text-sm font-medium">{s.title}</h4>
            <p className="text-muted-foreground mt-1">{s.description}</p>
            <p className="text-sebavio-navy/80 mt-1">
              <span className="font-medium">Pourquoi : </span>
              {s.reason}
            </p>
            <dl className="text-muted-foreground mt-2 grid grid-cols-2 gap-1">
              <div>
                <dt className="text-sebavio-navy/70 font-medium">Durée</dt>
                <dd>
                  {s.estimatedDurationMinutes != null
                    ? `${s.estimatedDurationMinutes} min`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sebavio-navy/70 font-medium">Météo</dt>
                <dd>{s.weatherCompatibility}</dd>
              </div>
              <div>
                <dt className="text-sebavio-navy/70 font-medium">Détour</dt>
                <dd>
                  {s.estimatedAdditionalDistanceKm != null
                    ? `${s.estimatedAdditionalDistanceKm} km`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sebavio-navy/70 font-medium">Retard</dt>
                <dd>
                  {s.estimatedDelayMinutes != null
                    ? `${s.estimatedDelayMinutes} min`
                    : "—"}
                </dd>
              </div>
            </dl>
            {s.requiresVerification ? (
              <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-amber-900">
                À confirmer — information non vérifiée par Sebavio.
              </p>
            ) : null}
            {action ? (
              deferred ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled
                >
                  Voir la modification (bientôt)
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  onClick={() => onProposeAction(action)}
                >
                  {action.type === "add_activity" || action.type === "add_pause"
                    ? "Ajouter au voyage"
                    : "Appliquer cette suggestion"}
                </Button>
              )
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
