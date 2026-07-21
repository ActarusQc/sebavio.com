/**
 * Feature `plans` — Admin Forfaits (Phase 4).
 * Exports publics centralisés.
 */

export {
  PLAN_ENTITLEMENT_KEYS,
  ENTITLEMENT_DEFINITIONS,
  ENTITLEMENT_CATEGORIES,
  ENTITLEMENT_CATEGORY_LABELS,
  getEntitlementDefinition,
  listEntitlementsByCategory,
  assertKnownEntitlementKey,
} from "./lib/entitlement-registry";

export type {
  PlanEntitlementKey,
  EntitlementDefinition,
  EntitlementCategory,
} from "./lib/entitlement-registry";

export {
  resolveEntitlementFromRows,
  isWithinLimit,
  getRemainingUsage,
} from "./lib/entitlement-resolve";

export type { EntitlementRow } from "./lib/entitlement-resolve";

export {
  createPlanSchema,
  updatePlanMetadataSchema,
  setEntitlementsSchema,
  createPlanPriceSchema,
  hidePlanSchema,
  archivePlanSchema,
  applyPlanSyncSchema,
  listPlansSchema,
  getPlanSchema,
  duplicatePlanSchema,
  reconcilePlanSchema,
  deletePlanSchema,
} from "./lib/schemas";

export type {
  CreatePlanInput,
  UpdatePlanMetadataInput,
  SetEntitlementsInput,
  CreatePlanPriceInput,
  ArchivePlanInput,
  HidePlanInput,
  ApplyPlanSyncInput,
  ListPlansInput,
  GetPlanInput,
  DuplicatePlanInput,
  ReconcilePlanInput,
  DeletePlanInput,
} from "./lib/schemas";

export {
  countSubscribersForPlan,
  PLAN_ACTIVE_SUBSCRIPTION_STATUSES,
} from "./lib/subscriber-counts";
export type { PlanSubscriberCounts } from "./lib/subscriber-counts";

export {
  listPlans,
  getPlan,
  listPlanSubscribers,
  listPlanAuditLogs,
} from "./services/plan-queries";
export type {
  PlanListItem,
  PlanDetail,
  PlanSubscriberRow,
  PlanAuditRow,
} from "./services/plan-queries";

export {
  createPlan,
  reconcilePlan,
  updatePlanMetadata,
  hidePlan,
  archivePlan,
  duplicatePlan,
} from "./services/plan-crud";
export type { PlanActor } from "./services/plan-crud";

export {
  getPlanDeleteImpact,
  canHardDeletePlan,
  deletePlanHard,
} from "./services/plan-delete";
export type { CanHardDeleteOptions } from "./services/plan-delete";
export type { PlanDeleteImpact } from "./lib/plan-delete-types";

export { setPlanEntitlements } from "./services/plan-entitlements";
export {
  createNewPlanPrice,
  planPriceOperationIdempotencyKey,
} from "./services/plan-prices";

export { previewPlanSync, applyPlanSync } from "./services/plan-sync";
export type {
  PlanSyncReport,
  PlanSyncProposedAction,
  ApplyPlanSyncResult,
} from "./services/plan-sync";

export {
  listPlansAction,
  getPlanAction,
  createPlanAction,
  updatePlanMetadataAction,
  setPlanEntitlementsAction,
  createPlanPriceAction,
  hidePlanAction,
  archivePlanAction,
  duplicatePlanAction,
  previewPlanSyncAction,
  applyPlanSyncAction,
  reconcilePlanAction,
  getPlanDeleteImpactAction,
  deletePlanAction,
} from "./actions";

export type { ActionResult, ActionOk, ActionErr } from "./actions";

export { PlansPageHeader } from "./components/plans-page-header";
export { PlansGrid } from "./components/plans-grid";
export { PlanStatusBadge } from "./components/plan-status-badge";
export { SyncPlansDialog } from "./components/sync-plans-dialog";
export { CreatePlanForm } from "./components/create-plan-form";
export { EditPlanForm } from "./components/edit-plan-form";
export { PlanEntitlementsForm } from "./components/plan-entitlements-form";
export { CreatePlanPriceForm } from "./components/create-plan-price-form";
export { PlanLifecycleActions } from "./components/plan-lifecycle-actions";
