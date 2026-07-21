import { AppError } from "@/lib/errors";
import { createClient, type FdeFuelPricesClient } from "./client";
import { getFdeConfig, isFdeEnabled } from "./fde-config";

let client: FdeFuelPricesClient | null = null;
let clientOverride: FdeFuelPricesClient | null = null;

/**
 * Client HTTP FDE unique — tous les appels passent ici.
 * Clé uniquement serveur ; jamais exposée.
 */
export function getFdeClient(): FdeFuelPricesClient {
  if (clientOverride) return clientOverride;

  if (!isFdeEnabled()) {
    throw new AppError("FDE_001", "Intégration FDE désactivée", 503);
  }

  const config = getFdeConfig();
  if (!config.apiKey) {
    throw new AppError("FDE_002", "Configuration FDE incomplète", 503);
  }

  if (!client) {
    client = createClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs,
      userAgent: "sebavio-backend/1.0",
    });
  }
  return client;
}

export function setFdeClientForTests(
  override: FdeFuelPricesClient | null,
): void {
  clientOverride = override;
}

export function resetFdeClient(): void {
  client = null;
}
