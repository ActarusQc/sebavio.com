# Admin Forfaits (Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le stub Admin « Forfaits » par une gestion complète Plan / PlanPrice / PlanEntitlement synchronisée avec Stripe (test|live), auditable et testée.

**Architecture:** Stripe = SoT financière ; PostgreSQL = SoT commerciale + entitlements + `is_current`. Feature `src/features/plans` + extensions `src/services/stripe` (products/prices). UI calquée sur Phase 3 billing. Spec : `docs/superpowers/specs/2026-07-20-admin-plans-design.md`.

**Tech Stack:** Next.js 16 App Router, Prisma Migrate, Zod, Vitest, Stripe SDK 22.3.0 (`2026-06-24.dahlia`), `writeAdminAuditLog`, RBAC `plans.read` / `plans.manage`.

**État réel (2026-07-20) :** Tasks 1–11 **PASS** en développement Contabo. Doc : `docs/admin/phase-4-forfaits.md`. Tests Phase 4 : **141 PASS**. Migration `20260720121243_plans_phase4` appliquée en dev. Aucun commit/push automatique.

## Global Constraints

- Pas de Docker ; npm ; Node 22 via nvm ; port 3050.
- Mode Stripe : `test` | `live` uniquement (`getStripeMode`).
- Client Stripe unique : `getStripeClient()` — jamais de second client.
- Jamais modifier `unit_amount` d’un Price Stripe existant.
- Sync en 2 étapes (preview → apply confirmé) ; sync n’écrit pas les entitlements.
- Produits Sebavio identifiés par `metadata.sebavio_app === "sebavio"` + `sebavio_stripe_mode`.
- Textes Stripe mockés ; aucun test destructif live.
- Textes FR UI ; commit uniquement si l’utilisateur le demande explicitement (ne pas committer automatiquement malgré les steps « Commit » ci-dessous — les traiter comme points de sauvegarde optionnels).
- Après changements UI : `npm run build` et redémarrage app dev si nécessaire (PM2 / process existant port 3050).

## File Structure

| Path | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | Models `Plan`, `PlanPrice`, `PlanEntitlement`, `PlanSyncRun`, `PlanSyncAction` |
| `prisma/migrations/*_plans_phase4/` | Migration + index partiel `is_current` + CHECK SQL |
| `src/services/stripe/product-service.ts` | CRUD produit Stripe |
| `src/services/stripe/price-service.ts` | Création / désactivation prix |
| `src/services/stripe/index.ts` | Réexports |
| `src/features/plans/lib/entitlement-registry.ts` | Clés typées + catégories UI |
| `src/features/plans/lib/entitlement-resolve.ts` | `resolveEntitlement`, `isWithinLimit` |
| `src/features/plans/lib/schemas.ts` | Schemas Zod |
| `src/features/plans/lib/subscriber-counts.ts` | Comptage abonnés par price/product + mode |
| `src/features/plans/services/plan-crud.ts` | Création / update / hide / archive / duplicate / reconcile |
| `src/features/plans/services/plan-prices.ts` | Nouveau prix + invariant `is_current` |
| `src/features/plans/services/plan-entitlements.ts` | Set entitlements |
| `src/features/plans/services/plan-sync.ts` | preview + apply |
| `src/features/plans/services/plan-queries.ts` | list / get détail |
| `src/features/plans/actions/*.ts` | Server Actions |
| `src/features/plans/components/*` | UI Admin |
| `src/features/plans/index.ts` | Barrel |
| `src/app/admin/plans/**` | Pages |
| `src/features/admin/constants.ts` | Nav `available: true` |
| `tests/unit/plans-*.test.ts` | Tests Phase 4 |
| `docs/admin/phase-4-forfaits.md` | Doc phase |

---

### Task 1: Schéma Prisma + migration

**Files:**
- Modify: `prisma/schema.prisma` (fin du fichier, après modèles Stripe)
- Create: migration via `npx prisma migrate dev`
- Verify: SQL constraints + index partiel (pas seulement `prisma validate`)

**Interfaces:**
- Produces: models `Plan`, `PlanPrice`, `PlanEntitlement`, `PlanSyncRun`, `PlanSyncAction` conformes à la spec §3 (ajustements validés)

Exigences schéma :
- `PlanPrice` : `@@unique([stripePriceId, stripeMode])` (pas unique sur price_id seul)
- `PlanSyncAction` : `@@unique([syncRunId, actionKey])`
- CHECK SQL : trial days, interval_count, unit_amount, limit, statuts, stripe_mode
- Index partiel `plan_prices_one_current_per_interval`
- Pas de `deleted_at` sur Plan ; pas d’enums Prisma (convention Phase 3 = String + CHECK)

- [ ] **Step 1: Ajouter les cinq modèles** dans `schema.prisma` selon spec §3.1–3.4.

