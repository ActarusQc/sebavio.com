import type {
  MaintenanceDocumentDto,
  MaintenanceHistoryDto,
  MaintenanceNotificationDto,
  MaintenanceScheduleDto,
  MaintenanceTemplateDto,
} from "@/features/maintenance/types";

function decimalToString(
  value: { toString(): string } | null | undefined,
): string | null {
  if (value == null) return null;
  return value.toString();
}

function dateToIsoDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export function toTemplateDto(row: {
  id: string;
  modelId: string;
  title: string;
  category: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  priority: string;
  description: string | null;
  manufacturerSource: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MaintenanceTemplateDto {
  return {
    id: row.id,
    modelId: row.modelId,
    title: row.title,
    category: row.category,
    intervalKm: row.intervalKm,
    intervalMonths: row.intervalMonths,
    priority: row.priority,
    description: row.description,
    manufacturerSource: row.manufacturerSource,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toScheduleDto(row: {
  id: string;
  vehicleId: string;
  templateId: string | null;
  nextDueDate: Date | null;
  nextDueOdometer: number | null;
  status: string;
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  template?: {
    title: string;
    category: string;
    priority: string;
  } | null;
}): MaintenanceScheduleDto {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    templateId: row.templateId,
    templateTitle: row.template?.title ?? null,
    templateCategory: row.template?.category ?? null,
    templatePriority: row.template?.priority ?? null,
    nextDueDate: dateToIsoDate(row.nextDueDate),
    nextDueOdometer: row.nextDueOdometer,
    status: row.status,
    lastCalculatedAt: row.lastCalculatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toDocumentDto(row: {
  id: string;
  historyId: string;
  documentType: string;
  fileUrl: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): MaintenanceDocumentDto {
  return {
    id: row.id,
    historyId: row.historyId,
    documentType: row.documentType,
    fileUrl: row.fileUrl,
    uploadedAt: row.uploadedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toHistoryDto(row: {
  id: string;
  vehicleId: string;
  templateId: string | null;
  performedDate: Date;
  performedOdometer: number;
  provider: string | null;
  cost: { toString(): string } | null;
  currency: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  template?: { title: string } | null;
  documents?: Parameters<typeof toDocumentDto>[0][];
}): MaintenanceHistoryDto {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    templateId: row.templateId,
    templateTitle: row.template?.title ?? null,
    performedDate: dateToIsoDate(row.performedDate)!,
    performedOdometer: row.performedOdometer,
    provider: row.provider,
    cost: decimalToString(row.cost),
    currency: row.currency,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    documents: row.documents?.map(toDocumentDto),
  };
}

export function toNotificationDto(row: {
  id: string;
  vehicleId: string;
  scheduleId: string;
  notificationDate: Date;
  type: string;
  sent: boolean;
  createdAt: Date;
  updatedAt: Date;
  schedule?: Parameters<typeof toScheduleDto>[0] | null;
}): MaintenanceNotificationDto {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    scheduleId: row.scheduleId,
    notificationDate: row.notificationDate.toISOString(),
    type: row.type,
    sent: row.sent,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    schedule: row.schedule ? toScheduleDto(row.schedule) : null,
  };
}

export function clampPageSize(pageSize: number, max: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) return 1;
  return Math.min(pageSize, max);
}
