import type {
  CampgroundDataSource,
  CampgroundService,
  CampgroundType,
} from "@/features/campings/constants";

export type CampgroundDto = {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  address: string | null;
  city: string | null;
  region: string | null;
  countryCode: string;
  campgroundType: CampgroundType | string;
  maxLengthM: string | null;
  services: CampgroundService[];
  petFriendly: boolean;
  rating: string | null;
  priceMin: string | null;
  priceMax: string | null;
  reservationUrl: string | null;
  source: CampgroundDataSource | string;
  archived: boolean;
  distanceKm: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CampgroundSummaryDto = {
  id: string;
  name: string;
  archived: boolean;
  latitude: string;
  longitude: string;
};

export type CampgroundFavoriteDto = {
  id: string;
  campgroundId: string;
  notes: string | null;
  campground: CampgroundDto;
  createdAt: string;
};

export type PaginatedCampgrounds = {
  items: CampgroundDto[];
  page: number;
  pageSize: number;
  total: number;
};

export type AttachCampgroundResult = {
  stopId: string;
  campgroundId: string | null;
  distanceKm: number | null;
  /** Message UI non bloquant si distance > seuil. */
  distanceWarning: string | null;
};
