# Phase 4 — Admin Forfaits

Date : 2026-07-20
Statut : livré (développement Contabo)
Réf. : `docs/superpowers/specs/2026-07-20-admin-plans-design.md`, plan `docs/superpowers/plans/2026-07-20-admin-plans.md`

## Objectif

Remplacer le stub `/admin/plans` (« bientôt ») par une gestion centralisée, sécurisée et auditable des forfaits Sebavio :

| Source de vérité | Responsabilité |
|------------------|----------------|
| **Stripe** | Produit, prix, devise, montant, périodicité, actif/archivé Stripe |
| **PostgreSQL** | Noms commerciaux, descriptions, ordre, mise en avant, entitlements, `is_current`, sync |

Hors scope : stats admin, IA, migration automatique des abonnements vers un nouveau prix, Checkout branché sur `defaultTrialDays`, webhooks `product.*` / `price.*` obligatoires.

## Architecture

```
Admin UI (/admin/plans*)
        ↓ Server Actions (Zod + requirePermission)
        ↓ src/features/plans
        ├── services (CRUD, prix, entitlements, sync, queries)
        ├── lib (schemas Zod, registry entitlements, compteurs)
        └── components (liste, formulaires, sync dialog)
                ↓
        src/services/stripe (product-service, price-service, sebavio-metadata)
                ↓
        Prisma: Plan ↔ PlanPrice ↔ PlanEntitlement
                PlanSyncRun / PlanSyncAction
        Abonnés: StripeSubscription (price_id / product_id + stripe_mode)
```

- Client Stripe unique : `getStripeClient()` / `getStripeMode()` (`test` | `live`).
- Mode toujours dérivé serveur — jamais accepté du client.
- Métadonnées produit : `sebavio_app`, `sebavio_plan_id`, `sebavio_stripe_mode`.
- Audit : `writeAdminAuditLog` (entité `plan` / `plan_price` / `plan_entitlement` / `plan_sync`).

## Modèles Prisma (migration)

Migration : `prisma/migrations/20260720121243_plans_phase4/`

| Modèle | Rôle |
|--------|------|
| `Plan` | Forfait commercial + lien `stripeProductId` + `stripeMode` |
| `PlanPrice` | Miroir Price Stripe ; `isCurrent` ; unicité `(stripePriceId, stripeMode)` |
| `PlanEntitlement` | Clés registre + enabled / limit / value |
| `PlanSyncRun` | Preview / apply sync |
| `PlanSyncAction` | Idempotence `(syncRunId, actionKey)` |

Index partiel SQL : un seul `is_current` par `(planId, interval, intervalCount, currency)`.

## Routes Admin

| Route | Permission | Rôle |
|-------|------------|------|
| `/admin/plans` | `plans.read` | Liste + sync preview/apply |
| `/admin/plans/new` | `plans.manage` | Création |
| `/admin/plans/[id]` | `plans.read` | Détail + lifecycle (manage) |
| `/admin/plans/[id]/edit` | `plans.manage` | Métadonnées |
| `/admin/plans/[id]/entitlements` | `plans.manage` | Entitlements par catégories FR |
| `/admin/plans/[id]/prices` | `plans.manage` | Nouveau tarif (`operationId` UUID) |

Nav : `ADMIN_NAV_ITEMS` → Forfaits `available: true`.

## Permissions

| Action | Permission |
|--------|------------|
| Liste, détail, preview sync, lecture abonnés | `plans.read` |
| Créer, modifier, prix, entitlements, hide, archive, duplicate, apply sync, reconcile | `plans.manage` |

- `billing_admin` : `plans.read` seulement
- `admin` / `super_admin` : `plans.manage`
- Contrôle serveur uniquement (`requirePermission`) — jamais se fier à l’UI.

## Composants principaux

- `PlansPageHeader`, `PlansGrid`, `PlanStatusBadge`, `SyncPlansDialog`
- `CreatePlanForm`, `EditPlanForm`, `PlanEntitlementsForm`, `CreatePlanPriceForm`
- `PlanLifecycleActions` (Masquer / Archiver / Dupliquer / Réconcilier)
- Réutilise Phase 3 : `PageHeader`, `StripeModeBadge`, `CopyableStripeId`, Dialog shadcn

## Variables d’environnement

Aucune variable nouvelle obligatoire. Réutilise :

```env
STRIPE_SECRET_KEY=          # serveur uniquement (jamais NEXT_PUBLIC_*)
STRIPE_WEBHOOK_SECRET=
STRIPE_MODE=test            # test | live explicite
STRIPE_DASHBOARD_ACCOUNT_ID=
```

URL admin développement : `http://localhost:3050`.

## Procédure de vérification (mode test)

1. `STRIPE_MODE=test` + clé `sk_test_…`
2. Admin `admin`/`super_admin` → `/admin/plans` (badge Test)
3. Créer forfait mensuel + annuel CAD ; vérifier Dashboard Stripe test + metadata `sebavio_*`
4. Modifier description ; pas de nouveau Price
5. Nouveau tarif mensuel ; ancien price conservé pour éventuels abonnés ; un seul `is_current`
6. Preview sync → apply confirmé (cases cochées uniquement)
7. Masquer → statut `hidden` ; abonnés toujours comptés
8. Échec partiel → `pending_reconciliation` + bouton Réconcilier

## Migrations à appliquer

| Environnement | Action |
|---------------|--------|
| **développement** (Contabo) | Déjà appliquée (`migrate status` : up to date) |
| **préproduction / production** | `npx prisma migrate deploy` puis build + `pm2 restart sebavio` |

Ne jamais exécuter de migrations production sans validation explicite.

## Sécurité

- Pas de secret Stripe côté client ; redaction `sk_*` / `rk_*` / `whsec_*` dans les erreurs actions
- Isolation stricte `test` | `live` (requêtes filtrées + asserts mode)
- Aucun test destructif contre Stripe live pendant la Phase 4
- Archivage Plan irréversible en UI Phase 4 ; archivage Stripe produit uniquement si case cochée

## Limites restantes

- Pas de migration automatique des abonnements vers un nouveau prix
- Pas de table `stripe_subscription_items` (multi-items)
- Pas de Checkout / Customer Portal branchés sur `defaultTrialDays`
- Pas de webhooks `product.*` / `price.*` (sync manuelle admin)
- Pas de stats / IA admin
- Pages détail : historique audit limité (30 derniers) ; liste abonnés limitée (100)

## Tests Phase 4

Suite ciblée : `tests/unit/plans-*.test.ts` — **141 tests PASS** (9 fichiers).

Couverture : entitlements, schemas, Stripe products/prices, création/reconcile, lifecycle, sync, permissions/actions, compteurs abonnés.

## Verdict

**GO SOUS RÉSERVE** (2026-07-20, environnement développement Contabo).

- Phase 4 livrée et vérifiée (141 tests `plans-*`, typecheck, build, smoke Admin mode test).
- Réserves : échecs/lint préexistants hors Phase 4 ; migration à appliquer en préprod/prod.
