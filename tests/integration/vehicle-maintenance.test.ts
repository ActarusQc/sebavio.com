import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const prisma = {
    userVehicle: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    providerMaintenanceSchedule: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    maintenanceTaskDefinition: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    maintenanceHistory: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    vehicleMaintenanceReminder: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
    vehicleSafetyRecall: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
    },
    maintenanceProviderCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  return { prisma };
});

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    status: "ready",
    connect: vi.fn(),
    incr: vi.fn(async () => 1),
    expire: vi.fn(),
  }),
}));

vi.mock("@/features/notifications/services/create", () => ({
  createInAppNotification: vi.fn(async () => ({ status: "created" })),
}));

vi.mock("@/features/auth/services/audit", () => ({
  writeAuditLog: vi.fn(async () => undefined),
}));

import { prisma } from "@/lib/prisma";
import { decodeVinWithNhtsa } from "@/services/vin-decode";
import {
  setMaintenanceProviderForTests,
  MockMaintenanceProvider,
} from "@/services/maintenance-schedule";
import { syncVehicleMaintenanceSchedule } from "@/services/maintenance-schedule/sync";
import { createProviderMaintenanceEvent } from "@/features/vehicle-maintenance/services/events";
import { AppError } from "@/lib/errors";

const mockedPrisma = prisma as unknown as {
  userVehicle: {
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  providerMaintenanceSchedule: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  maintenanceTaskDefinition: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  maintenanceHistory: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  vehicleMaintenanceReminder: {
    findMany: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  notificationPreference: { findUnique: ReturnType<typeof vi.fn> };
  maintenanceProviderCache: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

describe("intégration entretien (mocks)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMaintenanceProviderForTests(new MockMaintenanceProvider());
    mockedPrisma.maintenanceProviderCache.findUnique.mockResolvedValue(null);
    mockedPrisma.maintenanceProviderCache.upsert.mockResolvedValue({});
    mockedPrisma.notificationPreference.findUnique.mockResolvedValue(null);
    mockedPrisma.maintenanceHistory.findMany.mockResolvedValue([]);
    mockedPrisma.maintenanceHistory.count.mockResolvedValue(0);
    mockedPrisma.vehicleMaintenanceReminder.findMany.mockResolvedValue([]);
    mockedPrisma.vehicleMaintenanceReminder.upsert.mockResolvedValue({});
  });

  it("décode un VIN mocké via NHTSA fetch", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        Results: [
          {
            Make: "TOYOTA",
            Model: "RAV4",
            ModelYear: "2021",
            Manufacturer: "TOYOTA",
            Trim: "XLE",
            VehicleType: "MULTIPURPOSE PASSENGER VEHICLE (MPV)",
            BodyClass:
              "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)",
            DisplacementL: "2.5",
            EngineCylinders: "4",
            FuelTypePrimary: "Gasoline",
            TransmissionStyle: "Automatic",
            DriveType: "AWD",
            PlantCountry: "CANADA",
            ErrorCode: "0",
            ErrorText: "",
          },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const decoded = await decodeVinWithNhtsa("2T3P1RFV5MC123456");
    expect(decoded.make).toBe("TOYOTA");
    expect(decoded.model).toBe("RAV4");
    expect(decoded.year).toBe(2021);
    expect(decoded.isCertain).toBe(true);

    vi.unstubAllGlobals();
  });

  it("synchronise un calendrier mock pour un véhicule possédé", async () => {
    mockedPrisma.userVehicle.findFirst.mockResolvedValue({
      id: "veh-1",
      userId: "user-1",
      vin: null,
      manualManufacturerName: "Toyota",
      manualModelName: "RAV4",
      manualYear: 2021,
      manualTrim: null,
      manufacturerName: null,
      engine: null,
      fuelType: "regular",
      vehicleType: null,
      manualCategory: null,
      usageProfile: "automatic",
      usageFactors: null,
      annualEstimatedKm: 15000,
      currentOdometer: 45000,
      inServiceDate: new Date("2021-01-01"),
      purchaseDate: new Date("2021-01-01"),
      model: null,
    });

    mockedPrisma.providerMaintenanceSchedule.upsert.mockResolvedValue({
      id: "sched-1",
      provider: "mock",
    });
    mockedPrisma.maintenanceTaskDefinition.findMany.mockResolvedValue([]);
    mockedPrisma.maintenanceTaskDefinition.create.mockImplementation(
      async ({ data }: { data: { id?: string } }) => ({
        id: data.id ?? `task-${Math.random()}`,
        ...data,
      }),
    );
    mockedPrisma.providerMaintenanceSchedule.findMany.mockResolvedValue([
      {
        id: "sched-1",
        tasks: [
          {
            id: "task-oil",
            conditionType: "both",
            intervalKm: 8000,
            intervalMonths: 6,
            firstDueKm: 8000,
            firstDueMonths: 6,
            inspectionOnly: false,
            priority: "high",
            title: "Vidange",
          },
        ],
      },
    ]);

    const result = await syncVehicleMaintenanceSchedule("user-1", "veh-1");
    expect(result.provider).toBe("mock");
    expect(result.taskCount).toBeGreaterThan(0);
  });

  it("refuse l’accès à un véhicule d’un autre utilisateur", async () => {
    mockedPrisma.userVehicle.findFirst.mockResolvedValue(null);
    await expect(
      syncVehicleMaintenanceSchedule("user-1", "veh-other"),
    ).rejects.toMatchObject({ code: "VEH_001" });
  });

  it("crée un événement et recalcule", async () => {
    mockedPrisma.userVehicle.findFirst.mockResolvedValue({
      id: "veh-1",
      userId: "user-1",
      currentOdometer: 45000,
      usageProfile: "normal",
      usageFactors: null,
      annualEstimatedKm: null,
      vehicleType: null,
      manualCategory: null,
      inServiceDate: null,
      purchaseDate: null,
    });
    mockedPrisma.maintenanceHistory.create.mockResolvedValue({
      id: "evt-1",
      vehicleId: "veh-1",
    });
    mockedPrisma.userVehicle.update.mockResolvedValue({});
    mockedPrisma.vehicleMaintenanceReminder.updateMany.mockResolvedValue({
      count: 1,
    });
    mockedPrisma.providerMaintenanceSchedule.findMany.mockResolvedValue([]);

    const event = await createProviderMaintenanceEvent("user-1", "veh-1", {
      serviceDate: "2026-07-01",
      odometerKm: 46000,
      status: "completed",
    });
    expect(event.id).toBe("evt-1");
  });

  it("fallback stale si fournisseur indisponible et cache présent", async () => {
    setMaintenanceProviderForTests({
      providerName: "commercial",
      getSchedule: async () => {
        throw new AppError("MNT_008", "down", 502);
      },
    });

    mockedPrisma.maintenanceProviderCache.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 3600_000),
      payload: {
        providerName: "commercial",
        sourceType: "commercial",
        normalConditions: true,
        severeConditions: false,
        tasks: [
          {
            externalId: "oil",
            category: "engine_oil",
            title: "Oil",
            actionType: "replace",
            intervalKm: 8000,
            conditionType: "both",
            priority: "high",
            officialManufacturerRecommendation: false,
            inspectionOnly: false,
          },
        ],
      },
    });

    mockedPrisma.userVehicle.findFirst.mockResolvedValue({
      id: "veh-1",
      userId: "user-1",
      vin: null,
      manualManufacturerName: "Ford",
      manualModelName: "F-150",
      manualYear: 2022,
      manualTrim: null,
      manufacturerName: null,
      engine: null,
      fuelType: null,
      vehicleType: null,
      manualCategory: null,
      usageProfile: "automatic",
      usageFactors: null,
      annualEstimatedKm: null,
      currentOdometer: 10000,
      inServiceDate: null,
      purchaseDate: null,
      model: null,
    });

    mockedPrisma.providerMaintenanceSchedule.upsert.mockResolvedValue({
      id: "sched-2",
      provider: "commercial",
    });
    mockedPrisma.maintenanceTaskDefinition.findMany.mockResolvedValue([]);
    mockedPrisma.maintenanceTaskDefinition.create.mockResolvedValue({
      id: "t1",
    });
    (
      prisma as unknown as {
        providerMaintenanceSchedule: { findMany: ReturnType<typeof vi.fn> };
      }
    ).providerMaintenanceSchedule.findMany = vi.fn().mockResolvedValue([
      {
        id: "sched-2",
        tasks: [
          {
            id: "t1",
            conditionType: "both",
            intervalKm: 8000,
            intervalMonths: 6,
            firstDueKm: 8000,
            firstDueMonths: 6,
            inspectionOnly: false,
            priority: "high",
            title: "Oil",
          },
        ],
      },
    ]);

    const result = await syncVehicleMaintenanceSchedule("user-1", "veh-1", {
      forceRefresh: true,
    });
    expect(result.staleFallback).toBe(true);
  });
});
