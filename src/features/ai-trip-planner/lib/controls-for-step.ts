import {
  DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS,
  HOME_QUICK_OTHER,
  HOME_QUICK_RECENT,
  HOME_QUICK_YES,
  INITIAL_QUICK_REPLIES,
} from "@/features/ai-trip-planner/constants";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import type { PlannerStep } from "@/features/ai-trip-planner/lib/planning-step";
import type {
  OriginSuggestionDto,
  RequestedInputDto,
} from "@/features/ai-trip-planner/types";

export type StepControls = {
  quickReplies: string[];
  requestedInput: RequestedInputDto;
  /** Message serveur si l’IA est hors étape (confirmation vide, etc.). */
  forceAssistantMessage?: string;
};

const CONFIRM_YES = "Confirmer cet itinéraire";
const CONFIRM_EDIT = "Modifier des détails";
const GENERATE_ITINERARY = "Proposer un itinéraire";

export { CONFIRM_YES, CONFIRM_EDIT, GENERATE_ITINERARY };

export function buildControlsForStep(input: {
  step: PlannerStep;
  draft: TripDraftParsed;
  ownedVehicles: Array<{ id: string; label: string }>;
  homeCity: string | null;
  hasHome: boolean;
  originSuggestions: OriginSuggestionDto[];
  hasProposal: boolean;
}): StepControls {
  const { step, draft, ownedVehicles, homeCity, hasHome, hasProposal } = input;

  switch (step) {
    case "trip_type":
      return {
        quickReplies: [...INITIAL_QUICK_REPLIES],
        requestedInput: {
          type: "choice",
          field: "other",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
        },
      };

    case "origin":
      if (hasHome && homeCity) {
        return {
          quickReplies: [HOME_QUICK_YES, HOME_QUICK_OTHER, HOME_QUICK_RECENT],
          requestedInput: {
            type: "choice",
            field: "origin",
            placeholder: null,
            countryBias: "CA",
            regionBias: "QC",
          },
          forceAssistantMessage: `Souhaitez-vous partir de votre domicile à ${homeCity}?`,
        };
      }
      return {
        quickReplies: [
          ...DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS.slice(0, 6),
          "Saisir une adresse",
        ],
        requestedInput: {
          type: "address",
          field: "origin",
          placeholder: "Entrez une adresse ou une ville",
          countryBias: "CA",
          regionBias: "QC",
        },
        forceAssistantMessage:
          "D’où souhaitez-vous partir? Vous pouvez saisir une adresse complète ou choisir une ville.",
      };

    case "destination_mode":
      return {
        quickReplies: [
          "J’ai déjà une destination",
          "Je cherche des idées",
          "Gaspésie",
          "Charlevoix",
          "Cantons-de-l’Est",
        ],
        requestedInput: {
          type: "choice",
          field: "destination",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
        },
        forceAssistantMessage:
          "Avez-vous déjà une destination, ou souhaitez-vous des idées selon une distance ou durée de trajet maximale?",
      };

    case "destination_radius":
      return {
        quickReplies: [
          "Moins d’1 h",
          "Environ 2 h",
          "Environ 3 h",
          "Environ 4 h",
          "Moins de 200 km",
          "Moins de 400 km",
        ],
        requestedInput: {
          type: "number",
          field: "other",
          placeholder: "Ex. 2 heures ou 300 km",
          countryBias: "CA",
          regionBias: "QC",
        },
        forceAssistantMessage:
          "Quelle distance ou durée maximale de trajet souhaitez-vous pour ce départ?",
      };

    case "destination":
      return {
        quickReplies:
          draft.destinationMode === "suggest"
            ? ["Percé", "Québec", "Tremblant", "Autre destination"]
            : ["Saisir une adresse", "Gaspésie", "Charlevoix"],
        requestedInput: {
          type: "address",
          field: "destination",
          placeholder: "Entrez une destination",
          countryBias: "CA",
          regionBias: "QC",
        },
      };

    case "dates":
      return {
        quickReplies: [
          "Ce week-end",
          "La fin de semaine prochaine",
          "3 jours",
          "5 jours",
          "Une journée seulement",
        ],
        requestedInput: {
          type: "date",
          field: "departureDate",
          placeholder: "Ex. samedi 26 juillet",
          countryBias: "CA",
          regionBias: "QC",
        },
      };

    case "travelers":
      return {
        quickReplies: [
          "1 personne",
          "2 personnes",
          "3 personnes",
          "4 personnes",
        ],
        requestedInput: {
          type: "number",
          field: "travelers",
          placeholder: "Nombre de voyageurs",
          countryBias: "CA",
          regionBias: "QC",
        },
      };

    case "vehicle": {
      const labels = ownedVehicles.slice(0, 4).map((v) => v.label);
      return {
        quickReplies:
          labels.length > 0
            ? [...labels, "Je déciderai plus tard"]
            : ["Je déciderai plus tard"],
        requestedInput: {
          type: "vehicle",
          field: "vehicleId",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
        },
      };
    }

    case "preferences":
      return {
        quickReplies: [
          "Nature et plein air",
          "Culture et villages",
          "Gastronomie",
          "Budget modéré",
          "Passer à l’itinéraire",
        ],
        requestedInput: {
          type: "choice",
          field: "other",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
        },
      };

    case "itinerary_proposal":
      return {
        quickReplies: [
          GENERATE_ITINERARY,
          "Ajouter des activités",
          "Modifier la destination",
        ],
        requestedInput: {
          type: "choice",
          field: "other",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
        },
        forceAssistantMessage:
          "Je vais préparer une proposition d’itinéraire concrète (trajet, arrêts et activités). Souhaitez-vous que je la génère maintenant?",
      };

    case "confirmation":
      if (!hasProposal) {
        return {
          quickReplies: [GENERATE_ITINERARY],
          requestedInput: {
            type: "choice",
            field: "other",
            placeholder: null,
            countryBias: "CA",
            regionBias: "QC",
          },
          forceAssistantMessage:
            "Je n’ai pas encore de proposition d’itinéraire complète à vous montrer. Générons-en une avant de confirmer.",
        };
      }
      return {
        quickReplies: [CONFIRM_YES, CONFIRM_EDIT],
        requestedInput: {
          type: "choice",
          field: "other",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
        },
      };

    default:
      return {
        quickReplies: [],
        requestedInput: null,
      };
  }
}

/** Filtre les quick replies IA : n’accepte que celles cohérentes avec l’étape. */
export function filterAiQuickRepliesForStep(
  step: PlannerStep,
  aiReplies: string[],
  ownedVehicleLabels: string[],
): string[] | null {
  if (aiReplies.length === 0) return null;

  const lowerVehicles = new Set(ownedVehicleLabels.map((l) => l.toLowerCase()));
  const looksLikeVehicle = (r: string) =>
    lowerVehicles.has(r.toLowerCase()) ||
    /déciderai plus tard|elantra|acura|hyundai|toyota|bouboule/i.test(r);

  const looksLikeConfirm = (r: string) =>
    /confirmer cet itin[eé]raire|modifier des d[eé]tails/i.test(r);

  if (step === "vehicle") {
    return aiReplies.filter(looksLikeVehicle);
  }
  if (step === "confirmation") {
    return aiReplies.filter(looksLikeConfirm);
  }
  // Sur les autres étapes : rejeter véhicules et confirmation
  const cleaned = aiReplies.filter(
    (r) => !looksLikeVehicle(r) && !looksLikeConfirm(r),
  );
  return cleaned.length > 0 ? cleaned : null;
}
