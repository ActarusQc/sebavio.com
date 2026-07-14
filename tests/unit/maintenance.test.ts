import { describe, expect, it } from "vitest";
import {
  addMonthsUtc,
  calculateNextDue,
  isApproachingDue,
} from "@/features/maintenance/services/schedule-calc";
import {
  documentCreateSchema,
  historyCreateSchema,
  templateCreateSchema,
} from "@/features/maintenance/schemas";

describe("schedule-calc", () => {
  const today = new Date(Date.UTC(2026, 6, 14)); // 2026-07-14

  it("calcule next_due par mois et km", () => {
    const result = calculateNextDue({
      intervalKm: 10000,
      intervalMonths: 12,
      performedDate: new Date(Date.UTC(2025, 6, 14)),
      performedOdometer: 20000,
      currentOdometer: 22000,
      today,
    });
    expect(result.nextDueDate?.toISOString().slice(0, 10)).toBe("2026-07-14");
    expect(result.nextDueOdometer).toBe(30000);
    expect(result.status).toBe("upcoming");
  });

  it("marque overdue par date", () => {
    const result = calculateNextDue({
      intervalKm: null,
      intervalMonths: 6,
      performedDate: new Date(Date.UTC(2025, 0, 1)),
      performedOdometer: 1000,
      currentOdometer: 2000,
      today,
    });
    expect(result.status).toBe("overdue");
  });

  it("marque overdue par kilométrage", () => {
    const result = calculateNextDue({
      intervalKm: 5000,
      intervalMonths: null,
      performedDate: today,
      performedOdometer: 10000,
      currentOdometer: 16000,
      today,
    });
    expect(result.nextDueOdometer).toBe(15000);
    expect(result.status).toBe("overdue");
  });

  it("addMonthsUtc gère la fin de mois", () => {
    const d = addMonthsUtc(new Date(Date.UTC(2026, 0, 31)), 1);
    expect(d.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("détecte l’approche 14 j / 500 km", () => {
    expect(
      isApproachingDue({
        nextDueDate: new Date(Date.UTC(2026, 6, 20)),
        nextDueOdometer: null,
        currentOdometer: 0,
        today,
      }),
    ).toBe(true);

    expect(
      isApproachingDue({
        nextDueDate: new Date(Date.UTC(2026, 8, 1)),
        nextDueOdometer: 10500,
        currentOdometer: 10050,
        today,
      }),
    ).toBe(true);

    expect(
      isApproachingDue({
        nextDueDate: new Date(Date.UTC(2026, 11, 1)),
        nextDueOdometer: 20000,
        currentOdometer: 10000,
        today,
      }),
    ).toBe(false);
  });
});

describe("maintenance schemas", () => {
  it("accepte un historique valide", () => {
    const parsed = historyCreateSchema.parse({
      vehicleId: "11111111-1111-4111-8111-111111111111",
      performedDate: "2026-07-01",
      performedOdometer: 12000,
      cost: 99.5,
    });
    expect(parsed.performedOdometer).toBe(12000);
  });

  it("exige un intervalle sur le gabarit", () => {
    const result = templateCreateSchema.safeParse({
      modelId: "11111111-1111-4111-8111-111111111111",
      title: "Huile",
      category: "Moteur",
    });
    expect(result.success).toBe(false);
  });

  it("valide l’URL document", () => {
    expect(() =>
      documentCreateSchema.parse({
        documentType: "Invoice",
        fileUrl: "not-a-url",
      }),
    ).toThrow();
  });
});
