/**
 * Intégration locale FDE (Fuel Data Engine).
 *
 * Copie alignée sur `clients/fde-fuel-prices` du dépôt FDE +
 * `docs/integrations/sebavio/openapi-v1.yaml`.
 *
 * Pour remplacer par le client officiel :
 * 1. Copier `clients/fde-fuel-prices` depuis le dépôt FDE
 * 2. Remplacer le contenu de `./client/`
 * 3. Adapter les imports `.js` si besoin
 * 4. Conserver `fde-config.ts`, `fde-cache.ts`, `fde-client-factory.ts`
 */

export { createClient, type FdeFuelPricesClient } from "./client";
export {
  FdeFuelPricesError,
  FdeFuelPricesForbiddenError,
  FdeFuelPricesNotFoundError,
  FdeFuelPricesRateLimitError,
  FdeFuelPricesResponseValidationError,
  FdeFuelPricesUnauthorizedError,
} from "./client";
export {
  getFdeConfig,
  isFdeEnabled,
  loadFdeConfig,
  resetFdeConfigCache,
  type FdeConfig,
} from "./fde-config";
export {
  getFdeClient,
  resetFdeClient,
  setFdeClientForTests,
} from "./fde-client-factory";
export {
  clearFdeMemoryCache,
  getFdeCachedJson,
  nearbyCacheKey,
  regionalCacheKey,
  roundCoord,
  setFdeCachedJson,
} from "./fde-cache";
export {
  fdeMetricInc,
  getFdeMetrics,
  logFdeEvent,
  resetFdeMetrics,
} from "./fde-metrics";
