import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activityCreateSchema,
  activitySearchSchema,
} from "@/features/activities/schemas";
import { ACTIVITY_STOP_DISTANCE_WARN_KM } from "@/features/activities/constants";
import {
  parseSeasons,
  seasonsOverlap,
} from "@/features/activities/services/mappers";
import { haversineKm } from "@/lib/geo";

const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const activityId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const tripId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const findFirstActivity = vi.fn();
const findManyLinks = vi.fn();
const activityUpdate = vi.fn();
const writeAuditLog = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activity: {
      findFirst: (...args: unknown[]) => findFirstActivity(...args),
      update: (...args: unknown[]) => activityUpdate(...args),
    },
    tripStopActivity: {
      findMany: (...args: unknown[]) => findManyLinks(...args),
    },
  },
}));

vi.mock("@/features/auth/services/audit", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
}));

describe("activities schemas", () => {
  it("accepte une recherche lat/lng + saisons multi", () => {
    const parsed = activitySearchSchema.parse({
      latitude: "46.8",
      longitude: "-71.2",
      radiusKm: "40",
      season: "summer,fall",
    });
    expect(parsed.latitude).toBe(46.8);
    expect(parsed.radiusKm).toBe(40);
    expect(parsed.season).toEqual(["summer", "fall"]);
  });

  it("refuse une latitude hors plage", () => {
    expect(
      activitySearchSchema.safeParse({
        latitude: 120,
        longitude: -71,
      }).success,
    ).toBe(false);
  });

  it("accepte une activité valide avec saisons JSONB", () => {
    const parsed = activityCreateSchema.parse({
      name: "Sentier Démo Test",
      latitude: 46.8,
      longitude: -71.2,
      kind: "activity",
      category: "randonnee",
      season: ["summer", "fall"],
      petFriendly: true,
    });
    expect(parsed.countryCode).toBe("CA");
    expect(parsed.season).toEqual(["summer", "fall"]);
  });
});

describe("seasonsOverlap", () => {
  it("match si intersection", () => {
    expect(seasonsOverlap(["summer", "fall"], ["fall", "winter"])).toBe(true);
  });

  it("year_round couvre tout filtre", () => {
    expect(seasonsOverlap(["year_round"], ["winter"])).toBe(true);
  });

  it("parseSeasons ignore les valeurs invalides", () => {
    expect(parseSeasons(["summer", "nope", 1])).toEqual(["summer"]);
  });
});

describe("distance étape ↔ activité", () => {
  it("calcule un avertissement au-delà du seuil", () => {
    const km = haversineKm(46.8139, -71.208, 48.8302, -64.4818);
    expect(km).toBeGreaterThan(ACTIVITY_STOP_DISTANCE_WARN_KM);
  });

  it("reste sous le seuil pour deux points proches", () => {
    const km = haversineKm(46.8139, -71.208, 46.82, -71.21);
    expect(km).toBeLessThan(ACTIVITY_STOP_DISTANCE_WARN_KM);
  });
});

describe("deleteActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstActivity.mockResolvedValue({
      id: activityId,
      name: "Sentier Démo des Cascades",
      deletedAt: null,
    });
  });

  it("refuse la suppression si voyages actifs (planned/in_progress)", async () => {
    findManyLinks.mockResolvedValue([
      {
        tripStop: { trip: { id: tripId, title: "Roadtrip Gaspésie" } },
      },
    ]);

    const { deleteActivity } =
      await import("@/features/activities/services/activities");

    await expect(deleteActivity(activityId, adminId)).rejects.toMatchObject({
      code: "ACT_003",
      status: 409,
    });
    expect(activityUpdate).not.toHaveBeenCalled();
  });

  it("autorise le soft-delete si seulement completed/cancelled", async () => {
    findManyLinks.mockResolvedValue([]);
    activityUpdate.mockResolvedValue({
      id: activityId,
      deletedAt: new Date(),
    });

    const { deleteActivity } =
      await import("@/features/activities/services/activities");

    await deleteActivity(activityId, adminId);
    expect(activityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: activityId },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
    expect(writeAuditLog).toHaveBeenCalled();
  });
});
