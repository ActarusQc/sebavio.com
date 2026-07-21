import { describe, expect, it } from "vitest";
import {
  vehicleCreateSchema,
  vehicleUpdateSchema,
  odometerUpdateSchema,
  vehiclePhotoCreateSchema,
  vehicleDocumentCreateSchema,
} from "@/features/vehicles/schemas";
import { VIN_REGEX } from "@/features/vehicles/constants";
import {
  clampPageSize,
  buildDisplayName,
} from "@/features/vehicles/services/mappers";

const validVin = "1HGCM82633A004352";
const modelId = "11111111-1111-4111-8111-111111111111";

describe("VIN_REGEX", () => {
  it("accepte un VIN ISO valide", () => {
    expect(VIN_REGEX.test(validVin)).toBe(true);
  });

  it("refuse I/O/Q et longueur incorrecte", () => {
    expect(VIN_REGEX.test("1HGCM82633A00435I")).toBe(false);
    expect(VIN_REGEX.test("SHORT")).toBe(false);
  });
});

describe("vehicleCreateSchema", () => {
  it("accepte une création catalogue", () => {
    const result = vehicleCreateSchema.safeParse({
      modelId,
      isManualEntry: false,
      currentOdometer: 12000,
      nickname: "Mon VR",
      vin: validVin.toLowerCase(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vin).toBe(validVin);
    }
  });

  it("accepte une création manuelle", () => {
    const result = vehicleCreateSchema.safeParse({
      modelId: null,
      isManualEntry: true,
      manualManufacturerName: "Winnebago",
      manualModelName: "View",
      manualYear: 2020,
      officialCombinedConsumptionL100: 12.5,
      fuelType: "diesel",
      currentOdometer: 0,
    });
    expect(result.success).toBe(true);
  });

  it("refuse manuel sans marque/modèle/année", () => {
    expect(
      vehicleCreateSchema.safeParse({
        modelId: null,
        isManualEntry: true,
        currentOdometer: 10,
      }).success,
    ).toBe(false);
  });

  it("refuse catalogue + isManualEntry true", () => {
    expect(
      vehicleCreateSchema.safeParse({
        modelId,
        isManualEntry: true,
        currentOdometer: 10,
      }).success,
    ).toBe(false);
  });

  it("refuse un VIN invalide", () => {
    expect(
      vehicleCreateSchema.safeParse({
        modelId,
        currentOdometer: 10,
        vin: "INVALID",
      }).success,
    ).toBe(false);
  });
});

describe("vehicleUpdateSchema", () => {
  it("accepte un lien catalogue (modelId)", () => {
    const result = vehicleUpdateSchema.safeParse({
      modelId,
      isManualEntry: false,
      nickname: "Lié",
    });
    expect(result.success).toBe(true);
  });

  it("exige les champs manuels si modelId null", () => {
    expect(
      vehicleUpdateSchema.safeParse({
        modelId: null,
        isManualEntry: true,
      }).success,
    ).toBe(false);

    expect(
      vehicleUpdateSchema.safeParse({
        modelId: null,
        isManualEntry: true,
        manualManufacturerName: "A",
        manualModelName: "B",
        manualYear: 2019,
      }).success,
    ).toBe(true);
  });
});

describe("odometerUpdateSchema", () => {
  it("refuse un kilométrage négatif", () => {
    expect(
      odometerUpdateSchema.safeParse({ currentOdometer: -1 }).success,
    ).toBe(false);
  });
});

describe("vehiclePhotoCreateSchema / document", () => {
  it("exige une URL photo valide", () => {
    expect(
      vehiclePhotoCreateSchema.safeParse({
        photoUrl: "not-a-url",
      }).success,
    ).toBe(false);
    expect(
      vehiclePhotoCreateSchema.safeParse({
        photoUrl: "https://cdn.example.com/a.jpg",
      }).success,
    ).toBe(true);
  });

  it("valide un document utilisateur (champs optionnels)", () => {
    expect(
      vehicleDocumentCreateSchema.safeParse({
        type: "Assurance",
        title: "Assurance 2026",
      }).success,
    ).toBe(true);
    expect(
      vehicleDocumentCreateSchema.safeParse({
        type: "",
        title: "",
      }).success,
    ).toBe(true);
  });
});

describe("mappers helpers", () => {
  it("clampPageSize", () => {
    expect(clampPageSize(500, 100)).toBe(100);
    expect(clampPageSize(0, 100)).toBe(1);
  });

  it("buildDisplayName privilégie le surnom", () => {
    expect(
      buildDisplayName({
        nickname: "Mon VR",
        isManualEntry: true,
        manualManufacturerName: "A",
        manualModelName: "B",
        manualYear: 2020,
        model: null,
      }),
    ).toBe("Mon VR");
  });

  it("buildDisplayName utilise le catalogue NRCan", () => {
    expect(
      buildDisplayName({
        nickname: null,
        isManualEntry: false,
        manualManufacturerName: null,
        manualModelName: null,
        manualYear: null,
        model: null,
        catalogEntry: {
          make: "Acura",
          model: "ILX",
          modelYear: 2017,
        },
      }),
    ).toBe("Acura ILX (2017)");
  });
});
