/**
 * Feature `activities` — répertoire local activités/POI, recherche, favoris, lien étapes.
 */
export {
  searchActivities,
  getActivityById,
  listActivitiesAdmin,
  createActivity,
  updateActivity,
  deleteActivity,
  listFavorites,
  addFavorite,
  removeFavorite,
  attachActivityToStop,
  detachActivityFromStop,
} from "@/features/activities/services";

export {
  ACTIVITY_KINDS,
  ACTIVITY_CATEGORIES,
  ACTIVITY_SEASONS,
  ACTIVITY_KIND_LABELS,
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_SEASON_LABELS,
  ACTIVITY_STOP_DISTANCE_WARN_KM,
  SEED_DEV_SOURCE,
} from "@/features/activities/constants";

export type {
  ActivityDto,
  ActivityFavoriteDto,
  ActivitySummaryDto,
  PaginatedActivities,
  AttachActivityResult,
} from "@/features/activities/types";
