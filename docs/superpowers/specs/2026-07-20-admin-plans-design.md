# Spécification — Admin Forfaits (Phase 4)

Date: 2026-07-20
Statut: **livré** (Tasks 1–11 exécutées en développement Contabo)
Réf.: Phase 3 Stripe (`docs/admin/phase-3-stripe-paiements-abonnements.md`), RBAC `plans.read` / `plans.manage`
Doc livrable : `docs/admin/phase-4-forfaits.md`

## 1. Objectif

Remplacer le stub `/admin/plans` (« bientôt ») par une gestion centralisée, sécurisée et auditable des forfaits Sebavio, avec séparation claire des responsabilités :

| Source de vérité | Responsabilité |
|------------------|----------------|
| **Stripe** | Produit, prix, devise, montant, périodicité (`interval` + `interval_count`), état actif/archivé côté Stripe, `product_id` / `price_id` |
| **PostgreSQL Sebavio** | Noms commerciaux, descriptions, ordre d’affichage, mise en avant, entitlements / limites, disponibilité nouveaux clients, règles d’accès, métadonnées Sebavio, pointeur « prix courant » |

**Hors scope :** sections Admin Statistiques et Intelligence artificielle ; migration massive automatique des abonnements existants vers un nouveau prix.

## 2. Architecture retenue

```
Admin UI (/admin/plans*)
        ↓ Server Actions (Zod + requirePermission)
        ↓ features/plans (domaine)
        ├── services métier (CRUD, entitlements, sync preview/apply)
        ├── registry entitlements typé
        └── audit (writeAdminAuditLog)
                ↓
        services/stripe (client unique existant)
        ├── products / prices (création, archive, list filtrée)
        └── assertModeConsistency (test | live)
                ↓
        Prisma: Plan ↔ PlanPrice ↔ PlanEntitlement
        Abonnés: StripeSubscription (price_id / product_id + stripe_mode)
```

Conventions projet réutilisées :

- Mode Stripe : `test` | `live` (`getStripeMode()`, jamais déduit seul du préfixe de clé).
- Client : `getStripeClient()` — **aucun second client**.
- Auth : `requirePermission("plans.read" | "plans.manage")` + rôle PostgreSQL.
- Audit : `writeAdminAuditLog` (`src/features/admin/services/audit-write.ts`).
- UI : patterns Phase 3 (`PageHeader`, `StripeModeBadge`, Dialog + Server Actions, `CopyableStripeId`).

## 3. Schéma Prisma proposé

### 3.1 Modèle `Plan`

```prisma
/// Forfait commercial Sebavio (métadonnées locales + lien produit Stripe).
model Plan {
  id                 String    @id @default(uuid(4)) @db.Uuid
  /// Clé interne stable (slug) — unique par mode
  internalName       String    @map("internal_name") @db.VarChar(100)
  /// Nom affiché aux utilisateurs
  publicName         String    @map("public_name") @db.VarChar(150)
  shortDescription   String?   @map("short_description") @db.VarChar(500)
  fullDescription    String?   @map("full_description") @db.Text
  displayOrder       Int       @default(0) @map("display_order")
  isFeatured         Boolean   @default(false) @map("is_featured")
  /// Visible sur les écrans d’inscription / pricing publics
  isVisibleOnSignup  Boolean   @default(true) @map("is_visible_on_signup")
  /// active | hidden | archived | pending_reconciliation
  status             String    @db.VarChar(40)
  archivedAt         DateTime? @map("archived_at") @db.Timestamptz(6)
  /// Essai commercial (jours) — appliqué à Checkout / création d’abonnement, PAS une propriété Price Stripe
  defaultTrialDays   Int?      @map("default_trial_days")
  stripeProductId    String?   @map("stripe_product_id") @db.VarChar(255)
  /// test | live — aligné sur StripeMode projet
  stripeMode         String    @map("stripe_mode") @db.VarChar(10)
  lastSyncedAt       DateTime? @map("last_synced_at") @db.Timestamptz(6)
  /// Dernière erreur de réconciliation (message sûr, sans secrets)
  reconciliationError String?  @map("reconciliation_error") @db.Text
  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  prices       PlanPrice[]
  entitlements PlanEntitlement[]

  @@unique([stripeProductId, stripeMode])
  @@unique([internalName, stripeMode])
  @@index([status])
  @@index([stripeMode])
  @@index([displayOrder])
  @@index([isVisibleOnSignup])
  @@map("plans")
}
```

