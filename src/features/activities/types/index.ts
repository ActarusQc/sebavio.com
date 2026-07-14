import type {
  ActivityCategory,
  ActivityDataSource,
  ActivityKind,
  ActivitySeason,
} from "@/features/activities/constants";

export type ActivityDto = {
  id: string;
  name: string;
  kind: ActivityKind | string;
  category: ActivityCategory | string;
  latitude: string;
  longitude: string;
  address: string | null;
  city: string | null;
  region: string | null;
  countryCode: string;
  familyScore: number | null;
  petFriendly: boolean;
  estimatedDurationMin: number | null;
  priceIndicative: string | null;
  season: ActivitySeason[];
  description: string | null;
  rating: string | null;
  website: string | null;
  source: ActivityDataSource | string;
  archived: boolean;
  distanceKm: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivitySummaryDto = {
  id: string;
  name: string;
  kind: ActivityKind | string;
  category: ActivityCategory | string;
  archived: boolean;
  latitude: string;
  longitude: string;
  distanceKm: number | null;
  distanceWarning: string | null;
};

export type ActivityFavoriteDto = {
  id: string;
  activityId: string;
  notes: string | null;
  activity: ActivityDto;
  createdAt: string;
};

export type PaginatedActivities = {
  items: ActivityDto[];
  page: number;
  pageSize: number;
  total: number;
};

export type AttachActivityResult = {
  stopId: string;
  activityId: string;
  linkId: string;
  distanceKm: number | null;
  /** Message UI non bloquant si distance > seuil. */
  distanceWarning: string | null;
};