- [ ] **Step 2: Créer la migration**

```bash
source ~/.nvm/nvm.sh && nvm use && cd /var/www/sebavio.com
npx prisma migrate dev --name plans_phase4 --create-only
```

- [ ] **Step 3: Compléter le SQL** — index partiel + tous les CHECK listés dans la spec / demande utilisateur.

- [ ] **Step 4: Appliquer**

```bash
npx prisma migrate dev
npx prisma generate
```

- [ ] **Step 5: `npx prisma validate`** — Expected: OK.

- [ ] **Step 6: Vérifier réellement l’index partiel et les CHECK** via SQL (psql ou script) :
  - insertion de 2 `plan_prices` `is_current=true` même `(plan_id, interval, interval_count, currency)` → **échec** unique index ;
  - `interval_count = 0` → **échec** CHECK ;
  - `unit_amount = -1` → **échec** CHECK ;
  - `default_trial_days = -1` → **échec** CHECK ;
  - `limit = -1` sur entitlement → **échec** CHECK ;
  - `stripe_mode = 'prod'` → **échec** CHECK ;
  - nettoyer les lignes de test ensuite.
  **Ne pas** se contenter de `prisma validate`.

- [ ] **Step 7: Ne pas committer.**

**Stop gate :** présenter diff schéma, SQL migration, commandes, validate, migrate, divergences, PASS/BLOCKED — attendre validation humaine avant Task 2.

---

### Task 2: Registre entitlements + résolution

**Files:**
- Create: `src/features/plans/lib/entitlement-registry.ts`
- Create: `src/features/plans/lib/entitlement-resolve.ts`
- Test: `tests/unit/plans-entitlements.test.ts`

**Interfaces:**
- Produces: `PLAN_ENTITLEMENT_KEYS`, `PlanEntitlementKey`, `PlanEntitlementValue`, `ENTITLEMENT_CATEGORIES`, `assertKnownEntitlementKey`, `resolveEntitlementFromRows`, `isWithinLimit`

- [ ] **Step 1: Écrire les tests** dans `tests/unit/plans-entitlements.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import {
  assertKnownEntitlementKey,
  PLAN_ENTITLEMENT_KEYS,
} from "@/features/plans/lib/entitlement-registry";
import {
  isWithinLimit,
  resolveEntitlementFromRows,
} from "@/features/plans/lib/entitlement-resolve";

describe("plan entitlements", () => {
  it("rejects unknown keys", () => {
    expect(() => assertKnownEntitlementKey("nope")).toThrow();
  });

  it("enabled false → inaccessible", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: false, limit: 10, value: null }],
      "trips.max",
    );
    expect(e.enabled).toBe(false);
  });

  it("enabled true limit null → unlimited", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: true, limit: null, value: null }],
      "trips.max",
    );
    expect(isWithinLimit(999, e)).toBe(true);
  });

  it("numeric limit reached", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: true, limit: 2, value: null }],
      "trips.max",
    );
    expect(isWithinLimit(2, e)).toBe(false);
    expect(isWithinLimit(1, e)).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm run test:run -- tests/unit/plans-entitlements.test.ts
```

- [ ] **Step 3: Implémenter registry + resolve** (clés exactes de la spec §8 ; `isWithinLimit` : si `!enabled` → false ; si `limit == null` → true ; sinon `usage < limit`).

- [ ] **Step 4: Run — expect PASS**

```bash
npm run test:run -- tests/unit/plans-entitlements.test.ts
```

---

### Task 3: Services Stripe product / price

**Files:**
- Create: `src/services/stripe/product-service.ts`
- Create: `src/services/stripe/price-service.ts`
- Modify: `src/services/stripe/index.ts`
- Test: `tests/unit/plans-stripe-products.test.ts`

**Interfaces:**
- Consumes: `getStripeClient`, `getStripeMode`, `assertModeConsistency`
- Produces:
  - `createSebavioProduct(input: { name, description?, planId, idempotencyKey })`
  - `archiveStripeProduct(productId: string)`
  - `createSebavioPrice(input: { productId, unitAmount, currency, interval, intervalCount, idempotencyKey })`
  - `deactivateStripePrice(priceId: string)`
  - `listSebavioProducts()` — filtre metadata
  - `listPricesForProduct(productId: string)`

- [ ] **Step 1: Tests avec `vi.mock` du module client** — mock `products.create` / `prices.create` ; vérifier metadata `sebavio_app`, `sebavio_stripe_mode`, idempotencyKey passé ; vérifier `assertModeConsistency` appelé sur retrieve.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implémenter services** — metadata obligatoire à la création ; `recurring: { interval, interval_count }` ; ne jamais passer `unit_amount` à un update.

- [ ] **Step 4: Run — PASS** + export barrel.

---

### Task 4: Schemas Zod + comptage abonnés

