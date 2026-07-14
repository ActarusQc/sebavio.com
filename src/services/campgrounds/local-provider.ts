import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { boundingBox, haversineKm } from "@/lib/geo";
import { toCampgroundDto } from "@/features/campings/services/mappers";
import type { CampgroundSearchInput } from "@/features/campings/schemas";
import type {
  CampgroundDto,
  PaginatedCampgrounds,
} from "@/features/campings/types";
import type {
  CampgroundProvider,
  CampgroundProviderAvailability,
} from "./types";

type SearchOpts = CampgroundSearchInput & { maxLengthM?: number | null };

/**
 * Fournisseur local — table `campgrounds` (option A).
 */
export class LocalCampgroundProvider implements CampgroundProvider {
  isAvailable(): CampgroundProviderAvailability {
    return { available: true, provider: "local" };
  }

  async search(input: SearchOpts): Promise<PaginatedCampgrounds> {
    const box = boundingBox(input.latitude, input.longitude, input.radiusKm);

    const and: Prisma.CampgroundWhereInput[] = [
      { deletedAt: null },
      { latitude: { gte: box.minLat, lte: box.maxLat } },
      { longitude: { gte: box.minLng, lte: box.maxLng } },
    ];

    if (input.petFriendly === true) {
      and.push({ petFriendly: true });
    }
    if (input.campgroundType) {
      and.push({ campgroundType: input.campgroundType });
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
    if (input.maxLengthM != null) {
      and.push({
        OR: [{ maxLengthM: null }, { maxLengthM: { gte: input.maxLengthM } }],
      });
    }
    if (input.priceMax != null) {
      and.push({
        OR: [{ priceMin: null }, { priceMin: { lte: input.priceMax } }],
      });
    }

    const where: Prisma.CampgroundWhereInput = { AND: and };

    const rows = await prisma.campground.findMany({
      where,
      orderBy: { name: "asc" },
    });

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
      .filter((x) => {
        if (!input.service) return true;
        const services = Array.isArray(x.row.services) ? x.row.services : [];
        return services.includes(input.service);
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const total = withDistance.length;
    const start = (input.page - 1) * input.pageSize;
    const pageItems = withDistance.slice(start, start + input.pageSize);

    return {
      items: pageItems.map(({ row, distanceKm }) =>
        toCampgroundDto(row, Math.round(distanceKm * 10) / 10),
      ),
      page: input.page,
      pageSize: input.pageSize,
      total,
    };
  }

  async getById(
    id: string,
    includeDeleted = false,
  ): Promise<CampgroundDto | null> {
    const row = await prisma.campground.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
    if (!row) return null;
    return toCampgroundDto(row);
  }
}
