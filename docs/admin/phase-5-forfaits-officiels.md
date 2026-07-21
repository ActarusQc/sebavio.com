# Phase 5 — Forfaits officiels & Pass 30 jours

Date : 2026-07-20  
Statut : développement Contabo (Stripe **test** uniquement)

## Forfaits officiels

| Slug | Nom public | Type | Prix | Protection système |
|------|------------|------|------|--------------------|
| `decouverte` | Découverte | Gratuit (sans produit Stripe) | — | Oui |
| `pass-30-jours` | Pass 30 jours | Paiement unique (`one_time`) | 12,99 CAD | Oui |
| `sebavio-plus` | Sebavio Plus | Abonnement annuel (`recurring`) | 69,99 CAD / an | Oui |

Seed idempotent : `npm run prisma:seed:official-plans` (mode `STRIPE_MODE=test` obligatoire).

## Règles Pass 30 jours

- Fenêtre d’accès : **exactement +30 jours UTC** à partir de la confirmation de paiement.
- Prolongation (nouvel achat ou admin) : **empilement** sur `endsAt` si le Pass est encore valide ; sinon repart de `now`.
- Activation idempotente via `activationStripeEventId` / `lastExtensionEventId`.
- Priorité d’accès : **admin > Sebavio Plus > Pass > Découverte**.
- Admin : liste `/admin/passes`, détail avec révocation et prolongation (permission `plans.manage`, motif obligatoire).

## Règles de suppression de forfait

- Suppression définitive (`deletePlanHard`) **uniquement en mode Stripe test**.
- Bloquée s’il existe des abonnements Stripe, des `PlanPurchase` ou des `PlanAccessGrant`.
- Confirmation du **nom public exact** (`confirmPublicName`).
- Forfaits `isSystemProtected` : exigent aussi `confirmSystemDelete`.
- En test : désactivation des prix Stripe + archivage du produit, puis hard-delete local (entitlements, prices, plan).
- Hors test ou avec historique : archiver le forfait plutôt que supprimer.

## Références

- Spec Phase 4 : `docs/admin/phase-4-forfaits.md`
- Plan : `docs/superpowers/plans/2026-07-20-official-plans-pass-delete.md`
- Services : `src/features/subscriptions/services/pass-access.ts`, `pass-admin.ts`, `src/features/plans/services/plan-delete.ts`
