import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  templateCreateSchema,
  templateUpdateSchema,
  type TemplateCreateInput,
  type TemplateUpdateInput,
} from "@/features/maintenance/schemas";
import { toTemplateDto } from "@/features/maintenance/services/mappers";
import type { MaintenanceTemplateDto } from "@/features/maintenance/types";
import { ZodError } from "zod";

function parseZod<T>(parse: () => T, fallbackMessage: string): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? fallbackMessage,
        400,
      );
    }
    throw error;
  }
}

async function assertModelExists(modelId: string) {
  const model = await prisma.vehicleModel.findUnique({
    where: { id: modelId },
    select: { id: true },
  });
  if (!model) {
    throw new AppError("CAT_002", "Modèle introuvable", 404);
  }
}

export async function listTemplatesForModel(
  modelId: string,
): Promise<MaintenanceTemplateDto[]> {
  await assertModelExists(modelId);
  const rows = await prisma.maintenanceTemplate.findMany({
    where: { modelId },
    orderBy: [{ priority: "desc" }, { title: "asc" }],
  });
  return rows.map(toTemplateDto);
}

export async function getTemplateOrThrow(id: string) {
  const row = await prisma.maintenanceTemplate.findUnique({ where: { id } });
  if (!row) {
    throw new AppError("MNT_004", "Programme constructeur absent", 404);
  }
  return row;
}

export async function createTemplate(
  raw: unknown,
  actorId: string,
  ipAddress?: string | null,
): Promise<MaintenanceTemplateDto> {
  const input = parseZod(
    () => templateCreateSchema.parse(raw),
    "Gabarit invalide",
  ) as TemplateCreateInput;
  await assertModelExists(input.modelId);

  const created = await prisma.maintenanceTemplate.create({
    data: {
      modelId: input.modelId,
      title: input.title,
      category: input.category,
      intervalKm: input.intervalKm ?? null,
      intervalMonths: input.intervalMonths ?? null,
      priority: input.priority,
      description: input.description ?? null,
      manufacturerSource: input.manufacturerSource ?? null,
    },
  });

  await writeAuditLog({
    userId: actorId,
    entity: "maintenance_templates",
    entityId: created.id,
    action: "create",
    newValue: {
      modelId: created.modelId,
      title: created.title,
      category: created.category,
    },
    ipAddress,
  });

  return toTemplateDto(created);
}

export async function updateTemplate(
  id: string,
  raw: unknown,
  actorId: string,
  ipAddress?: string | null,
): Promise<MaintenanceTemplateDto> {
  const existing = await getTemplateOrThrow(id);
  const input = parseZod(
    () => templateUpdateSchema.parse(raw),
    "Gabarit invalide",
  ) as TemplateUpdateInput;

  const updated = await prisma.maintenanceTemplate.update({
    where: { id },
    data: {
      title: input.title ?? undefined,
      category: input.category ?? undefined,
      intervalKm: input.intervalKm !== undefined ? input.intervalKm : undefined,
      intervalMonths:
        input.intervalMonths !== undefined ? input.intervalMonths : undefined,
      priority: input.priority ?? undefined,
      description:
        input.description !== undefined ? input.description : undefined,
      manufacturerSource:
        input.manufacturerSource !== undefined
          ? input.manufacturerSource
          : undefined,
    },
  });

  await writeAuditLog({
    userId: actorId,
    entity: "maintenance_templates",
    entityId: id,
    action: "update",
    oldValue: { title: existing.title, category: existing.category },
    newValue: { title: updated.title, category: updated.category },
    ipAddress,
  });

  return toTemplateDto(updated);
}

export async function deleteTemplate(
  id: string,
  actorId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await getTemplateOrThrow(id);

  const [scheduleCount, historyCount] = await Promise.all([
    prisma.maintenanceSchedule.count({ where: { templateId: id } }),
    prisma.maintenanceHistory.count({ where: { templateId: id } }),
  ]);
  if (scheduleCount > 0 || historyCount > 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Gabarit encore référencé par des échéances ou historiques",
      409,
    );
  }

  await prisma.maintenanceTemplate.delete({ where: { id } });

  await writeAuditLog({
    userId: actorId,
    entity: "maintenance_templates",
    entityId: id,
    action: "delete",
    oldValue: { title: existing.title, modelId: existing.modelId },
    ipAddress,
  });
}
