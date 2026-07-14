/**
 * Feature `campings` — répertoire local, recherche, favoris, lien voyages.
 */
export {
  searchCampgrounds,
  getCampgroundById,
  listCampgroundsAdmin,
  createCampground,
  updateCampground,
  deleteCampground,
  listFavorites,
  addFavorite,
  removeFavorite,
  attachCampgroundToStop,
} from "@/features/campings/services";

export {
  CAMPGROUND_TYPES,
  CAMPGROUND_SERVICES,
  CAMPGROUND_TYPE_LABELS,
  CAMPGROUND_SERVICE_LABELS,
  CAMPGROUND_STOP_DISTANCE_WARN_KM,
  SEED_DEV_SOURCE,
} from "@/features/campings/constants";

export type {
  CampgroundDto,
  CampgroundFavoriteDto,
  PaginatedCampgrounds,
  AttachCampgroundResult,
} from "@/features/campings/types";
