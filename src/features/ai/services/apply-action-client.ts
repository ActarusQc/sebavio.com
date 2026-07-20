import type { ProposedTripAction } from "@/features/ai/schemas/actions";

/**
 * Indique si une action nécessite une confirmation d'emplacement côté UI.
 */
export function actionNeedsLocationConfirmation(
  action: ProposedTripAction,
): boolean {
  if (action.type !== "add_activity" && action.type !== "add_pause") {
    return false;
  }
  if (action.locationConfirmed) return false;
  if (action.targetStopId) return false;
  if (action.type === "add_activity" && action.activityId) return false;
  const hasCoords =
    typeof action.latitude === "number" &&
    typeof action.longitude === "number" &&
    Number.isFinite(action.latitude) &&
    Number.isFinite(action.longitude);
  if (hasCoords && action.locationSource === "ai_suggested") return true;
  if (!hasCoords) return true;
  return action.locationSource === "ai_suggested";
}

export function describeProposedAction(action: ProposedTripAction): {
  title: string;
  details: string[];
  applicable: boolean;
  needsLocationConfirmation: boolean;
} {
  const needsLocationConfirmation = actionNeedsLocationConfirmation(action);
  switch (action.type) {
    case "add_activity":
      return {
        title: needsLocationConfirmation
          ? "Emplacement requis"
          : `Ajouter l’activité « ${action.title} »`,
        details: needsLocationConfirmation
          ? [
              "Sebavio doit confirmer l’emplacement de cette suggestion avant de pouvoir l’ajouter au trajet.",
              `Activité : ${action.title}`,
              `Durée estimée : ${action.durationMinutes} min`,
            ]
          : [
              `Durée estimée : ${action.durationMinutes} min`,
              `Trajet : ${action.direction ?? "outbound"}`,
              action.estimatedImpact ?? "Impact à confirmer après recalcul",
              action.activityId
                ? "Activité catalogue Sebavio"
                : "Création d’une étape activité (à confirmer)",
            ],
        applicable: true,
        needsLocationConfirmation,
      };
    case "add_pause":
      return {
        title: needsLocationConfirmation
          ? "Emplacement requis"
          : `Ajouter la pause « ${action.title} »`,
        details: needsLocationConfirmation
          ? [
              "Sebavio doit confirmer l’emplacement de cette suggestion avant de pouvoir l’ajouter au trajet.",
              `Pause : ${action.title}`,
              `Durée : ${action.durationMinutes} min`,
            ]
          : [
              `Durée : ${action.durationMinutes} min`,
              `Trajet : ${action.direction ?? "outbound"}`,
              action.estimatedImpact ?? "Impact à confirmer après recalcul",
            ],
        applicable: true,
        needsLocationConfirmation,
      };
    case "update_activity_duration":
      return {
        title: `Modifier la durée${action.stopName ? ` de « ${action.stopName} »` : ""}`,
        details: [
          `Nouvelle durée : ${action.durationMinutes} min`,
          action.previousDurationMinutes != null
            ? `Durée actuelle : ${action.previousDurationMinutes} min`
            : "Durée actuelle non précisée",
          action.estimatedImpact ?? "Recalcul horaire après confirmation",
        ],
        applicable: true,
        needsLocationConfirmation: false,
      };
    case "update_departure_time":
      return {
        title: "Modifier l’heure de départ",
        details: [
          `Nouveau départ : ${action.departureDate}`,
          action.previousDepartureDate
            ? `Départ actuel : ${action.previousDepartureDate}`
            : "Départ actuel non précisé",
          action.estimatedImpact ??
            "Recalcul de l’itinéraire après confirmation",
        ],
        applicable: true,
        needsLocationConfirmation: false,
      };
    case "create_detour":
    case "other":
      return {
        title: action.title,
        details: [
          action.description ?? "Proposition informative",
          "Disponible dans une phase ultérieure",
        ],
        applicable: false,
        needsLocationConfirmation: false,
      };
  }
}
