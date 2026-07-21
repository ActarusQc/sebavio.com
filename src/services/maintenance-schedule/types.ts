/** Types abstraction calendriers d’entretien (fournisseurs externes). */

export const MAINTENANCE_CATEGORIES = [
  "engine_oil",
  "oil_filter",
  "air_filter",
  "cabin_filter",
  "brakes",
  "brake_fluid",
  "coolant",
  "transmission",
  "spark_plugs",
  "timing_belt",
  "drive_belt",
  "battery",
  "tires",
  "suspension",
  "steering",
  "differential",
  "transfer_case",
  "exhaust",
  "general_inspection",
  "other",
] as const;

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const MAINTENANCE_ACTION_TYPES = [
  "inspect",
  "replace",
  "service",
  "rotate",
  "lubricate",
  "adjust",
  "test",
] as const;

export type MaintenanceActionType = (typeof MAINTENANCE_ACTION_TYPES)[number];

export const MAINTENANCE_CONDITION_TYPES = [
  "normal",
  "severe",
  "both",
] as const;

export type MaintenanceConditionType =
  (typeof MAINTENANCE_CONDITION_TYPES)[number];

export const MAINTENANCE_TASK_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type MaintenanceTaskPriority =
  (typeof MAINTENANCE_TASK_PRIORITIES)[number];

export const DUE_STATUSES = [
  "overdue",
  "due_now",
  "due_soon",
  "upcoming",
  "completed",
  "unknown",
] as const;

export type DueStatus = (typeof DUE_STATUSES)[number];

export type NormalizedMaintenanceTask = {
  externalId?: string;
  category: MaintenanceCategory;
  title: string;
  description?: string;
  actionType: MaintenanceActionType;
  intervalKm?: number;
  intervalMonths?: number;
  firstDueKm?: number;
  firstDueMonths?: number;
  conditionType: MaintenanceConditionType;
  priority: MaintenanceTaskPriority;
  /** Toujours false pour mock / conseils Sebavio. */
  officialManufacturerRecommendation: boolean;
  inspectionOnly: boolean;
  estimatedDurationMinutes?: number;
  notes?: string;
  sourceReference?: string;
};

export type MaintenanceVehicleInput = {
  vin?: string | null;
  year?: number | null;
  make?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  trim?: string | null;
  engine?: string | null;
  fuelType?: string | null;
  vehicleType?: string | null;
};

export type MaintenanceScheduleResult = {
  providerName: string;
  providerVehicleId?: string;
  sourceType: "commercial" | "mock" | "manual" | "cached";
  sourceReference?: string;
  sourceVersion?: string;
  normalConditions: boolean;
  severeConditions: boolean;
  tasks: NormalizedMaintenanceTask[];
  /** Hash stable du payload normalisé (déduplication). */
  rawDataHash?: string;
  /** Avertissement utilisateur (données demo, stale, etc.). */
  warning?: string;
};

export interface MaintenanceScheduleProvider {
  readonly providerName: string;
  getSchedule(
    input: MaintenanceVehicleInput,
  ): Promise<MaintenanceScheduleResult>;
}

export type UsageFactorFlags = {
  shortTrips?: boolean;
  urbanDriving?: boolean;
  towing?: boolean;
  heavyVehicle?: boolean;
  dustyRoads?: boolean;
  coldWeather?: boolean;
  commercialUse?: boolean;
  highAnnualKm?: boolean;
  mountainDriving?: boolean;
};

export type UsageProfile = "normal" | "severe" | "automatic";
