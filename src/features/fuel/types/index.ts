export type FuelLogDto = {
  id: string;
  vehicleId: string;
  filledAt: string;
  odometerKm: number;
  liters: string;
  pricePerLiter: string;
  totalCost: string;
  isFull: boolean;
  fuelType: string | null;
  stationName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FuelStatsDto = {
  realAvgConsumption: string | null;
  fullFillCount: number;
  totalFillCount: number;
  segmentCount: number;
  totalDistanceKm: number;
  totalLitersInSegments: number;
  avgPricePerLiter: string | null;
  totalSpent: string;
  segments: Array<{
    fromOdometer: number;
    toOdometer: number;
    distanceKm: number;
    liters: string;
    litersPer100Km: string;
  }>;
};

export type FuelEstimateDto = {
  isEstimate: true;
  distanceKm: string;
  consumptionL100: string;
  consumptionSource: "real_avg" | "catalog" | "manual";
  pricePerLiter: string;
  priceSource:
    "regie_quebec" | "personal_average" | "user_default" | "not_applicable";
  priceSampleCount: number;
  litersNeeded: string;
  estimatedCost: string;
  currency: "CAD";
  priceLabel: string | null;
  regionLabel: string | null;
  priceCapturedAt: string | null;
};

export type PaginatedFuelLogs = {
  items: FuelLogDto[];
  total: number;
  page: number;
  pageSize: number;
};
