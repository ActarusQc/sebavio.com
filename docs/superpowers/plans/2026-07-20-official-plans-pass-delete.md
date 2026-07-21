# Official Plans + Pass 30j + Admin Delete — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Seed Découverte / Pass 30 jours / Sebavio Plus, one-time Pass access via Stripe Checkout + webhooks, access resolution, admin hard-delete with archive fallback, public pricing UI.

**Architecture:** Extend Phase 4 `Plan`/`PlanPrice` (billingType one_time|recurring, accessDurationDays, isSystemProtected). Add `PlanPurchase` + `PlanAccessGrant`. Centralize access in `features/subscriptions`. Reuse Stripe client, webhooks, audit, RBAC `plans.manage`.

**Tech Stack:** Next.js 16, Prisma, Stripe test mode, Zod, Vitest.

---

### Task 1: Schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/YYYYMMDDHHMMSS_official_plans_pass/migration.sql`

Fields:
- Plan.isSystemProtected
- PlanPrice.billingType (`recurring`|`one_time`), accessDurationDays nullable; interval allows `one_time`
- PlanPurchase, PlanAccessGrant (+ User relations)
- Soft constraints for delete dependency counts

### Task 2: Stripe one-time price + checkout

**Files:**
- Modify: `src/services/stripe/price-service.ts` (createSebavioOneTimePrice)
- Create: `src/services/stripe/checkout-service.ts`
- Modify: webhook handleEvent for checkout.session.completed → activate Pass

### Task 3: Access grants + resolution

**Files:**
- Create: `src/features/subscriptions/services/access-resolve.ts`
- Create: `src/features/subscriptions/services/pass-access.ts`
- Create: `src/features/subscriptions/lib/official-plan-slugs.ts`
- Extend entitlement registry if needed for preview/gps/trip_mode

### Task 4: Seed official plans (idempotent)

**Files:**
- Create: `prisma/seed-official-plans.ts` + wire package.json script
- Entitlements for free vs full

### Task 5: Admin delete plan

**Files:**
- Create: `src/features/plans/services/plan-delete.ts`
- Modify: actions, schemas, lifecycle UI (confirm name)

### Task 6: Admin Pass list + revoke/extend

**Files:**
- Admin pages under `/admin/passes` or billing section
- Actions revoke/extend with audit

### Task 7: Public pricing + conversion UI + account Pass status

**Files:**
- `/pricing` page, unlock screen components, dashboard subscription status

### Task 8: Tests + validate + smoke cleanup query

**Files:**
- tests/unit/* for seed, pass, delete, access, security
- Script/report for smoke plan deletion (DB only if safe)

### Task 9: Final report (no commit/push/deploy)

Stop before production migration / live Stripe.
