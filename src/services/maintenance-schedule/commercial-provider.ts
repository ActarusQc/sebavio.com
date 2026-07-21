import { AppError } from "@/lib/errors";
import {
  commercialScheduleResponseSchema,
  normalizeCommercialResponse,
} from "./normalize";
import type {
  MaintenanceScheduleProvider,
  MaintenanceScheduleResult,
  MaintenanceVehicleInput,
} from "./types";

export type CommercialProviderConfig = {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  maxRetries: number;
  /** Nom logique (motor, dataone, …) — jamais de clé dans les logs. */
  providerLabel: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fournisseur commercial générique (MOTOR, DataOne, Vehicle Databases, TorqueNode…).
 * L’URL et la clé viennent des variables d’environnement — aucun fournisseur
 * n’est codé en dur dans le domaine métier.
 */
export class CommercialMaintenanceProvider implements MaintenanceScheduleProvider {
  readonly providerName: string;

  constructor(private readonly config: CommercialProviderConfig) {
    this.providerName = config.providerLabel || "commercial";
  }

  async getSchedule(
    input: MaintenanceVehicleInput,
  ): Promise<MaintenanceScheduleResult> {
    const url = new URL("/v1/maintenance-schedule", this.config.baseUrl);
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(Math.min(2000, 250 * 2 ** attempt));
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            vin: input.vin ?? undefined,
            year: input.year ?? undefined,
            make: input.make ?? input.manufacturer ?? undefined,
            model: input.model ?? undefined,
            trim: input.trim ?? undefined,
            engine: input.engine ?? undefined,
          }),
          signal: controller.signal,
        });

        if (response.status === 404) {
          throw new AppError(
            "MNT_006",
            "Aucun calendrier d’entretien trouvé pour ce véhicule.",
            404,
          );
        }

        if (response.status === 401 || response.status === 403) {
          throw new AppError(
            "MNT_007",
            "Fournisseur d’entretien non autorisé. Vérifiez la configuration.",
            502,
          );
        }

        if (!response.ok) {
          throw new AppError(
            "MNT_008",
            `Fournisseur d’entretien indisponible (HTTP ${response.status}).`,
            502,
          );
        }

        const json: unknown = await response.json();
        const parsed = commercialScheduleResponseSchema.safeParse(json);
        if (!parsed.success) {
          throw new AppError(
            "MNT_009",
            "Réponse fournisseur d’entretien invalide.",
            502,
          );
        }

        return normalizeCommercialResponse(this.providerName, parsed.data);
      } catch (error) {
        lastError = error;
        if (error instanceof AppError && error.code === "MNT_006") {
          throw error;
        }
        if (error instanceof AppError && error.code === "MNT_007") {
          throw error;
        }
        if (attempt >= this.config.maxRetries) break;
      } finally {
        clearTimeout(timer);
      }
    }

    if (lastError instanceof AppError) throw lastError;
    throw new AppError(
      "MNT_008",
      "Fournisseur d’entretien indisponible après plusieurs tentatives.",
      502,
    );
  }
}