**Pas de `deleted_at`** sur `Plan` : l’archivage est porté par `status = archived` + `archived_at`. Aucune suppression physique d’un forfait lié à des abonnements ou à un historique financier.

Contraintes SQL (migration) : `default_trial_days IS NULL OR >= 0` ; `status IN (...)` ; `stripe_mode IN ('test','live')`.

### 3.2 Modèle `PlanPrice`

```prisma
/// Miroir local d’un Price Stripe (immuable en montant une fois créé).
model PlanPrice {
  id              String    @id @default(uuid(4)) @db.Uuid
  planId          String    @map("plan_id") @db.Uuid
  stripePriceId   String    @map("stripe_price_id") @db.VarChar(255)
  /// day | week | month | year (UI Phase 4 : month | year)
  interval        String    @db.VarChar(20)
  /// Nombre d’intervalles (ex. 1 = mensuel, 1 annuel ; extensible)
  intervalCount   Int       @default(1) @map("interval_count")
  currency        String    @db.VarChar(10)
  /// Montant en cents (source Stripe)
  unitAmount      Int       @map("unit_amount")
  /// active | archived (miroir / décision Sebavio pour nouveaux abonnés)
  status          String    @db.VarChar(20)
  /// Un seul true par (planId, interval, intervalCount, currency) — index partiel SQL
  isCurrent       Boolean   @default(false) @map("is_current")
  stripeMode      String    @map("stripe_mode") @db.VarChar(10)
  archivedAt      DateTime? @map("archived_at") @db.Timestamptz(6)
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  plan Plan @relation(fields: [planId], references: [id], onDelete: Restrict)

  @@unique([stripePriceId, stripeMode])
  @@index([planId])
  @@index([stripeMode])
  @@index([status])
  @@index([planId, interval, intervalCount, currency])
  @@map("plan_prices")
}
```

Index et contraintes SQL additionnels (migration raw) :

```sql
CREATE UNIQUE INDEX plan_prices_one_current_per_interval
  ON plan_prices (plan_id, interval, interval_count, currency)
  WHERE is_current = true;

ALTER TABLE plan_prices
  ADD CONSTRAINT plan_prices_interval_count_positive
  CHECK (interval_count > 0);

ALTER TABLE plan_prices
  ADD CONSTRAINT plan_prices_unit_amount_non_negative
  CHECK (unit_amount >= 0);

-- status IN ('active','archived') ; stripe_mode IN ('test','live')
```

### 3.3 Modèle `PlanEntitlement`

```prisma
model PlanEntitlement {
  id        String   @id @default(uuid(4)) @db.Uuid
  planId    String   @map("plan_id") @db.Uuid
  /// Clé du registre typé uniquement
  key       String   @db.VarChar(100)
  enabled   Boolean  @default(false)
  /// null = illimité si enabled ; sinon limite numérique (>= 0)
  limit     Int?
  /// Valeur libre optionnelle (ex. niveau support)
  value     String?  @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  plan Plan @relation(fields: [planId], references: [id], onDelete: Restrict)

  @@unique([planId, key])
  @@index([key])
  @@map("plan_entitlements")
}
```

Contrainte SQL : `"limit" IS NULL OR "limit" >= 0`.

### 3.4 Persistance sync (`PlanSyncRun` / `PlanSyncAction`)

Idempotence durable de `applyPlanSync` — **pas** en mémoire processus ni via seuls audit logs.

```prisma
model PlanSyncRun {
  id          String    @id @default(uuid(4)) @db.Uuid
  stripeMode  String    @map("stripe_mode") @db.VarChar(10)
  /// preview | applying | completed | failed
  status      String    @db.VarChar(30)
  report      Json?     @db.JsonB
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  completedAt DateTime? @map("completed_at") @db.Timestamptz(6)

  actions PlanSyncAction[]

  @@index([stripeMode])
  @@index([status])
  @@map("plan_sync_runs")
}

model PlanSyncAction {
  id         String   @id @default(uuid(4)) @db.Uuid
  syncRunId  String   @map("sync_run_id") @db.Uuid
  actionKey  String   @map("action_key") @db.VarChar(255)
  actionType String   @map("action_type") @db.VarChar(50)
  /// pending | applied | skipped | failed
  status     String   @db.VarChar(30)
  payload    Json?    @db.JsonB
  result     Json?    @db.JsonB
  error      String?  @db.Text
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  syncRun PlanSyncRun @relation(fields: [syncRunId], references: [id], onDelete: Restrict)

  @@unique([syncRunId, actionKey])
  @@index([status])
  @@map("plan_sync_actions")
}
```

