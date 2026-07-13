# Architecture applicative — Sebavio

> Source de vérité complémentaire aux Documents 1–10 et 12.  
> En cas de contradiction : règles projet (`.cursor/rules/sebavio.mdc`) > Document 8 > Document 12 > autres docs.

## 1. Vue d’ensemble

Sebavio est un **monolithe Next.js 16** (App Router, TypeScript strict) déployé sans conteneurisation : Node.js 22 LTS + PM2 + Nginx sur VPS Contabo.

| Couche | Technologie |
| --- | --- |
| UI | React 19, Tailwind CSS, shadcn/ui |
| Validation | Zod |
| État serveur | TanStack Query |
| État client | Zustand |
| ORM | Prisma (PostgreSQL) |
| Cache | Redis |
| Auth | Auth.js (JWT 30 min, Credentials, Argon2) |
| IA | Abstraction multi-fournisseurs (jamais d’appel direct depuis le métier) |

## 2. Structure des dossiers

Tout le code applicatif vit sous `src/` (Document 8). Socle obligatoire + dossiers complémentaires autorisés :

```
src/
  app/                 # Routes, layouts, Route Handlers (pas de logique métier complexe)
  components/          # UI partagée (ui, common, layout)
  features/            # Modules métier (feature-first)
  hooks/               # Hooks transversaux
  lib/                 # Utilitaires et clients techniques (prisma, errors, validation…)
  services/            # Services transversaux (cache, storage, email, ai…)
  stores/              # État client global (Zustand)
  types/               # Types transversaux
  config/              # Configuration centralisée
  styles/              # Styles globaux complémentaires
prisma/                # Schéma et migrations (hors src)
tests/                 # unit / integration / e2e
docs/                  # Documentation projet
```

### 2.1 Structure interne d’une feature

Chaque feature suit le même squelette :

```
src/features/<nom>/
  actions/       # Server Actions
  components/    # UI spécifique au module
  hooks/         # Hooks du module
  schemas/       # Schémas Zod du module
  services/      # Logique métier / accès données du module
  types/         # Types du module
  index.ts       # Barrel public (seule surface d’import recommandée)
```

### 2.2 Responsabilités et interdictions

| Dossier | Responsabilité | Interdit |
| --- | --- | --- |
| `app/` | Routes, layouts, metadata, API HTTP | Logique métier complexe |
| `components/ui` | Design System / shadcn | Appels API, métier |
| `components/common` | Composants transversaux non DS | Logique métier |
| `components/layout` | Header, Sidebar, Footer, etc. | Métier spécifique à un module |
| `features/*` | Module métier complet | Dépendances circulaires entre features |
| `lib/` | Utilitaires, clients techniques | UI React, règles métier |
| `services/` (racine) | Orchestrations transversales | Composants React |
| `stores/` | État client global | Données serveur à mettre en cache (→ Query / Redis) |
| `types/` | Types partagés | Schémas Zod exécutables (→ `schemas` / `lib/validation`) |
| `config/` | Config centralisée | Secrets en clair |

## 3. Correspondance Document 3 ↔ features

Tous les modules du Document 3 sont couverts. Statuts : **créée** (dossier présent), **future** (documentée, pas encore de dossier).

| Module Document 3 | Feature projet | Statut | Notes |
| --- | --- | --- | --- |
| Authentification | `auth` | active | Auth.js JWT, pages login/register, rate-limit Redis |
| Gestion des utilisateurs | `users` | créée | CRUD, préférences, rôles |
| Profils voyageurs | `users` | créée (hébergé) | Peut devenir une feature dédiée plus tard |
| Familles | `users` | créée (hébergé) | Peut devenir une feature dédiée plus tard |
| Véhicules | `vehicles` | créée | Véhicules des utilisateurs |
| Constructeurs et modèles | `vehicle-catalog` | créée | Catalogue de référence |
| Voyages | `trips` | créée | Planification et suivi |
| Optimisation carburant | `fuel` | créée | Prix, arrêts, optimisation |
| Entretien | `maintenance` | créée | Rappels, historique, factures |
| Budget | `finance` | créée | Budgets, dépenses, rapports |
| Activités | `activities` | créée | Activités et recommandations |
| Campings | `campings` | créée | Recherche et favoris |
| Stations-service | `fuel` | créée | Même feature que l’optimisation carburant |
| Points d'intérêt | `activities` | créée | Affichage carto via `maps` ; métier POI dans `activities` |
| Météo | `weather` | créée | Prévisions et alertes |
| Assistant IA | `ai` | créée | Abstraction multi-fournisseurs |
| Notifications | `notifications` | créée | Centre, push, courriel |
| Administration | `admin` | créée | Portail d’administration |
| Abonnements | `subscriptions` | créée | Stripe / plans d’abonnement |
| Journalisation | `travel-journal` | **future** | Journal de voyage — dossier non créé ; audit technique → `audit_logs` (infra) |

