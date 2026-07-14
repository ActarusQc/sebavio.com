import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  campgroundCreateSchema,
  campgroundSearchSchema,
} from "@/features/campings/schemas";
import { CAMPGROUND_STOP_DISTANCE_WARN_KM } from "@/features/campings/constants";
import { haversineKm } from "@/lib/geo";

const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const campgroundId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const tripId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const findFirstCampground = vi.fn();
const findManyStops = vi.fn();
const campgroundUpdate = vi.fn();
const writeAuditLog = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    campground: {
      findFirst: (...args: unknown[]) => findFirstCampground(...args),
      update: (...args: unknown[]) => campgroundUpdate(...args),
    },
    tripStop: {
      findMany: (...args: unknown[]) => findManyStops(...args),
    },
  },
}));

vi.mock("@/features/auth/services/audit", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
}));

describe("campings schemas", () => {
  it("accepte une recherche lat/lng", () => {
    const parsed = campgroundSearchSchema.parse({
      latitude: "46.8",
      longitude: "-71.2",
      radiusKm: "40",
    });
    expect(parsed.latitude).toBe(46.8);
    expect(parsed.radiusKm).toBe(40);
  });

  it("refuse une latitude hors plage", () => {
    expect(
      campgroundSearchSchema.safeParse({
        latitude: 120,
        longitude: -71,
      }).success,
    ).toBe(false);
  });

  it("accepte un camping valide", () => {
    const parsed = campgroundCreateSchema.parse({
      name: "Camping Démo Test",
      latitude: 46.8,
      longitude: -71.2,
      petFriendly: true,
    });
    expect(parsed.countryCode).toBe("CA");
    expect(parsed.campgroundType).toBe("campground");
  });
});

describe("distance étape ↔ camping", () => {
  it("calcule un avertissement au-delà du seuil", () => {
    const km = haversineKm(46.8139, -71.208, 48.8302, -64.4818);
    expect(km).toBeGreaterThan(CAMPGROUND_STOP_DISTANCE_WARN_KM);
    expect(Math.round(km)).toBeGreaterThan(400);
  });

  it("reste sous le seuil pour deux points proches", () => {
    const km = haversineKm(46.8139, -71.208, 46.82, -71.21);
    expect(km).toBeLessThan(CAMPGROUND_STOP_DISTANCE_WARN_KM);
  });
});

describe("deleteCampground", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstCampground.mockResolvedValue({
      id: campgroundId,
      name: "Camping Démo du Fjord",
      deletedAt: null,
    });
  });

  it("refuse la suppression si voyages actifs (planned/in_progress)", async () => {
    findManyStops.mockResolvedValue([
      { trip: { id: tripId, title: "Roadtrip Gaspésie" } },
    ]);

    const { deleteCampground } =
      await import("@/features/campings/services/campgrounds");

    await expect(deleteCampground(campgroundId, adminId)).rejects.toMatchObject(
      {
        code: "CAMP_003",
        status: 409,
      },
    );
    expect(campgroundUpdate).not.toHaveBeenCalled();
  });

  it("autorise le soft-delete si seulement completed/cancelled", async () => {
    findManyStops.mockResolvedValue([]);
    campgroundUpdate.mockResolvedValue({
      id: campgroundId,
      deletedAt: new Date(),
    });

    const { deleteCampground } =
      await import("@/features/campings/services/campgrounds");

    await deleteCampground(campgroundId, adminId);
    expect(campgroundUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: campgroundId },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
    expect(writeAuditLog).toHaveBeenCalled();
  });
});
