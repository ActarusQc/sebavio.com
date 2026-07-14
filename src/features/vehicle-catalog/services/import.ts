import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  IMPORT_MAX_BYTES,
  IMPORT_MAX_LINES,
} from "@/features/vehicle-catalog/constants";
import {
  importManufacturerLineSchema,
  importModelLineSchema,
  importPayloadSchema,
} from "@/features/vehicle-catalog/schemas";
import type {
  CatalogImportReport,
  ImportLineError,
} from "@/features/vehicle-catalog/types";

function lineReason(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((i) => i.message).join("; ");
  }
  if (error instanceof Error) return error.message;
  return "Ligne invalide";
}

/**
 * Import admin JSON catalogue.
 * Validation Zod ligne par ligne + rapport acceptées/rejetées.
 */
export async function importCatalog(
  rawBody: unknown,
  actorId: string,
  ipAddress?: string | null,
  contentLength?: number | null,
): Promise<CatalogImportReport> {
  if (
    contentLength !== null &&
    contentLength !== undefined &&
    contentLength > IMPORT_MAX_BYTES
  ) {
    throw new AppError(
      "CAT_004",
      `Fichier trop volumineux (max ${IMPORT_MAX_BYTES} octets)`,
      413,
    );
  }

  let payload: { manufacturers: unknown[]; models: unknown[] };
  try {
    const parsed = importPayloadSchema.parse(rawBody ?? {});
    payload = {
      manufacturers: parsed.manufacturers ?? [],
      models: parsed.models ?? [],
    };
  } catch (error) {
    throw new AppError(
      "CAT_004",
      error instanceof ZodError
        ? (error.issues[0]?.message ?? "Données d'import invalides")
        : "Données d'import invalides",
      400,
    );
  }

  const totalLines = payload.manufacturers.length + payload.models.length;
  if (totalLines === 0) {
    throw new AppError("CAT_004", "Aucune ligne à importer", 400);
  }
  if (totalLines > IMPORT_MAX_LINES) {
    throw new AppError(
      "CAT_004",
      `Trop de lignes (max ${IMPORT_MAX_LINES} par import)`,
      400,
    );
  }
  if (payload.manufacturers.length > IMPORT_MAX_LINES) {
    throw new AppError(
      "CAT_004",
      `Trop de constructeurs (max ${IMPORT_MAX_LINES})`,
      400,
    );
  }
  if (payload.models.length > IMPORT_MAX_LINES) {
    throw new AppError(
      "CAT_004",
      `Trop de modèles (max ${IMPORT_MAX_LINES})`,
      400,
    );
  }

  const rejected: ImportLineError[] = [];
  let acceptedManufacturers = 0;
  let acceptedModels = 0;

  for (let i = 0; i < payload.manufacturers.length; i += 1) {
    const line = i + 1;
    try {
      const input = importManufacturerLineSchema.parse(
        payload.manufacturers[i],
      );
      const existing = await prisma.manufacturer.findUnique({
        where: { name: input.name },
      });
      if (existing) {
        await prisma.manufacturer.update({
          where: { id: existing.id },
          data: {
            countryCode: input.countryCode ?? existing.countryCode,
            website: input.website ?? existing.website,
            supportUrl: input.supportUrl ?? existing.supportUrl,
            logoUrl: input.logoUrl ?? existing.logoUrl,
            active: input.active ?? existing.active,
            source: existing.source === "seed-dev" ? "seed-dev" : "import",
          },
        });
      } else {
        await prisma.manufacturer.create({
          data: {
            name: input.name,
            countryCode: input.countryCode ?? null,
            website: input.website ?? null,
            supportUrl: input.supportUrl ?? null,
            logoUrl: input.logoUrl ?? null,
            active: input.active ?? true,
            source: "import",
          },
        });
      }
      acceptedManufacturers += 1;
    } catch (error) {
      rejected.push({
        section: "manufacturers",
        line,
        reason: lineReason(error),
      });
    }
  }

  for (let i = 0; i < payload.models.length; i += 1) {
    const line = i + 1;
    try {
      const input = importModelLineSchema.parse(payload.models[i]);
      const manufacturer = await prisma.manufacturer.findFirst({
        where: {
          name: { equals: input.manufacturerName, mode: "insensitive" },
        },
      });
      if (!manufacturer) {
        rejected.push({
          section: "models",
          line,
          reason: `Constructeur introuvable: ${input.manufacturerName}`,
        });
        continue;
      }

      const trim = input.trim ?? "";
      const existing = await prisma.vehicleModel.findFirst({
        where: {
          manufacturerId: manufacturer.id,
          year: input.year,
          trim,
          modelName: input.modelName,
        },
      });

      const data = {
        category: input.category,
        engine: input.engine ?? null,
        transmission: input.transmission ?? null,
        driveType: input.driveType ?? null,
        fuelType: input.fuelType ?? null,
        fuelCapacityL: input.fuelCapacityL ?? null,
        avgConsumption: input.avgConsumption ?? null,
        lengthM: input.lengthM ?? null,
        widthM: input.widthM ?? null,
        heightM: input.heightM ?? null,
        gvwrKg: input.gvwrKg ?? null,
        sleepingCapacity: input.sleepingCapacity ?? null,
        freshWaterL: input.freshWaterL ?? null,
        greyWaterL: input.greyWaterL ?? null,
        blackWaterL: input.blackWaterL ?? null,
      };

      if (existing) {
        await prisma.vehicleModel.update({
          where: { id: existing.id },
          data: {
            ...data,
            source: existing.source === "seed-dev" ? "seed-dev" : "import",
          },
        });
      } else {
        await prisma.vehicleModel.create({
          data: {
            manufacturerId: manufacturer.id,
            modelName: input.modelName,
            trim,
            year: input.year,
            ...data,
            source: "import",
          },
        });
      }
      acceptedModels += 1;
    } catch (error) {
      rejected.push({
        section: "models",
        line,
        reason: lineReason(error),
      });
    }
  }

  const report: CatalogImportReport = {
    accepted: {
      manufacturers: acceptedManufacturers,
      models: acceptedModels,
    },
    rejected,
    totals: {
      manufacturersLines: payload.manufacturers.length,
      modelsLines: payload.models.length,
      acceptedLines: acceptedManufacturers + acceptedModels,
      rejectedLines: rejected.length,
    },
  };

  await writeAuditLog({
    userId: actorId,
    entity: "catalog",
    entityId: null,
    action: "import",
    newValue: {
      acceptedManufacturers,
      acceptedModels,
      rejectedLines: rejected.length,
      manufacturersLines: payload.manufacturers.length,
      modelsLines: payload.models.length,
    },
    ipAddress,
  });

  return report;
}

/** Sync externe non branchée à cette étape. */
export async function syncCatalog(): Promise<never> {
  throw new AppError(
    "CAT_005",
    "Synchronisation catalogue impossible : aucune source externe configurée",
    501,
  );
}