### 3.5 Relation User

Aucune FK User → Plan obligatoire en Phase 4. Les abonnements restent des projections `StripeSubscription`. Option future : `planId` dénormalisé — hors scope.

## 4. Contraintes et index (récap)

| Objet | Contrainte |
|-------|------------|
| `plans` | `@@unique([stripeProductId, stripeMode])` (nullable product : plusieurs NULL OK en PostgreSQL) |
| `plans` | `@@unique([internalName, stripeMode])` |
| `plan_prices` | `@@unique([stripePriceId, stripeMode])` — isolation explicite test/live |
| `plan_prices` | Index partiel unique `is_current` sur `(plan_id, interval, interval_count, currency)` |
| `plan_entitlements` | `@@unique([planId, key])` |
| `plan_sync_actions` | `@@unique([syncRunId, actionKey])` |
| CHECK | `default_trial_days`, `interval_count`, `unit_amount`, `limit`, statuts, `stripe_mode` |
| Tous | Index `stripe_mode` ; plans indexés par `status`, `display_order` |

**Note PostgreSQL :** plusieurs `NULL` dans `stripe_product_id` sont autorisés pour `@@unique([stripeProductId, stripeMode])` — utile pour `pending_reconciliation` avant rattachement.

**Convention statut/mode :** le projet Phase 3 utilise des `String` + commentaires (pas d’enums Prisma). Phase 4 conserve ce pattern et ajoute des **CHECK SQL** pour les valeurs autorisées.

## 5. Invariants métier

1. **Immutabilité Price** : jamais `stripe.prices.update` sur `unit_amount` / `currency` / `recurring`. Changement de tarif = nouveau Price Stripe + bascule `is_current` + archivage optionnel de l’ancien pour *nouveaux* abonnés.
2. **Un seul prix courant** par `(planId, interval, intervalCount, currency)` avec `is_current = true` (garanti service + index partiel).
3. **Anciens prix** peuvent rester `active` côté Stripe (abonnés existants) tout en ayant `is_current = false` localement.
4. **Cohérence de mode** : `plan.stripeMode === planPrice.stripeMode === getStripeMode()` ; objets Stripe `livemode` vérifiés via `assertModeConsistency`. Interdit de lier un objet test à un forfait live (et inverse).
5. **Métadonnées Stripe produit** (identification Sebavio) :
   - `sebavio_app = "sebavio"`
   - `sebavio_plan_id = <uuid Plan>` — toujours présent dès `products.create` (la ligne locale UUID est créée **avant** tout appel Stripe)
   - `sebavio_stripe_mode = "test" | "live"`
   - **Pas** de metadata `sebavio_pending`
6. **Entitlements** :
   - `enabled = false` → fonctionnalité inaccessible (ignore `limit` / `value` pour l’accès).
   - `enabled = true` et `limit = null` → actif, illimité.
   - `enabled = true` et `limit >= 0` → limite appliquée.
   - Clés **uniquement** depuis le registre typé `PLAN_ENTITLEMENT_KEYS`.
7. **Essai** : `defaultTrialDays` sur `Plan` uniquement ; appliqué à Checkout / subscription create (Phase ultérieure checkout) — pas stocké sur `PlanPrice`.
8. **Pas de suppression physique** d’un Plan ayant au moins un `PlanPrice` ou un abonné lié (par price/product + mode).
9. **Sync** ne modifie jamais les entitlements ; ne définit **jamais** automatiquement `is_current=true` sur un prix importé ; n’archive jamais un prix sans confirmation explicite dans le payload d’apply.
10. **Import sync d’un produit Stripe** : créer le `Plan` en `hidden` ou `pending_reconciliation` ; importer tous les `PlanPrice` avec `isCurrent=false` ; l’admin doit ensuite choisir explicitement quel prix devient courant.

