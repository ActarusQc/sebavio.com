import { describe, expect, it } from "vitest";
import {
  addMoney,
  budgetVariance,
  moneyToString,
  subtractMoney,
  toMoney,
} from "@/features/finance/lib/money";
import {
  isExpenseDateOutsideTripPeriod,
  toDateKey,
} from "@/features/finance/lib/dates";
import {
  budgetUpsertSchema,
  expenseCreateSchema,
} from "@/features/finance/schemas";

describe("finance/money", () => {
  it("arrondit HALF_UP à 2 décimales", () => {
    expect(moneyToString("10.005")).toBe("10.01");
    expect(moneyToString("10.004")).toBe("10.00");
    expect(moneyToString(87.42)).toBe("87.42");
  });

  it("additionne sans dérive flottante typique", () => {
    const sum = addMoney("0.10", "0.20", "0.30");
    expect(moneyToString(sum)).toBe("0.60");
  });

  it("calcule l'écart budget − réel", () => {
    expect(budgetVariance("500.00", "120.50")).toBe("379.50");
    expect(budgetVariance("100.00", "150.00")).toBe("-50.00");
    expect(budgetVariance(null, "10.00")).toBeNull();
  });

  it("soustrait correctement", () => {
    expect(moneyToString(subtractMoney("100.00", "33.33"))).toBe("66.67");
    expect(toMoney("1").equals(toMoney(1))).toBe(true);
  });
});

describe("finance/dates", () => {
  it("détecte une date hors période voyage", () => {
    const departure = new Date("2026-07-10T15:00:00.000Z");
    const ret = new Date("2026-07-20T12:00:00.000Z");

    expect(
      isExpenseDateOutsideTripPeriod(
        new Date("2026-07-05T00:00:00.000Z"),
        departure,
        ret,
      ),
    ).toBe(true);

    expect(
      isExpenseDateOutsideTripPeriod(
        new Date("2026-07-25T00:00:00.000Z"),
        departure,
        ret,
      ),
    ).toBe(true);

    expect(
      isExpenseDateOutsideTripPeriod(
        new Date("2026-07-15T00:00:00.000Z"),
        departure,
        ret,
      ),
    ).toBe(false);
  });

  it("autorise toute date après départ si pas de retour", () => {
    const departure = new Date("2026-07-10T15:00:00.000Z");
    expect(
      isExpenseDateOutsideTripPeriod(
        new Date("2026-12-01T00:00:00.000Z"),
        departure,
        null,
      ),
    ).toBe(false);
  });

  it("toDateKey extrait YYYY-MM-DD UTC", () => {
    expect(toDateKey(new Date("2026-07-14T23:30:00.000Z"))).toBe("2026-07-14");
  });
});

describe("finance/schemas", () => {
  it("valide une dépense minimale", () => {
    const parsed = expenseCreateSchema.parse({
      tripId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      category: "fuel",
      amount: 87.42,
      expenseDate: "2026-07-14",
    });
    expect(parsed.currency).toBe("CAD");
    expect(parsed.amount).toBe(87.42);
  });

  it("valide un budget", () => {
    const parsed = budgetUpsertSchema.parse({ plannedAmount: 1500 });
    expect(parsed.currency).toBe("CAD");
    expect(parsed.plannedAmount).toBe(1500);
  });
});
