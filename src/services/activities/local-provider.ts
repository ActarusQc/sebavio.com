import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { boundingBox, haversineKm } from "@/lib/geo";
import {
  parseSeasons,
  seasonsOverlap,
  toActivityDto,
} from "@/features/activities/services/mappers";
import type { ActivitySearchInput } from "@/features/activities/schemas";
import type {
  ActivityDto,
  PaginatedActivities,
} from "@/features/activities/types";
import type { ActivityProvider, ActivityProviderAvailability } from "./types";

/**
 * Fournisseur local — table `activities` (option A, comme campings).
 */
export class LocalActivityProvider implements ActivityProvider {
  isAvailable(): ActivityProviderAvailability {
    return { available: true, provider: "local" };
  }

  async search(input: ActivitySearchInput): Promise<PaginatedActivities> {
    const box = boundingBox(input.latitude, input.longitude, input.radiusKm);

    const and: Prisma.ActivityWhereInput[] = [
      { deletedAt: null },
      { latitude: { gte: box.minLat, lte: box.maxLat } },
      { longitude: { gte: box.minLng, lte: box.maxLng } },
    ];

    if (input.petFriendly === true) {
      and.push({ petFriendly: true });
    }
    if (input.kind) {
      and.push({ kind: input.kind });
    }
    if (input.category) {
      and.push({ category: input.category });
    }
    if (input.q) {
      and.push({
        OR: [
          { name: { contains: input.q, mode: "insensitive" } },
          { city: { contains: input.q, mode: "insensitive" } },
          { region: { contains: input.q, mode: "insensitive" } },
        ],
      });
    }
    if (input.priceMax != null) {
      and.push({
        OR: [
          { priceIndicative: null },
          { priceIndicative: { lte: input.priceMax } },
        ],
      });
    }

    const where: Prisma.ActivityWhereInput = { AND: and };

    const rows = await prisma.activity.findMany({
      where,
      orderBy: { name: "asc" },
    });

    const filterSeasons = input.season ?? [];

    const withDistance = rows
      .map((row) => {
        const distanceKm = haversineKm(
          input.latitude,
          input.longitude,
          Number(row.latitude),
          Number(row.longitude),
        );
        return { row, distanceKm };
      })
      .filter((x) => x.distanceKm <= input.radiusKm)
      .filter((x) => seasonsOverlap(parseSeasons(x.row.season), filterSeasons))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const total = withDistance.length;
    const start = (input.page - 1) * input.pageSize;
    const pageItems = withDistance.slice(start, start + input.pageSize);

    return {
      items: pageItems.map(({ row, distanceKm }) =>
        toActivityDto(row, Math.round(distanceKm * 10) / 10),
      ),
      page: input.page,
      pageSize: input.pageSize,
      total,
    };
  }

  async getById(
    id: string,
    includeDeleted = false,
  ): Promise<ActivityDto | null> {
    const row = await prisma.activity.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
    if (!row) return null;
    return toActivityDto(row);
  }
}