## 6. Transitions de statut (`Plan`)

```
                    create (Stripe OK + DB OK)
[pending_reconciliation] ──────────────────────► active
         │                         ▲
         │ reconcile OK            │ unhide / reactivate (si pas archived)
         ▼                         │
      active ◄──── hide ────────► hidden
         │                          │
         └──── archive (confirm) ───┴──► archived (archived_at set)
                                              │
                                              └──► (irréversible en Phase 4 ;
                                                   réactivation = décision produit future)
```

| Statut | Signification | Nouveaux abonnements | Abonnés existants |
|--------|---------------|----------------------|-------------------|
| `pending_reconciliation` | Création Stripe partielle ou DB incomplète | Non | N/A |
| `active` | Forfait opérationnel | Oui si `isVisibleOnSignup` | Conservés |
| `hidden` | Masqué nouveaux clients (`isVisibleOnSignup` forcé false à la transition) | Non | Conservés |
| `archived` | Archivé (+ produit Stripe archivé seulement après confirmation) | Non | Conservés |

Actions UI « Masquer pour les nouveaux abonnements » → `hidden`.
« Archiver » → dialogue de confirmation → `archived` (+ option d’archiver le produit Stripe).

## 7. Transitions de statut (`PlanPrice`)

| Événement | Effet local | Effet Stripe |
|-----------|-------------|--------------|
| Création forfait / nouvel intervalle | `status=active`, `is_current=true` | `prices.create` |
| Nouveau tarif (même intervalle) | Nouveau row `is_current=true` ; ancien `is_current=false` ; option `status=archived` + `archived_at` | Nouveau Price ; option `prices.update({ active: false })` sur l’ancien **après confirmation** |
| Sync détecte Price inactif Stripe | Flag incohérence ; apply peut proposer `status=archived` **si confirmé** | Aucune écriture Stripe non demandée |

## 8. Registre d’entitlements

Fichier : `src/features/plans/lib/entitlement-registry.ts`

```ts
export const PLAN_ENTITLEMENT_KEYS = [
  "trips.max",
  "vehicles.max",
  "campings.max",
  "activities.max",
  "ai.planning.enabled",
  "ai.recommendations.enabled",
  "weather.forecast_days",
  "fuel.optimization.enabled",
  "fuel.live_prices.enabled",
  "trip.sharing.enabled",
  "trip.export_pdf.enabled",
  "notifications.enabled",
  "support.priority",
] as const;

export type PlanEntitlementKey = (typeof PLAN_ENTITLEMENT_KEYS)[number];

export type PlanEntitlementValue = {
  key: PlanEntitlementKey;
  enabled: boolean;
  limit: number | null;
  value: string | null;
};
```

Catégories UI (libellés FR) :

| Catégorie | Clés |
|-----------|------|
| Voyages | `trips.max` |
| Véhicules | `vehicles.max` |
| Carburant | `fuel.optimization.enabled`, `fuel.live_prices.enabled` |
| Météo | `weather.forecast_days` |
| Activités et campings | `activities.max`, `campings.max` |
| Intelligence artificielle | `ai.planning.enabled`, `ai.recommendations.enabled` |
| Partage et exportation | `trip.sharing.enabled`, `trip.export_pdf.enabled`, `notifications.enabled` |
| Assistance | `support.priority` |

Helpers : `resolveEntitlement(planId, key)`, `isWithinLimit(currentUsage, entitlement)`, `assertKnownEntitlementKey(key)`.

## 9. Association aux abonnés

### 9.1 Compteur prioritaire

Pour un `Plan` en mode `M` :

1. Collecter tous les `stripe_price_id` des `PlanPrice` du plan (tous statuts).
2. Compter `StripeSubscription` où :
   - `stripeMode = M`
   - `status` ∈ ensemble « actif » documenté : `active`, `trialing`, `past_due` (aligné Phase 3 billing)
   - et (`stripePriceId` ∈ price ids du plan **OU** (`stripePriceId` IS NULL **ET** `stripeProductId` = plan.stripeProductId))

### 9.2 Fallback documenté

