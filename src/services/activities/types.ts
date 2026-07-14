import type {
  ActivityDto,
  PaginatedActivities,
} from "@/features/activities/types";
import type { ActivitySearchInput } from "@/features/activities/schemas";

/**
 * Abstraction fournisseur activités / POI (Docs 8/10).
 * Implémentation active : local (Prisma). Futurs fournisseurs via ACTIVITY_PROVIDER.
 */
export type ActivityProviderAvailability = {
  available: boolean;
  provider: string;
  reason?: string;
};

export type ActivityProvider = {
  isAvailable(): ActivityProviderAvailability;
  search(input: ActivitySearchInput): Promise<PaginatedActivities>;
  getById(id: string, includeDeleted?: boolean): Promise<ActivityDto | null>;
};
