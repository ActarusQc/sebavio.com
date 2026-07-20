import type { ProposedTripAction } from "@/features/ai/schemas/actions";

export function describeProposedAction(action: ProposedTripAction): {
  title: string;
  details: string[];
  applicable: boolean;
} {
  switch (action.type) {
    case "add_activity":
      return {
        title: `Ajouter l’activité « ${action.title} »`,
        details: [
          `Durée estimée : ${action.durationMinutes} min`,
          `Trajet : ${action.direction ?? "outbound"}`,
          action.estimatedImpact ?? "Impact à confirmer après recalcul",
          action.activityId
            ? "Activité catalogue Sebavio"
            : "Création d’une étape activité (à confirmer)",
        ],
        applicable: true,
      };
    case "add_pause":
      return {
        title: `Ajouter la pause « ${action.title} »`,
        details: [
          `Durée : ${action.durationMinutes} min`,
          `Trajet : ${action.direction ?? "outbound"}`,
          action.estimatedImpact ?? "Impact à confirmer après recalcul",
        ],
        applicable: true,
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
      };
  }
}