`StripeSubscription` stocke déjà `stripePriceId` / `stripeProductId` extraits de `subscription.items.data[0]` via `getSubscriptionPriceFields` (Phase 3, mono-item).

- **Priorité** : match sur `stripePriceId`.
- **Fallback** : si `stripePriceId` null, match sur `stripeProductId` (données anciennes / sync incomplète).
- **Limite connue** : multi-items Stripe — la projection locale ne conserve que l’item[0]. Documenté ; amélioration éventuelle = table `stripe_subscription_items` (hors Phase 4).
- Toujours filtrer par `stripe_mode`.

### 9.3 Revenus mensuels estimés

Somme approximative : pour chaque abonnement actif matché, si `unitAmount` + `billingInterval` connus → normaliser en mensuel (`year` → `/12`, `month` → tel quel). Afficher « non calculable » si données manquantes. Pas de précision comptable.

## 10. Synchronisation Stripe

### 10.1 Identification des produits Sebavio

Un produit Stripe est « Sebavio » si et seulement si :

```
metadata.sebavio_app === "sebavio"
AND metadata.sebavio_stripe_mode === getStripeMode()
```

Les autres produits du compte Stripe sont **ignorés** (rapport `ignored`).

### 10.2 Étape A — Preview (`previewPlanSync`)

Idempotent, lecture seule locale + appels Stripe list.

Produit un rapport :

| Section | Contenu |
|---------|---------|
| `toCreateLocally` | Produits Sebavio absents en DB |
| `toUpdate` | Champs financiers autorisés différant (montant miroir, status Stripe price, nom produit Stripe ≠ publicName **proposé seulement** — ne pas auto-écraser publicName) |
| `inconsistencies` | Plan local sans product valide ; price local absent Stripe ; mode mismatch ; plusieurs `is_current` (corruption) |
| `ignored` | Produits non Sebavio ; prices hors metadata |
| `errors` | Erreurs API / parsing |

**Ne propose jamais** : modification entitlements ; bascule `is_current` automatique ; archivage prix sans flag explicite.

### 10.3 Étape B — Apply (`applyPlanSync`)

Entrée : `syncRunId` (UUID déjà persisté en `PlanSyncRun` au preview), liste d’actions confirmées (ids + types).

Règles :

- Idempotence **durable** via `PlanSyncAction` : contrainte unique PostgreSQL `(syncRunId, actionKey)`. Une action déjà `applied` / `skipped` n’est pas réexécutée.
- N’applique que les actions présentes dans le payload confirmé.
- Archivage prix / remplacement courant (`set_current`) : uniquement si l’action confirmée le demande explicitement — **jamais** implicite à l’import.
- Import local : plans en `hidden` ou `pending_reconciliation` ; prices avec `isCurrent=false`.
- Met à jour `lastSyncedAt` sur les plans touchés.
- Audit : une entrée par action + entrée résumé, toutes avec `newValue.syncRunId`.

## 11. Création Stripe et échecs partiels

### 11.1 Séquence création forfait

1. Valider Zod + `plans.manage` + mode courant.
2. Créer la ligne locale `Plan` avec son UUID, `status = pending_reconciliation`, entitlements initiaux (`stripeProductId` null).
3. `products.create` avec `idempotencyKey = plan-create:{planId}:product` + metadata immédiate : `sebavio_plan_id=<uuid>`, `sebavio_app`, `sebavio_stripe_mode` (**pas** de `sebavio_pending`).
4. Pour chaque intervalle demandé : `prices.create` avec `idempotencyKey = plan-create:{planId}:price:{interval}:{intervalCount}:{currency}`.
5. Transaction DB : attacher `stripeProductId`, créer `PlanPrice` (`is_current=true` pour les prix de création admin), `status=active`, clear `reconciliationError`.
6. Audit succès.

### 11.2 Échec (règle uniformisée)

Après l’étape 2, **toute** erreur Stripe ou base laisse le forfait en `pending_reconciliation` avec `reconciliationError` (message sûr) et audit `PLAN_CREATE_PARTIAL_FAILURE`. Cela inclut un échec de `products.create` : la ligne locale est **conservée** pour une relance contrôlée.

Une nouvelle tentative (`reconcilePlan` / retry create) **réutilise les mêmes clés d’idempotence** dérivées de `planId`.

