/**
 * Types suppression forfait — partagés client / serveur (sans server-only).
 */

export type PlanDeleteImpact = {
  planId: string;
  publicName: string;
  internalName: string;
  status: string;
  isSystemProtected: boolean;
  stripeProductId: string | null;
  stripeMode: string;
  pricesCount: number;
  priceSummaries: Array<{
    billingType: string;
    interval: string;
    intervalCount: number;
    unitAmount: number;
    currency: string;
    isCurrent: boolean;
    accessDurationDays: number | null;
  }>;
  subscriptionsTotal: number;
  activeSubscriptions: number;
  purchasesCount: number;
  accessGrantsCount: number;
  activeGrantsCount: number;
  usersCovered: number;
  canDelete: boolean;
  blockReasons: string[];
};