### Décision : Points d’intérêt

Les POI relèvent de la feature **`activities`** (Document 10 Partie 16). La feature **`maps`** fournit uniquement l’infrastructure cartographique (affichage, clustering, itinéraires).

### Features techniques hors liste Document 3

| Feature | Rôle |
| --- | --- |
| `maps` | Infrastructure Google Maps / cartographie (Document 10 Partie 12) |

## 4. Alias et imports

- Alias unique : `@/*` → `./src/*` (`tsconfig.json`).
- Importer une feature via son barrel : `import { … } from "@/features/trips"`.
- Les features **ne s’importent pas** mutuellement en profondeur (`@/features/a/services/...` depuis `b`) : passer par le barrel public ou extraire vers `lib/` / `services/`.
- `app/` consomme les features ; une feature ne dépend pas des pages `app/`.

## 5. Flux de dépendances

```
app/  →  features/*  →  services/ | lib/ | types/
                 ↘
                   components/ (ui, common, layout)
```

- Calculs métier : **côté serveur** (services / Server Actions), jamais dans l’IA ni le client.
- Pas de duplication de logique métier.

## 6. Qualité

Scripts : `lint`, `typecheck`, `test:run`, `build`, `quality`.  
Husky + lint-staged sur les commits. TypeScript `strict: true`.

## 7. Authentification (Partie 4)

- **Auth.js** (`next-auth` v5) : stratégie JWT, `maxAge` 30 min, relecture `status` en base ≤ 60 s.
- **Modèles** : `User`, `Session`, `Account`, `VerificationToken`, `AuditLog`.
- **Feature** : `src/features/auth` (schemas Zod, services, actions, formulaires).
- **Routes API** : `/api/auth/[...nextauth]` + `/api/v1/auth/*` (register, login, logout, me, verify-email, forgot/reset-password, refresh).
- **Pages** : `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/dashboard/*`, `/admin`.
- **Proxy** (`src/proxy.ts`, ex-middleware Next.js 16) : protection `/dashboard` et `/admin` (rôles) ; claim JWT `status === active`.
- **Révocation** : `requireActiveUser()` / `requireAdminUser()` re-vérifient le statut en base pour layouts dashboard/admin et mutations sensibles.
- **Rate-limit login** : Redis ; si Redis indisponible → **échec fermé** (refus générique).
- **Emails** : stub ; en `NODE_ENV !== production` uniquement, lien loggé en console serveur.

## 8. Design System (Partie 5)

- **Tokens** : `src/styles/tokens.css` + thème clair/sombre dans `src/app/globals.css` (vert principal, accents bleu/orange/rouge, grille 8 px).
- **Typo** : Inter via `next/font` (`--font-sans`).
- **UI** : shadcn (`src/components/ui`) — button, card, input, label, select, textarea, dialog, table, badge, sonner, skeleton, tabs, separator, checkbox, switch, dropdown-menu.
- **Communs** : `FormField`, `ThemeToggle`, `StatusBadge`, `EmptyState`, `LoadingState`, `PageHeader`, `FadeIn`.
- **Layout (coquilles)** : `AppShell`, `Header`, `Sidebar`, `Footer`, `Breadcrumbs`.
- **Vitrine** : `/design-system` (404 si `NODE_ENV === production`).
- **Thème** : `next-themes` + Toaster Sonner dans le layout racine.

## 9. Layout et navigation (Partie 6)

- **Shell** : `DashboardShell` câble `AppShell` + sidebar + header + breadcrumbs + footer pour `(dashboard)` et `/admin`.
- **Config** : `src/components/layout/navigation.ts` — menus, filtrage rôles (`admin` / `super_admin`), breadcrumbs.
- **Routes placeholder** : `/dashboard`, `/dashboard/trips`, `/dashboard/vehicles`, `/dashboard/catalog`, `/dashboard/maintenance`, `/dashboard/finance`, `/dashboard/ai`, `/dashboard/notifications`, `/dashboard/subscription`, `/dashboard/settings`, `/admin`.
- **Responsive** : sidebar desktop repliable ; menu mobile (Dialog) ; recherche header désactivée (« Recherche — à venir »).
- **Hors menu** : météo, carburant, campings, activités, cartes → sections internes Voyages (commentaire dans `navigation.ts`).

## 10. Hors scope immédiat

Modules métier, OAuth Google, MFA réel, SMTP production.
