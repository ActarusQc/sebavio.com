import { describe, expect, it } from "vitest";
import {
  detectMissingFields,
  emptyTripDraft,
  formatDateRangeFr,
  rejectForeignVehicleId,
  resolveCreateIdempotency,
  sanitizeAndMergeDraft,
  tripDraftSchema,
  tripPlanningAiResponseSchema,
  validatePlanningDates,
} from "@/features/ai-trip-planner";
import { detectMissingScalarFields } from "@/features/ai-trip-planner/lib/missing-fields";
import {
  buildControlsForStep,
  filterAiQuickRepliesForStep,
} from "@/features/ai-trip-planner/lib/controls-for-step";
import {
  hasItineraryProposal,
  resolveCurrentStep,
} from "@/features/ai-trip-planner/lib/planning-step";
import { AppError } from "@/lib/errors";
import { MockAiProvider } from "@/services/ai/mock-provider";

describe("detectMissingFields", () => {
  it("signale tous les champs requis sur un brouillon vide", () => {
    const missing = detectMissingFields(emptyTripDraft());
    expect(missing).toEqual(
      expect.arrayContaining([
        "origin",
        "destination",
        "departureDate",
        "returnDate",
        "travelers",
        "vehicleId",
      ]),
    );
  });

  it("accepte durationDays à la place de returnDate", () => {
    const draft = tripDraftSchema.parse({
      ...emptyTripDraft(),
      origin: {
        name: "Bromont",
        placeId: null,
        latitude: null,
        longitude: null,
      },
      destination: {
        name: "Gaspésie",
        placeId: null,
        latitude: null,
        longitude: null,
      },
      departureDate: "2026-08-12",
      durationDays: 5,
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
    });
    expect(detectMissingScalarFields(draft)).toEqual([]);
    expect(detectMissingFields(draft)).toContain("itineraryProposal");
  });
});

describe("machine d’états planification", () => {
  it("ne propose pas de véhicules à l’étape dates", () => {
    const draft = tripDraftSchema.parse({
      ...emptyTripDraft(),
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Percé", city: "Percé" },
      destinationMode: "known",
      departureDate: null,
      adults: 2,
    });
    const step = resolveCurrentStep(draft, { hasTripTypeHint: true });
    expect(step).toBe("dates");
    const controls = buildControlsForStep({
      step,
      draft,
      ownedVehicles: [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          label: "Hyundai Elantra GT (2017)",
        },
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          label: "Acura ILX (2017)",
        },
      ],
      homeCity: null,
      hasHome: false,
      originSuggestions: [],
      hasProposal: false,
    });
    expect(controls.quickReplies.join(" ")).not.toMatch(
      /Hyundai|Acura|Bouboule/i,
    );
    expect(controls.quickReplies.join(" ")).toMatch(/week-end|jours|journée/i);
  });

  it("filtre les quick replies véhicules hors étape vehicle", () => {
    const filtered = filterAiQuickRepliesForStep(
      "dates",
      ["Hyundai Elantra GT (2017)", "Ce week-end", "Je déciderai plus tard"],
      ["Hyundai Elantra GT (2017)", "Acura ILX (2017)"],
    );
    expect(filtered).toEqual(["Ce week-end"]);
  });

  it("refuse la confirmation sans proposition concrète", () => {
    const draft = tripDraftSchema.parse({
      ...emptyTripDraft(),
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Percé", city: "Percé" },
      departureDate: "2026-08-12",
      durationDays: 1,
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      estimatedDistanceKm: 700,
      estimatedDurationMinutes: 480,
    });
    expect(hasItineraryProposal(draft)).toBe(false);
    const controls = buildControlsForStep({
      step: "confirmation",
      draft,
      ownedVehicles: [],
      homeCity: null,
      hasHome: false,
      originSuggestions: [],
      hasProposal: false,
    });
    expect(controls.quickReplies).not.toContain("Confirmer cet itinéraire");
  });
});

describe("validatePlanningDates / formatDateRangeFr", () => {
  it("refuse un retour avant le départ", () => {
    expect(() =>
      validatePlanningDates({
        departureDate: "2026-08-16",
        returnDate: "2026-08-12",
        durationDays: null,
      }),
    ).toThrow(AppError);
  });

  it("formate une plage en français", () => {
    const label = formatDateRangeFr("2026-08-12", "2026-08-16");
    expect(label).toMatch(/12/);
    expect(label).toMatch(/16/);
    expect(label?.toLowerCase()).toMatch(/août|aout/);
  });
});

describe("sanitizeAndMergeDraft", () => {
  const ownedVehicle = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const foreignVehicle = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  it("rejette un vehicleId étranger proposé par l’IA", () => {
    const previous = emptyTripDraft();
    const merged = sanitizeAndMergeDraft({
      previous,
      incoming: {
        ...emptyTripDraft(),
        origin: {
          name: "Bromont",
          placeId: "ChIJfake",
          latitude: 45.3,
          longitude: -72.6,
        },
        vehicleId: foreignVehicle,
      },
      ownedVehicles: [{ id: ownedVehicle, label: "Hyundai" }],
      ownedGroups: [],
    });

    expect(merged.vehicleId).toBeNull();
    expect(merged.origin.placeId).toBeNull();
    expect(merged.origin.name).toBe("Bromont");
    expect(
      rejectForeignVehicleId(foreignVehicle, new Set([ownedVehicle])),
    ).toBeNull();
    expect(rejectForeignVehicleId(ownedVehicle, new Set([ownedVehicle]))).toBe(
      ownedVehicle,
    );
  });

  it("conserve un vehicleId déjà validé et merge les champs", () => {
    const previous = tripDraftSchema.parse({
      ...emptyTripDraft(),
      vehicleId: ownedVehicle,
      origin: {
        name: "Bromont",
        placeId: null,
        latitude: 45.3,
        longitude: -72.6,
      },
    });
    const merged = sanitizeAndMergeDraft({
      previous,
      incoming: {
        ...emptyTripDraft(),
        destination: {
          name: "Gaspésie",
          placeId: "ChIJother",
          latitude: null,
          longitude: null,
        },
        vehicleId: null,
      },
      ownedVehicles: [{ id: ownedVehicle, label: "Hyundai" }],
      ownedGroups: [],
    });

    expect(merged.vehicleId).toBe(ownedVehicle);
    expect(merged.origin.name).toBe("Bromont");
    expect(merged.destination.name).toBe("Gaspésie");
    expect(merged.destination.placeId).toBeNull();
  });
});

describe("idempotence création", () => {
  it("renvoie le voyage existant si createdTripId est déjà posé", () => {
    const result = resolveCreateIdempotency({
      existingTripId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      status: "created",
    });
    expect(result).toEqual({
      tripId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      alreadyCreated: true,
    });
  });

  it("ne bloque pas une session active sans voyage", () => {
    expect(
      resolveCreateIdempotency({
        existingTripId: null,
        status: "ready_for_confirmation",
      }),
    ).toBeNull();
  });
});

describe("schéma réponse IA", () => {
  it("valide une réponse mock cohérente", async () => {
    const provider = new MockAiProvider();
    const result = await provider.generateRawJsonResponse({
      systemPrompt: "sys",
      userPayload: "Départ Bromont vers Gaspésie en famille du 12 au 16 août",
      model: "mock",
      timeoutMs: 1000,
    });
    const parsed = tripPlanningAiResponseSchema.parse(
      JSON.parse(result.rawText),
    );
    expect(parsed.assistantMessage.length).toBeGreaterThan(5);
    expect(parsed.tripDraftPatch ?? parsed.tripDraft).toBeTruthy();
  });
});
