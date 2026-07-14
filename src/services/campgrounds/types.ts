import type {
  CampgroundDto,
  PaginatedCampgrounds,
} from "@/features/campings/types";
import type { CampgroundSearchInput } from "@/features/campings/schemas";

/**
 * Abstraction fournisseur campings (Docs 8/10).
 * Implémentation active : local (Prisma). Futurs fournisseurs via CAMPGROUND_PROVIDER.
 */
export type CampgroundProviderAvailability = {
  available: boolean;
  provider: string;
  reason?: string;
};

export type CampgroundProvider = {
  isAvailable(): CampgroundProviderAvailability;
  search(
    input: CampgroundSearchInput & { maxLengthM?: number | null },
  ): Promise<PaginatedCampgrounds>;
  getById(id: string, includeDeleted?: boolean): Promise<CampgroundDto | null>;
};