**Files:**
- Create: `src/features/plans/lib/schemas.ts`
- Create: `src/features/plans/lib/subscriber-counts.ts`
- Test: `tests/unit/plans-schemas.test.ts`, `tests/unit/plans-subscriber-counts.test.ts`

**Interfaces:**
- Produces: `createPlanSchema`, `updatePlanMetadataSchema`, `setEntitlementsSchema`, `createPlanPriceSchema`, `archivePlanSchema`, `applyPlanSyncSchema`
- Produces: `countActiveSubscribersForPlan(planId): Promise<{ active, canceled, estimatedMonthlyRevenueCents }>`

Règles comptage (spec §9) :
1. Charger prices du plan + `stripeProductId` + `stripeMode`
2. `StripeSubscription` où `stripeMode` match et status ∈ `active|trialing|past_due`
3. Match `stripePriceId` IN ids **OU** (`stripePriceId` null AND `stripeProductId` = product)

- [ ] **Step 1: Tests schemas** — reject montant ≤ 0 ; reject clé entitlement inconnue ; currency défaut `cad`.

- [ ] **Step 2: Tests counts** — mock Prisma : match par price_id ; fallback product_id ; filtre mode ; plan hidden compte toujours.

- [ ] **Step 3: Implémenter + PASS**

---

### Task 5: Création forfait + échec partiel

**Files:**
- Create: `src/features/plans/services/plan-crud.ts` (create + reconcile)
- Test: `tests/unit/plans-create.test.ts`

**Interfaces:**
- Produces: `createPlan(input, actor): Promise<{ planId }>`
- Produces: `reconcilePlan(planId, actor): Promise<{ status }>`

Séquence stricte spec §11 (ligne locale UUID d’abord → metadata `sebavio_plan_id` dès products.create → pas de `sebavio_pending` → toute erreur après insert local → `pending_reconciliation` + même idempotency keys au retry). Mock Stripe + Prisma.

- [ ] **Step 1: Test succès** — product + 2 prices (month/year) + entitlements + status `active` + audit.

- [ ] **Step 2: Test échec partiel** — `prices.create` throw après product OK → plan `pending_reconciliation` + `reconciliationError` + audit `PLAN_CREATE_PARTIAL_FAILURE`.

- [ ] **Step 3: Test idempotence clés** — vérifier format `plan-create:{planId}:product` et `plan-create:{planId}:price:month:1:cad`.

- [ ] **Step 4: Implémenter + PASS**

---

### Task 6: Prix courant, metadata, hide/archive, entitlements set

**Files:**
- Create: `src/features/plans/services/plan-prices.ts`
- Extend: `src/features/plans/services/plan-crud.ts` (updateMetadata, hide, archive, duplicate)
- Create: `src/features/plans/services/plan-entitlements.ts`
- Test: `tests/unit/plans-prices.test.ts`, `tests/unit/plans-lifecycle.test.ts`

**Interfaces:**
- Produces: `createNewPlanPrice(...)` — crée Stripe price, transaction : ancien `is_current=false`, nouveau `is_current=true`, option archive Stripe ancien
- Produces: `updatePlanMetadata`, `hidePlan`, `archivePlan`, `duplicatePlan`, `setPlanEntitlements`

Invariants tests :
- Un seul `is_current` après nouveau prix
- Abonnements mockés non modifiés (aucune update `StripeSubscription`)
- Archive refuse si `archiveStripeProduct` false → pas d’appel `products.update`
- Archive avec confirm → Stripe product `active: false`

- [ ] **Step 1: Tests FAIL puis implémentation PASS**

---

### Task 7: Synchronisation preview / apply

**Files:**
- Create: `src/features/plans/services/plan-sync.ts`
- Test: `tests/unit/plans-sync.test.ts`

**Interfaces:**
- Produces: `previewPlanSync(): Promise<PlanSyncReport>`
- Produces: `applyPlanSync(input: { syncRunId, confirmedActions }): Promise<ApplyResult>`

Règles :
- Filtrer produits `metadata.sebavio_app === "sebavio"` + mode
- Preview idempotente (2 appels → mêmes catégories / mêmes ids)
- Apply sans action `set_current` / `archive_price` dans payload → aucune bascule
- Apply ne touche jamais `PlanEntitlement`
- Import : jamais `isCurrent=true` automatique ; plans importés `hidden` ou `pending_reconciliation`
- Idempotence durable via `PlanSyncAction` unique `(syncRunId, actionKey)` — pas mémoire processus
- Pas de duplication si re-apply même `syncRunId`+`actionKey`

- [ ] **Step 1: Tests détection incohérences + no-dup + entitlements inchangés**

- [ ] **Step 2: Implémenter + PASS**

---

### Task 8: Queries + Server Actions + permissions