Un forfait `pending_reconciliation` **n’est jamais** présenté comme valide à l’inscription / pricing public.

## 12. Permissions

| Action | Permission |
|--------|------------|
| Liste, détail, preview sync, lecture abonnés | `plans.read` |
| Créer, modifier, entitlements, prix, masquer, archiver, apply sync, reconcile, dupliquer | `plans.manage` |

`billing_admin` : `plans.read` seulement (matrice existante).
`admin` / `super_admin` : `plans.manage`.

Toutes les Server Actions appellent `requirePermission` côté serveur.

## 13. Contrats des Server Actions

Namespace : `src/features/plans/actions/`
Préfixe audit entity : `plan` / `plan_price` / `plan_entitlement` / `plan_sync`.

### 13.1 Types de résultat communs

```ts
type ActionOk<T> = { ok: true; data: T };
type ActionErr = { ok: false; error: string; code?: string };
type ActionResult<T> = ActionOk<T> | ActionErr;
```

### 13.2 Actions

| Action | Permission | Entrée (Zod) | Sortie |
|--------|------------|--------------|--------|
| `listPlansAction` | read | filtres optionnels status/mode | liste cartes |
| `getPlanAction` | read | `planId` | détail complet |
| `createPlanAction` | manage | infos générales + tarifs month/year + entitlements init | `{ planId }` ou erreur |
| `updatePlanMetadataAction` | manage | champs non financiers | plan |
| `setPlanEntitlementsAction` | manage | `planId` + tableau entitlements (clés registre) | void |
| `createPlanPriceAction` | manage | `planId`, amount, currency, interval, intervalCount, `archivePreviousForNewSubscribers: boolean` | `{ planPriceId }` |
| `hidePlanAction` | manage | `planId`, `reason` | void |
| `archivePlanAction` | manage | `planId`, `reason`, `archiveStripeProduct: boolean` | void |
| `duplicatePlanAction` | manage | `planId`, `internalName` | `{ planId }` (nouveau, pending puis create flow) |
| `previewPlanSyncAction` | read | — | `PlanSyncReport` |
| `applyPlanSyncAction` | manage | `syncRunId`, `confirmedActions[]` | résumé apply |
| `reconcilePlanAction` | manage | `planId` | statut réconciliation |

Chaque mutation audite `oldValue` / `newValue` incluant au minimum : `stripeMode`, ids Stripe/locaux concernés, `result` (`success` \| `error`), message d’erreur sûr, et pour sync `syncRunId`.

IP : via helper existant billing/admin (`actorIp`) lorsque disponible.

## 14. Routes / pages UI

| Route | Rôle |
|-------|------|
| `/admin/plans` | Liste + badge mode + Créer + Synchroniser (preview dialog → apply) |
| `/admin/plans/new` | Formulaire création |
| `/admin/plans/[id]` | Détail : général, prix actifs/anciens, entitlements, stats abonnés, revenus estimés, historique audit, onglet Abonnés |
| `/admin/plans/[id]/edit` | Édition métadonnées |
| `/admin/plans/[id]/entitlements` | Gestion fonctionnalités par catégories |
| `/admin/plans/[id]/prices` | Gestion prix + création nouveau tarif |

Nav : `ADMIN_NAV_ITEMS` → `available: true`, retirer « bientôt ».

UX (FR) :

- Skeletons / loading ; confirmations destructives ; badges statut ; mobile.
- Identifiants Stripe en section technique secondaire (`CopyableStripeId`).
- Si abonnés actifs > 0 :
  « Ce forfait est utilisé par X abonnés actifs. Les modifications de prix ne modifieront pas automatiquement leurs abonnements actuels. »

## 15. Services Stripe à ajouter

Fichiers sous `src/services/stripe/` :

- `product-service.ts` : create, retrieve, update metadata/name (non financier), archive (`active: false`)
- `price-service.ts` : create, retrieve, list by product, deactivate (`active: false`)
- Export barrel `index.ts`

Réutilisent `getStripeClient`, `getStripeMode`, `assertModeConsistency`.
Aucune clé secrète exposée au client.

## 16. Critères d’acceptation

