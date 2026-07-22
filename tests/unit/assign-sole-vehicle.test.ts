import { describe, expect, it } from "vitest";
import { assignSoleVehicleIfNeeded } from "@/features/ai-trip-planner/lib/assign-sole-vehicle";
import { resolveCurrentStep } from "@/features/ai-trip-planner/lib/planning-step";
import { tripDraftSchema } from "@/features/ai-trip-planner/schemas/draft";

describe("assignSoleVehicleIfNeeded", () => {
  it("assigne automatiquement le seul véhicule du profil", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Magog", city: "Magog" },
      destinationMode: "known",
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      adults: 2,
    });
    const next = assignSoleVehicleIfNeeded(draft, [
      {
        id: "11111111-1111-4111-8111-111111111111",
        label: "Hyundai Elantra",
      },
    ]);
    expect(next.vehicleId).toBe("11111111-1111-4111-8111-111111111111");
    expect(next.vehicleLabel).toBe("Hyundai Elantra");
    expect(resolveCurrentStep(next, { hasTripTypeHint: true })).not.toBe(
      "vehicle",
    );
  });

  it("ne choisit pas si plusieurs véhicules", () => {
    const draft = tripDraftSchema.parse({});
    const next = assignSoleVehicleIfNeeded(draft, [
      { id: "11111111-1111-4111-8111-111111111111", label: "A" },
      { id: "22222222-2222-4222-8222-222222222222", label: "B" },
    ]);
    expect(next.vehicleId).toBeNull();
  });
});