**Files:**
- Create: `src/features/plans/services/plan-queries.ts`
- Create: `src/features/plans/actions/index.ts` (ou fichiers par action)
- Create: `src/features/plans/index.ts`
- Test: `tests/unit/plans-permissions.test.ts`

**Interfaces:**
- Chaque action : `requirePermission` puis service
- Audit sur mutations avec `oldValue`/`newValue`/`stripeMode`/`syncRunId`

- [ ] **Step 1: Tests** — mock `requirePermission` : `plans.read` insuffisant pour `createPlanAction` ; `plans.manage` OK.

- [ ] **Step 2: Implémenter actions listées spec §13.2 + PASS**

---

### Task 9: UI liste `/admin/plans`

**Files:**
- Replace: `src/app/admin/plans/page.tsx`
- Create: `src/features/plans/components/plans-page-header.tsx`
- Create: `src/features/plans/components/plans-grid.tsx`
- Create: `src/features/plans/components/plan-status-badge.tsx`
- Create: `src/features/plans/components/sync-plans-dialog.tsx`
- Modify: `src/features/admin/constants.ts` → `available: true` pour `/admin/plans`

- [ ] **Step 1: Page server** — `requirePermission("plans.read")`, badge mode (`StripeModeBadge` / `getConfiguredStripeMode`), titre « Forfaits », boutons Créer + Synchroniser.

- [ ] **Step 2: Cartes** — nom, description courte, statut, prix month/year courants, abonnés actifs, badge Populaire, product id technique secondaire, `lastSyncedAt`, warning incohérence.

- [ ] **Step 3: Dialog sync** — preview puis confirmation apply.

- [ ] **Step 4: `npm run build`** — OK ; redémarrer process dev si besoin.

---

### Task 10: UI création + détail + sous-pages

**Files:**
- Create: `src/app/admin/plans/new/page.tsx`
- Create: `src/app/admin/plans/[id]/page.tsx`
- Create: `src/app/admin/plans/[id]/edit/page.tsx`
- Create: `src/app/admin/plans/[id]/entitlements/page.tsx`
- Create: `src/app/admin/plans/[id]/prices/page.tsx`
- Create: components formulaires (FormSection, Switch, etc.)

Contenu détail `[id]` :
- Infos générales, prix actifs / anciens, entitlements, limites
- Compteurs abonnés actifs / annulés, revenu mensuel estimé
- Historique audit (`entity=plan`, `entityId`)
- Onglet Abonnés → liens `/admin/users/[userId]`
- Warning si abonnés actifs > 0 (texte spec)

Prix UI : expliquer nouveau Price Stripe ; checkbox archiver ancien pour nouveaux ; warning pas de migration auto.

- [ ] **Step 1: Implémenter pages + formulaires FR**

- [ ] **Step 2: Build + smoke manuel checklist spec §19 (mode test)**

---

### Task 11: Doc phase + suite de tests complète + verdict

**Files:**
- Create: `docs/admin/phase-4-forfaits.md` (résumé architecture, migrations, procédure test)
- Ensure: tous les `tests/unit/plans-*.test.ts` couvrent la matrice spec §17

- [x] **Step 1: Lancer**

```bash
source ~/.nvm/nvm.sh && nvm use && cd /var/www/sebavio.com
npm run test:run -- tests/unit/plans-*.test.ts
# Si le glob n'est pas expandé par npm, lancer la suite Vitest complète :
# npm run test:run
npm run typecheck
npm run lint
npm run build
```

Expected: suite plans verte ; typecheck/build OK. Lint global peut rester rouge hors Phase 4 (distinguer).

- [x] **Step 2: Rédiger le livrable final** (architecture, modèles, routes, composants, sécurité, tests, migrations, env, limites, verdict GO / GO SOUS RÉSERVE / NO-GO).

- [x] **Step 3: Ne pas committer / pusher** sauf demande explicite de l’utilisateur.

---

## Spec coverage checklist (self-review)

| Spec section | Task |
|--------------|------|
| Schéma + index partiel + CHECK + PlanSync* | T1 |
| Entitlements registry + sémantique | T2 |
| Stripe products/prices | T3 |
| Zod + compteurs abonnés | T4 |
| Création + partial failure + reconcile | T5 |
| Nouveau prix / hide / archive / entitlements | T6 |
| Sync preview/apply | T7 |
| Actions + permissions | T8 |
| UI liste + nav | T9 |
| UI CRUD détail | T10 |
| Tests matrice + doc + verdict | T11 |
| Pas de stats/IA | respecté (hors plan) |
| `defaultTrialDays` sur Plan | T1 + T5 + formulaire T10 |
| Metadata `sebavio_*` | T3 + T5 + T7 |

## Placeholder scan

Aucun TBD volontaire. Les steps « Commit » sont **optionnels** et soumis à demande utilisateur (contrainte globale).
