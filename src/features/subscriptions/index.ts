/**
 * Feature `subscriptions` — accès Pass / Plus / Découverte.
 */

export {
  OFFICIAL_PLAN_SLUGS,
  PASS_DURATION_DAYS,
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
  OFFICIAL_CURRENCY,
  type OfficialPlanSlug,
} from "./lib/official-plan-slugs";

export {
  ACCESS_LEVELS,
  ACCESS_LEVEL_PRIORITY,
  compareAccessLevels,
  hasAccessAtLeast,
  isFullAccessLevel,
  type AccessLevel,
} from "./lib/access-levels";

export {
  addDaysUtc,
  computePassWindow,
  computeExtendedEndsAt,
  activateOrExtendPassFromPurchase,
  expirePassIfNeeded,
  revokePassGrant,
  adminExtendPass,
  markPurchaseFailed,
  markPurchaseRefundedAndRevoke,
  type PassWindow,
  type ActivateOrExtendPassResult,
  type PassActor,
} from "./services/pass-access";

export {
  listPassGrants,
  getPassGrantDetail,
  PASS_GRANT_STATUSES,
  PASS_GRANT_STATUS_LABELS,
  PASS_ADMIN_DEFAULT_PAGE_SIZE,
  type PassGrantListItem,
  type PassGrantListResult,
  type PassGrantDetail,
  type PassGrantStatus,
  type ListPassGrantsInput,
} from "./services/pass-admin";

export {
  resolveUserAccess,
  assertFeatureAllowed,
  getPassRemainingDays,
  buildLimitedTripPreview,
  hasFullAccess,
  type UserAccessSnapshot,
} from "./services/access-resolve";

export type { LimitedTripPreview, LimitedTripPreviewInput } from "./types";

export {
  listPublicOfficialPlans,
  type PublicOfficialPlan,
  type PublicPlanPrice,
} from "./services/public-plans";

export {
  startPassCheckoutAction,
  startPlusCheckoutAction,
  type CheckoutActionResult,
  listPassGrantsAction,
  getPassGrantAction,
  revokePassGrantAction,
  adminExtendPassAction,
} from "./actions";

export {
  PassesTable,
  PassGrantActions,
  CheckoutButton,
  UnlockTripPanel,
  PassStatusCard,
  PricingPlansGrid,
} from "./components";

export {
  resolvePricingPlans,
  type PricingCardPlan,
} from "./lib/resolve-pricing-plans";

export {
  formatCadCents,
  formatPassPrice,
  formatPlusPrice,
  formatMonthlyFromAnnual,
} from "./lib/format-price";

export type { PublicPlanEntitlement } from "./services/public-plans";
