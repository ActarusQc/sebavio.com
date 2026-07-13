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
| Auth | Auth.js (à venir, Partie 4) |
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
| Authentification | `auth` | créée | Auth.js — Partie 4 |
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

## 7. Hors scope de cette phase

Aucune logique métier, aucun modèle Prisma métier, pas d’Auth.js ni Design System complet (parties suivantes du Document 10).
