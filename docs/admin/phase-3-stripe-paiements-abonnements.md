# Phase 3 — Stripe, paiements et abonnements

## Objectif

Intégration Stripe (source de vérité financière) avec projection PostgreSQL pour l’administration Sebavio : abonnements, paiements, factures, remboursements, webhooks, synchronisation manuelle.

Hors scope (Phase 4+) : forfaits / prix, entitlements, coupons, portail client, MRR/ARR, IA.

## Architecture

```
Stripe API  ←→  src/services/stripe/*  ←→  PostgreSQL (projection)
                      ↑
              /api/webhooks/stripe
                      ↑
         src/features/billing (admin UI + actions)
```

| Couche | Emplacement |
|--------|-------------|
| Client SDK | `src/services/stripe/client.ts` (`server-only`) |
| Config Test/Live | `src/services/stripe/config.ts` |
| Sync | `src/services/stripe/sync-service.ts` |
| Webhook | `src/services/stripe/webhook-service.ts` + `src/app/api/webhooks/stripe` |
| Admin | `src/features/billing/*`, pages `/admin/subscriptions|payments|invoices|webhooks/stripe` |

- SDK : `stripe@22.3.0`
- Version API : `2026-06-24.dahlia`

## Variables d’environnement

```env
STRIPE_SECRET_KEY=          # serveur uniquement
STRIPE_WEBHOOK_SECRET=      # serveur uniquement
STRIPE_MODE=test            # explicite : test | live (jamais déduit seul)
STRIPE_DASHBOARD_ACCOUNT_ID=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # non requis Phase 3
```

Exigences :

- `STRIPE_MODE` obligatoire et cohérent avec le préfixe `sk_test_` / `sk_live_`
- aucun secret dans logs, réponses API, props client, `.env.example`
- badge Test/Live visible en admin ; confirmations renforcées en Live

## Périodes d’abonnement (Basil → Dahlia)

Depuis `2025-03-31.basil`, `current_period_start` / `current_period_end` ne sont plus sur `Subscription` mais sur chaque `SubscriptionItem`. Sebavio lit ces champs via `getSubscriptionPeriod()` (min start / max end). La facture lie l’abonnement via `invoice.parent.subscription_details.subscription` (plus `invoice.subscription`).

| | Test | Live |
|---|------|------|
| Clé | `sk_test_…` | `sk_live_…` |
| Dashboard | `/test/…` | racine |
| Confirmation annulation | facultative | `ANNULER email` |
| Confirmation remboursement | facultative | `REMBOURSER montant DEVISE` |

Les projections locales portent `stripe_mode` : jamais mélanger Test et Live.

## Webhook

Endpoint : `POST /api/webhooks/stripe`

1. Lire le corps **brut**
2. Vérifier `Stripe-Signature` (`constructEvent`)
3. Claim idempotent (`stripe_event_id` + `stripe_mode`)
4. Traiter → sync objet depuis Stripe (pas seulement le payload)
5. Marquer `processed` / `ignored` / `failed`

Événements gérés (autres → `ignored`) :

- `customer.*`
- `customer.subscription.*` (created/updated/deleted/paused/resumed)
- `invoice.*` (created/finalized/paid/payment_failed/payment_action_required/voided/marked_uncollectible)
- `payment_intent.*`
- `charge.refunded`, `refund.*`
- `checkout.session.*` (completed / async_payment_*)

### Configuration Dashboard

1. Developers → Webhooks → Add endpoint  
2. URL : `https://<hôte>/api/webhooks/stripe` (dev : tunnel HTTPS vers le port 3050)  
3. Sélectionner les événements listés ci-dessus  
4. Copier le **signing secret** → `STRIPE_WEBHOOK_SECRET`  
5. Mode Test distinct du mode Live (secrets séparés)

## Modèle de données

Tables : `stripe_customers`, `stripe_subscriptions`, `stripe_payments`, `stripe_invoices`, `stripe_refunds`, `stripe_webhook_events`

Migration : `prisma/migrations/20260719160000_admin_phase3_stripe_billing`

Pas de payload webhook complet stocké : `payload_hash` SHA-256 uniquement.

## Idempotence & hors-ordre

- Unique `(stripe_event_id, stripe_mode)` ; doublon déjà traité → HTTP 200
- Verrou `processing` pour éviter les courses
- Sync : récupère l’objet **actuel** Stripe ; compare `event.created` / `stripe_updated_at` pour ne pas écraser un état plus récent

## Synchronisation manuelle

Actions admin (`billing.sync`) : client, abonnement, paiement, facture, utilisateur.

Future réconciliation périodique (non implantée) : job quotidien listant les abonnements `active|past_due` Stripe vs PG et signalant les divergences.

## Annulation / reprise / remboursement

- Fin de période / immédiat → API Stripe puis sync + audit  
- Reprise uniquement si `cancel_at_period_end`  
- Remboursement : recalcul remboursable depuis Stripe, clé d’idempotence, sync paiement + refund, audit succès/échec  
- Jamais de succès UI avant confirmation Stripe

## Permissions RBAC

Voir `src/lib/rbac/permissions.ts` :

- SUPPORT : `billing.read` (résumé)
- BILLING_ADMIN / ADMIN / SUPER_ADMIN : permissions granulaires (`billing.subscriptions.*`, `billing.refunds.*`, `billing.webhooks.*`, `billing.export`, …)
- ANALYST : pas de données nominatives

## Audit

Actions `STRIPE_*` via `writeAdminAuditLog` (acteur, rôle, cible, motif, mode, montants, requestId).

## Diagnostic webhooks

`/admin/webhooks/stripe` — filtres, relance (`billing.webhooks.retry`), sync objet associé. Jamais de secret ni payload brut.

## Sécurité

- SDK Stripe uniquement serveur  
- Montants en cents  
- Messages d’erreur nettoyés (`sanitizeStripeMessage`)  
- Liens Dashboard centralisés (`buildDashboardUrl`)

## Déploiement

1. Renseigner les variables env (mode test d’abord)  
2. `npx prisma migrate deploy`  
3. Build + restart PM2 `sebavio`  
4. Configurer le webhook Test  
5. Vérifier réception d’un événement dans `/admin/webhooks/stripe`

## Retour arrière

1. Désactiver l’endpoint webhook dans Stripe  
2. Retirer les variables ou `STRIPE_MODE`  
3. Les tables projection peuvent rester (non destructif) ; ne pas dropper sans backup

## Rotation secret webhook

1. Créer un nouveau secret / endpoint dans Stripe  
2. Mettre à jour `STRIPE_WEBHOOK_SECRET`  
3. Redémarrer l’app  
4. Supprimer l’ancien secret après validation

## Vérification mode Test

Checklist : client → webhook signé → idempotence → sync sub/payment/invoice → pages admin → cancel/resume → refund partiel → audit → retry webhook → refus rôle insuffisant → absence de secrets dans le navigateur.

Ne jamais valider avec des actions Live.
