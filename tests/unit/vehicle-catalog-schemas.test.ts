import { describe, expect, it } from "vitest";
import {
  manufacturerCreateSchema,
  modelsSearchSchema,
  vehicleModelCreateSchema,
  importPayloadSchema,
  importModelLineSchema,
} from "@/features/vehicle-catalog/schemas";
import {
  DEFAULT_PAGE_SIZE,
  IMPORT_MAX_LINES,
  MAX_PAGE_SIZE,
} from "@/features/vehicle-catalog/constants";
import { clampPageSize } from "@/features/vehicle-catalog/services/mappers";

describe("modelsSearchSchema pagination", () => {
  it("applique le pageSize par défaut", () => {
    const result = modelsSearchSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it("plafonne pageSize à MAX_PAGE_SIZE", () => {
    const result = modelsSearchSchema.parse({ pageSize: "9999" });
    expect(result.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it("refuse une année hors plage via CAT path (Zod fail)", () => {
    expect(modelsSearchSchema.safeParse({ year: "1800" }).success).toBe(false);
  });
});

describe("clampPageSize", () => {
  it("ne dépasse jamais le maximum", () => {
    expect(clampPageSize(500, 100)).toBe(100);
    expect(clampPageSize(0, 100)).toBe(1);
  });
});

describe("manufacturerCreateSchema", () => {
  it("accepte un constructeur valide", () => {
    const result = manufacturerCreateSchema.safeParse({
      name: "Ford",
      countryCode: "us",
      active: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryCode).toBe("US");
    }
  });

  it("refuse un nom vide", () => {
    expect(manufacturerCreateSchema.safeParse({ name: "" }).success).toBe(
      false,
    );
  });
});

describe("vehicleModelCreateSchema", () => {
  it("accepte un modèle minimal", () => {
    const result = vehicleModelCreateSchema.safeParse({
      manufacturerId: "11111111-1111-4111-8111-111111111111",
      category: "ClassC",
      modelName: "View",
      year: 2024,
    });
    expect(result.success).toBe(true);
  });

  it("refuse une catégorie inconnue", () => {
    expect(
      vehicleModelCreateSchema.safeParse({
        manufacturerId: "11111111-1111-4111-8111-111111111111",
        category: "Boat",
        modelName: "X",
        year: 2024,
      }).success,
    ).toBe(false);
  });
});

describe("import schemas", () => {
  it("limite le nombre de lignes manufacturers", () => {
    const tooMany = Array.from({ length: IMPORT_MAX_LINES + 1 }, () => ({}));
    expect(
      importPayloadSchema.safeParse({ manufacturers: tooMany }).success,
    ).toBe(false);
  });

  it("valide une ligne modèle d'import", () => {
    const result = importModelLineSchema.safeParse({
      manufacturerName: "Ford",
      category: "Car",
      modelName: "F-150",
      trim: "XLT",
      year: 2024,
      fuelType: "Gasoline",
    });
    expect(result.success).toBe(true);
  });

  it("rejette une ligne modèle sans constructeur", () => {
    expect(
      importModelLineSchema.safeParse({
        category: "Car",
        modelName: "F-150",
        year: 2024,
      }).success,
    ).toBe(false);
  });
});
