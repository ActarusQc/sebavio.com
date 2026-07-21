import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { AppError } from "@/lib/errors";
import type {
  SyncResourceReport,
  VehicleCatalogSyncReport,
} from "../domain/types";
import { getVehicleCatalogEnv } from "../infrastructure/config";
import { parseCatalogCsvFile } from "../infrastructure/csv-parser";
import {
  downloadOfficialFile,
  safeUnlink,
} from "../infrastructure/http-client";
import { acquireSyncLock } from "../infrastructure/lock";
import { discoverOfficialResources } from "../infrastructure/resource-detector";
import {
  completeSyncRun,
  createSyncRun,
  getLatestSuccessfulChecksums,
  hasRunningSync,
  upsertCatalogBatch,
} from "../infrastructure/repository";

async function sha256File(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

export async function syncVehicleCatalog(options?: {
  force?: boolean;
}): Promise<VehicleCatalogSyncReport> {
  const env = getVehicleCatalogEnv();
  if (!env.enabled) {
    throw new AppError(
      "EXT_004",
      "Synchronisation catalogue désactivée (VEHICLE_CATALOG_SYNC_ENABLED)",
      503,
    );
  }

  if (await hasRunningSync()) {
    throw new AppError(
      "EXT_005",
      "Une synchronisation catalogue est déjà en cours",
      409,
    );
  }

  const lock = await acquireSyncLock();
  // Redis indisponible : on continue avec le verrou DB (hasRunningSync)
  const startedAt = new Date();
  const sync = await createSyncRun(startedAt);

  const resourceReports: SyncResourceReport[] = [];
  const checksums: Record<string, string> = {};
  const totals = {
    recordsRead: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsUnchanged: 0,
    recordsRejected: 0,
  };
  let fatalError: string | null = null;

  try {
    const discovered = await discoverOfficialResources();
    if (discovered.selected.length === 0) {
      throw new AppError(
        "EXT_002",
        "Aucune ressource CSV officielle sélectionnable",
        502,
      );
    }

    const previousChecksums = options?.force
      ? new Map<string, string>()
      : await getLatestSuccessfulChecksums();

    for (const resource of discovered.selected) {
      let filePath: string | null = null;
      try {
        const downloaded = await downloadOfficialFile(
          resource.url,
          resource.url.split("/").pop() ?? `${resource.id}.csv`,
        );
        filePath = downloaded.filePath;
        const checksum = await sha256File(filePath);
        checksums[resource.url] = checksum;

        if (
          !options?.force &&
          previousChecksums.get(resource.url) === checksum
        ) {
          resourceReports.push({
            resourceId: resource.id,
            name: resource.name,
            url: resource.url,
            checksum,
            skippedUnchanged: true,
            recordsRead: 0,
            recordsCreated: 0,
            recordsUpdated: 0,
            recordsUnchanged: 0,
            recordsRejected: 0,
            rejectionSamples: [],
          });
          continue;
        }

        const parsed = await parseCatalogCsvFile(filePath, resource);
        let created = 0;
        let updated = 0;
        let unchanged = 0;
        const batchSize = env.batchSize;
        for (let i = 0; i < parsed.rows.length; i += batchSize) {
          const chunk = parsed.rows.slice(i, i + batchSize);
          const result = await upsertCatalogBatch(chunk, startedAt);
          created += result.created;
          updated += result.updated;
          unchanged += result.unchanged;
        }

        const report: SyncResourceReport = {
          resourceId: resource.id,
          name: resource.name,
          url: resource.url,
          checksum,
          skippedUnchanged: false,
          recordsRead: parsed.recordsRead,
          recordsCreated: created,
          recordsUpdated: updated,
          recordsUnchanged: unchanged,
          recordsRejected: parsed.rejected.length,
          rejectionSamples: parsed.rejected.slice(0, 25),
        };
        resourceReports.push(report);
        totals.recordsRead += report.recordsRead;
        totals.recordsCreated += report.recordsCreated;
        totals.recordsUpdated += report.recordsUpdated;
        totals.recordsUnchanged += report.recordsUnchanged;
        totals.recordsRejected += report.recordsRejected;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur ressource";
        resourceReports.push({
          resourceId: resource.id,
          name: resource.name,
          url: resource.url,
          checksum: "",
          skippedUnchanged: false,
          recordsRead: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          recordsUnchanged: 0,
          recordsRejected: 0,
          rejectionSamples: [{ reason: message, rowNumber: 0 }],
        });
        // Continuer les autres ressources — conserver le catalogue existant
      } finally {
        await safeUnlink(filePath);
      }
    }

    const anySuccess = resourceReports.some(
      (r) =>
        r.skippedUnchanged ||
        r.recordsCreated + r.recordsUpdated + r.recordsUnchanged > 0,
    );
    const anyFailure = resourceReports.some(
      (r) =>
        r.rejectionSamples.some((s) => s.rowNumber === 0) &&
        !r.skippedUnchanged &&
        r.recordsRead === 0,
    );

    const status =
      anySuccess && anyFailure
        ? "partial"
        : anySuccess || resourceReports.every((r) => r.skippedUnchanged)
          ? "success"
          : "failed";

    if (status === "failed") {
      fatalError = "Aucune ressource n'a pu être importée";
    }

    await completeSyncRun(sync.id, {
      status,
      completedAt: new Date(),
      sourceDataset: discovered.datasetTitle ?? discovered.datasetId,
      sourceChecksum: Object.values(checksums)[0] ?? null,
      recordsRead: totals.recordsRead,
      recordsCreated: totals.recordsCreated,
      recordsUpdated: totals.recordsUpdated,
      recordsUnchanged: totals.recordsUnchanged,
      recordsRejected: totals.recordsRejected,
      errorMessage: fatalError,
      metadata: {
        datasetId: discovered.datasetId,
        resourceChecksums: checksums,
        resources: resourceReports.map((r) => ({
          id: r.resourceId,
          name: r.name,
          url: r.url,
          checksum: r.checksum,
          skippedUnchanged: r.skippedUnchanged,
          recordsRead: r.recordsRead,
          recordsCreated: r.recordsCreated,
          recordsUpdated: r.recordsUpdated,
          recordsUnchanged: r.recordsUnchanged,
          recordsRejected: r.recordsRejected,
        })),
      },
    });

    return {
      status,
      syncId: sync.id,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      resources: resourceReports,
      totals,
      errorMessage: fatalError,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Échec synchronisation";
    await completeSyncRun(sync.id, {
      status: "failed",
      completedAt: new Date(),
      recordsRead: totals.recordsRead,
      recordsCreated: totals.recordsCreated,
      recordsUpdated: totals.recordsUpdated,
      recordsUnchanged: totals.recordsUnchanged,
      recordsRejected: totals.recordsRejected,
      errorMessage: message,
      metadata: { resources: resourceReports },
    });
    if (error instanceof AppError) throw error;
    throw new AppError("EXT_002", message, 502);
  } finally {
    if (lock) await lock.release();
  }
}
