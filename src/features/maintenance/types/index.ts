import type {
  MAINTENANCE_DOCUMENT_TYPES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_SCHEDULE_STATUSES,
} from "@/features/maintenance/constants";

export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export type MaintenanceScheduleStatus =
  (typeof MAINTENANCE_SCHEDULE_STATUSES)[number];

export type MaintenanceDocumentType =
  (typeof MAINTENANCE_DOCUMENT_TYPES)[number];

export type MaintenanceTemplateDto = {
  id: string;
  modelId: string;
  title: string;
  category: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  priority: string;
  description: string | null;
  manufacturerSource: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceScheduleDto = {
  id: string;
  vehicleId: string;
  templateId: string | null;
  templateTitle: string | null;
  templateCategory: string | null;
  templatePriority: string | null;
  nextDueDate: string | null;
  nextDueOdometer: number | null;
  status: string;
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceDocumentDto = {
  id: string;
  historyId: string;
  documentType: string;
  fileUrl: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceHistoryDto = {
  id: string;
  vehicleId: string;
  templateId: string | null;
  templateTitle: string | null;
  performedDate: string;
  performedOdometer: number;
  provider: string | null;
  cost: string | null;
  currency: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: MaintenanceDocumentDto[];
};

export type MaintenanceNotificationDto = {
  id: string;
  vehicleId: string;
  scheduleId: string;
  notificationDate: string;
  type: string;
  sent: boolean;
  createdAt: string;
  updatedAt: string;
  schedule?: MaintenanceScheduleDto | null;
};

export type MaintenanceStatsDto = {
  interventionCount: number;
  totalCost: string;
  yearCost: string;
  upcomingCount: number;
  overdueCount: number;
};

export type PaginatedHistory = {
  items: MaintenanceHistoryDto[];
  page: number;
  pageSize: number;
  total: number;
};

export type OdometerFreshnessDto = {
  vehicleId: string;
  vehicleLabel: string;
  odometerUpdatedAt: string;
  stale: boolean;
  daysSinceUpdate: number;
};

export type MaintenanceDashboardDto = {
  stats: MaintenanceStatsDto;
  upcoming: MaintenanceScheduleDto[];
  overdue: MaintenanceScheduleDto[];
  odometerHints: OdometerFreshnessDto[];
};