1. `/admin/plans` n’affiche plus « bientôt » ; liste réelle filtrée par mode courant.
2. Création : produit + prix Stripe + rows locales + entitlements + audit ; échec partiel → `pending_reconciliation` visible admin seulement.
3. Modification métadonnées sans toucher Stripe price amounts.
4. Nouveau prix : nouveau Price Stripe ; ancien reste pour abonnés ; un seul `is_current` par intervalle.
5. Entitlements éditables ; sync ne les écrase pas.
6. Preview sync puis apply confirmé ; pas d’import des produits non Sebavio.
7. Permissions respectées (billing_admin lecture seule).
8. Mode test/live : impossible de lier cross-mode.
9. Archivage / masquage avec confirmation ; pas d’archive Stripe silencieuse.
10. Onglet abonnés ouvre les fiches utilisateurs.
11. Textes listés §17 verts avec Stripe mocké.
12. Build + typecheck + lint OK.

## 17. Tests attendus (Vitest, Stripe mocké)

| # | Cas |
|---|-----|
| 1 | Création produit + prix (mock Stripe) persiste ids |
| 2 | Validation Zod formulaires (montants, devise, clés entitlement) |
| 3 | Permissions : read vs manage |
| 4 | Séparation test / live (mismatch → erreur) |
| 5 | Sync preview idempotente (2 appels = même rapport structurel) |
| 6 | Détection incohérences (product manquant, price archivé Stripe) |
| 7 | Création nouveau prix + `is_current` unique |
| 8 | Anciens abonnements conservent leur `stripePriceId` (pas de rewrite) |
| 9 | Archivage sécurisé (refus sans confirmation / flag) |
| 10 | Journalisation actions (audit appelé avec old/new + mode) |
| 11 | Résolution entitlements (`enabled` false / illimité / limite) |
| 12 | Limite numérique atteinte (`isWithinLimit`) |
| 13 | Forfait `hidden` encore compté pour abonnés actifs |
| 14 | Échec partiel Stripe → `pending_reconciliation` |
| 15 | Re-sync sans duplication de plans/prices locaux |

**Interdit :** tests destructifs contre Stripe production / live réel.

## 18. Variables d’environnement

Aucune variable nouvelle obligatoire. Réutilise :

- `STRIPE_SECRET_KEY`
- `STRIPE_MODE` (`test` \| `live`)
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_DASHBOARD_ACCOUNT_ID` (liens dashboard optionnels)

Signaler si une URL publique pricing est ajoutée plus tard (`NEXT_PUBLIC_*`) — hors Phase 4 admin.

## 19. Procédure de vérification mode test

1. `STRIPE_MODE=test` + clé `sk_test_…`.
2. Admin `admin`/`super_admin` → `/admin/plans`.
3. Créer un forfait mensuel + annuel CAD, vérifier Dashboard Stripe test (metadata `sebavio_app`).
4. Modifier description ; vérifier absence de nouveau Price.
5. Changer le prix mensuel ; vérifier nouveau Price + ancien toujours attaché aux test clocks / subs existantes.
6. Preview sync → aucun drift inattendu ; apply no-op idempotent.
7. Masquer → plus proposé (flag) ; abonnés test toujours listés.
8. Forcer erreur DB après product create (test unitaire) → `pending_reconciliation` + reconcile.

## 20. Limites restantes (Phase 4)

- Pas de migration automatique des abonnements vers un nouveau prix.
- Pas de table `stripe_subscription_items` (multi-items).
- Pas de Checkout / Customer Portal branchés sur `defaultTrialDays` (préparer le champ seulement).
- Pas de webhooks `product.*` / `price.*` obligatoires (sync manuelle admin suffit pour v1).
- Pas de stats / IA admin.
- Archivage Plan irréversible en UI Phase 4.

## 21. Verdict cible post-implémentation

À produire en fin de livraison : **GO** / **GO SOUS RÉSERVE** / **NO-GO** selon critères §16–17.

**Verdict 2026-07-20 (développement) : GO SOUS RÉSERVE**

- Phase 4 (critères §16–17, smoke test mode, 141 tests `plans-*`) : satisfaits.
- Réserves hors Phase 4 : 4 tests projet déjà en échec (fuel/FDE/géoloc) ; lint global rouge hors `src/features/plans` et `src/app/admin/plans`.
- Migration à déployer en préprod/prod via `prisma migrate deploy` (déjà up to date en développement).
