import { describe, expect, it } from "vitest";

import {
  ACCESS_LEVEL_PRIORITY,
  ACCESS_LEVELS,
  compareAccessLevels,
  hasAccessAtLeast,
  isFullAccessLevel,
} from "@/features/subscriptions/lib/access-levels";
import {
  hasFullAccess,
  type UserAccessSnapshot,
} from "@/features/subscriptions/services/access-resolve";
import { PLAN_ENTITLEMENT_KEYS } from "@/features/plans/lib/entitlement-registry";

function snapshot(
  overrides: Partial<UserAccessSnapshot> & Pick<UserAccessSnapshot, "level">,
): UserAccessSnapshot {
  return {
    userId: "u1",
    planId: null,
    planSlug: null,
    entitlements: PLAN_ENTITLEMENT_KEYS.map((key) => ({
      key,
      enabled: false,
      limit: null,
      value: null,
    })),
    passGrant: null,
    subscriptionId: null,
    resolvedAt: new Date(),
    ...overrides,
  };
}

describe("access levels — priorité", () => {
  it("ordonne admin > plus > pass > decouverte", () => {
    expect(ACCESS_LEVELS).toEqual([
      "admin",
      "sebavio_plus",
      "pass_30_jours",
      "decouverte",
    ]);
    expect(ACCESS_LEVEL_PRIORITY.admin).toBeGreaterThan(
      ACCESS_LEVEL_PRIORITY.sebavio_plus,
    );
    expect(ACCESS_LEVEL_PRIORITY.sebavio_plus).toBeGreaterThan(
      ACCESS_LEVEL_PRIORITY.pass_30_jours,
    );
    expect(ACCESS_LEVEL_PRIORITY.pass_30_jours).toBeGreaterThan(
      ACCESS_LEVEL_PRIORITY.decouverte,
    );
  });

  it("compareAccessLevels / hasAccessAtLeast respectent la priorité", () => {
    expect(compareAccessLevels("admin", "sebavio_plus")).toBeGreaterThan(0);
    expect(compareAccessLevels("pass_30_jours", "decouverte")).toBeGreaterThan(
      0,
    );
    expect(hasAccessAtLeast("sebavio_plus", "pass_30_jours")).toBe(true);
    expect(hasAccessAtLeast("decouverte", "pass_30_jours")).toBe(false);
  });

  it("isFullAccessLevel couvre admin, plus et pass", () => {
    expect(isFullAccessLevel("admin")).toBe(true);
    expect(isFullAccessLevel("sebavio_plus")).toBe(true);
    expect(isFullAccessLevel("pass_30_jours")).toBe(true);
    expect(isFullAccessLevel("decouverte")).toBe(false);
  });
});

describe("hasFullAccess", () => {
  it("retourne true pour les niveaux plein accès", () => {
    expect(hasFullAccess(snapshot({ level: "admin" }))).toBe(true);
    expect(hasFullAccess(snapshot({ level: "sebavio_plus" }))).toBe(true);
    expect(hasFullAccess(snapshot({ level: "pass_30_jours" }))).toBe(true);
  });

  it("retourne false pour découverte sans entitlement full_access", () => {
    expect(hasFullAccess(snapshot({ level: "decouverte" }))).toBe(false);
  });

  it("retourne true si entitlement trip.full_access.enabled", () => {
    const ents = PLAN_ENTITLEMENT_KEYS.map((key) => ({
      key,
      enabled: key === "trip.full_access.enabled",
      limit: null,
      value: null,
    }));
    expect(
      hasFullAccess(snapshot({ level: "decouverte", entitlements: ents })),
    ).toBe(true);
  });
});
