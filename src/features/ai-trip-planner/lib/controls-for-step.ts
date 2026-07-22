import {
  DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS,
  HOME_QUICK_OTHER,
  HOME_QUICK_RECENT,
  HOME_QUICK_YES,
  INITIAL_QUICK_REPLIES,
} from "@/features/ai-trip-planner/constants";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import type { PlannerStep } from "@/features/ai-trip-planner/lib/planning-step";
import {
  ANY_INTEREST_LABEL,
  CONTINUE_INTERESTS_LABEL,
  INTEREST_CHOICES,
  NONE_INTEREST_LABEL,
} from "@/features/ai-trip-planner/lib/travel-interests";
import { destinationQuickReplies } from "@/features/ai-trip-planner/lib/destination-suggestions";
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

export const ACCOMMODATION_NEED_YES = "Oui, proposez-moi un hébergement";
export const ACCOMMODATION_NEED_BOOKED = "Non, j’ai déjà un hébergement";
export const ACCOMMODATION_NEED_LATER = "Non, je m’en occuperai plus tard";
export const ACCOMMODATION_NEED_HOME = "Je retourne à la maison chaque soir";

export const ACCOMMODATION_TYPE_CHOICES = [
  "Gîte ou couette et café",
  "Auberge",
  "Hôtel",
  "Motel",
  "Location de vacances",
  "Camping",
  "Peu importe",
] as const;

export { CONFIRM_YES, CONFIRM_EDIT, GENERATE_ITINERARY };
export { CONTINUE_INTERESTS_LABEL, ANY_INTEREST_LABEL, NONE_INTEREST_LABEL };

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
          "Moins d’1 h à l’aller",
          "Environ 2 h à l’aller",
          "Environ 3 h à l’aller",
          "Environ 4 h à l’aller",
          "Moins de 200 km à l’aller",
          "Moins de 400 km à l’aller",
        ],
        requestedInput: {
          type: "number",
          field: "other",
          placeholder: "Ex. 2 heures à l’aller ou 300 km",
          countryBias: "CA",
          regionBias: "QC",
        },
        forceAssistantMessage:
          "Quelle durée ou distance maximale souhaitez-vous pour le trajet d’aller (sens unique, pas l’aller-retour)? Par exemple, « Environ 2 h à l’aller » signifie environ 2 heures de route pour rejoindre la destination.",
      };

    case "destination":
      return {
        quickReplies:
          draft.destinationMode === "suggest"
            ? destinationQuickReplies({
                originLatitude: draft.origin.latitude,
                originLongitude: draft.origin.longitude,
                maxDriveMinutes: draft.maxDriveMinutes,
                maxDistanceKm: draft.maxDistanceKm,
              })
            : ["Saisir une adresse", "Gaspésie", "Charlevoix"],
        requestedInput: {
          type: "address",
          field: "destination",
          placeholder: "Entrez une destination",
          countryBias: "CA",
          regionBias: "QC",
        },
        forceAssistantMessage:
          draft.destinationMode === "suggest" &&
          (draft.maxDriveMinutes != null || draft.maxDistanceKm != null)
            ? `Voici des idées situées à environ ${
                draft.maxDriveMinutes != null
                  ? `${Math.round(draft.maxDriveMinutes / 60)} h`
                  : `${draft.maxDistanceKm} km`
              } ou moins à l’aller depuis votre départ. Choisissez-en une ou saisissez une autre destination.`
            : undefined,
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
        quickReplies: [],
        requestedInput: {
          type: "multi_choice",
          field: "interests",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
          minimumSelections: 1,
          maximumSelections: null,
          choices: INTEREST_CHOICES.map((c) => ({
            id: c.id,
            label: c.label,
          })),
        },
        forceAssistantMessage:
          "Quels types d’expériences souhaitez-vous inclure? Vous pouvez choisir plusieurs réponses.",
      };

    case "accommodation_need":
      return {
        quickReplies: [
          ACCOMMODATION_NEED_YES,
          ACCOMMODATION_NEED_BOOKED,
          ACCOMMODATION_NEED_LATER,
          ACCOMMODATION_NEED_HOME,
        ],
        requestedInput: {
          type: "choice",
          field: "other",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
        },
        forceAssistantMessage:
          "Voici une proposition d’itinéraire. Souhaitez-vous que Sebavio vous propose un hébergement pour la nuit?",
      };

    case "accommodation_type":
      return {
        quickReplies: [...ACCOMMODATION_TYPE_CHOICES],
        requestedInput: {
          type: "choice",
          field: "lodging",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
        },
        forceAssistantMessage: "Quel type d’hébergement préférez-vous?",
      };

    case "lodging": {
      const optionLabels = draft.lodgingOptions
        .slice(0, 5)
        .map((o) => o.name.slice(0, 60));
      const typeLabel = draft.lodgingType ?? "hébergement";
      return {
        quickReplies:
          optionLabels.length > 0
            ? [...optionLabels, "Voir d’autres options", "Sans hébergement"]
            : ["Relancer la recherche", "Sans hébergement"],
        requestedInput: {
          type: "choice",
          field: "lodging",
          placeholder: `Choisissez un ${typeLabel.toLowerCase()}`,
          countryBias: "CA",
          regionBias: "QC",
        },
        forceAssistantMessage:
          optionLabels.length > 0
            ? `Voici des établissements correspondant à « ${typeLabel} ». Sélectionnez celui que vous préférez pour l’ajouter à l’itinéraire.`
            : `Je n’ai pas encore trouvé d’établissement pour « ${typeLabel} ». Souhaitez-vous relancer la recherche ou continuer sans hébergement?`,
      };
    }

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
      if (
        (draft.lodgingRequested ||
          draft.accommodationMode === "sebavio_suggestion") &&
        !draft.lodgingSelection?.name
      ) {
        return {
          quickReplies: draft.lodgingOptions
            .slice(0, 4)
            .map((o) => o.name.slice(0, 60)),
          requestedInput: {
            type: "choice",
            field: "lodging",
            placeholder: null,
            countryBias: "CA",
            regionBias: "QC",
          },
          forceAssistantMessage:
            "Avant de confirmer, choisissez un hébergement parmi les options proposées.",
        };
      }
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
  if (
    step === "preferences" ||
    step === "accommodation_need" ||
    step === "accommodation_type" ||
    step === "lodging"
  ) {
    return null;
  }
  const cleaned = aiReplies.filter(
    (r) => !looksLikeVehicle(r) && !looksLikeConfirm(r),
  );
  return cleaned.length > 0 ? cleaned : null;
}
