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
| Constructeurs et modèles | `vehicle-catalog` | active | Prisma + API lecture/écriture admin + dashboard `/dashboard/catalog` |
| Voyages | `trips` | créée | Planification et suivi |
| Optimisation carburant | `fuel` | créée | Prix, arrêts, optimisation |
| Entretien | `maintenance` | créée | Rappels, historique, factures |
| Budget | `finance` | créée | Budgets, dépenses, rapports |
| Activités | `activities` | active | Répertoire local, recherche, favoris, lien étapes N:N |
| Campings | `campings` | active | Répertoire local, recherche, favoris, lien étapes |
| Stations-service | `fuel` | créée | Même feature que l’optimisation carburant |
| Points d'intérêt | `activities` | active | Unifiés dans `activities.kind=poi` (écart Doc 4 table séparée) |
| Météo | `weather` | active | Open-Meteo (écart Doc 3) ; cache Redis ; fiche voyage |
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
- **Modèles** : `User`, `Session`, `Account`, `VerificationToken`, `AuditLog`, `UserProfile`, `UserPreference`.
- **Feature** : `src/features/auth` (schemas Zod, services, actions, formulaires).
- **Routes API** : `/api/auth/[...nextauth]` + `/api/v1/auth/*` (register, login, logout, me, verify-email, forgot/reset-password, refresh).
- **Pages** : `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/dashboard/*`, `/admin`.
- **Proxy** (`src/proxy.ts`, ex-middleware Next.js 16) : protection `/dashboard` et `/admin` (rôles) ; claim JWT `status === active`.
- **Révocation** : `requireActiveUser()` / `requireAdminUser()` re-vérifient le statut en base pour layouts dashboard/admin et mutations sensibles.
- **Rate-limit login** : Redis ; si Redis indisponible → **échec fermé** (refus générique).
- **Emails** : stub ; en `NODE_ENV !== production` uniquement, lien loggé en console serveur.

## 7bis. Utilisateurs — profils et préférences (Partie 7)

- **Modèles** : `user_profiles` (1:1), `user_preferences` (1:1) — créés à l'inscription.
- **Feature** : `src/features/users` (schemas Zod, services, Server Actions, formulaires Paramètres).
- **API** : `GET/PATCH /api/v1/users/me`, `GET/PUT /api/v1/users/preferences` (codes `USR_*`).
- **UI** : `/dashboard/settings` — profil + préférences (unités, notifications, IA).
- **Hors scope immédiat** : travel-groups, devices, admin CRUD utilisateurs.

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
- **Routes placeholder** : `/dashboard`, `/dashboard/finance`, `/dashboard/ai`, `/dashboard/notifications`, `/dashboard/subscription`, `/admin`.
- **Véhicules** : `/dashboard/vehicles` (+ new / [id] / edit).
- **Catalogue** : `/dashboard/catalog` (+ [id]).
- **Entretien (Partie 10)** : `/dashboard/maintenance` (+ calendar / history / new / [id]).
- **Voyages (Partie 11)** : `/dashboard/trips` (+ new / [id] / edit).
- **Paramètres** : `/dashboard/settings` (profil + préférences — feature `users`).
- **Responsive** : sidebar desktop repliable ; menu mobile (Dialog) ; recherche header désactivée (« Recherche — à venir »).
- **Hors menu** : météo, carburant, campings, activités, cartes → sections internes Voyages (commentaire dans `navigation.ts`).

## 10. Module Entretien (Partie 10)

- **Gabarits** (`maintenance_templates`) : lecture authentifiée via `GET /api/v1/models/{id}/maintenance` ; écriture admin via `/api/v1/admin/maintenance-templates`.
- **Entretiens utilisateur** : `maintenance_history` (soft delete), `maintenance_schedule`, `maintenance_documents`, isolation propriétaire (404).
- **Échéances** : calculées uniquement côté serveur (`schedule-calc` + `recalculate`).
- **Notifications** : table `maintenance_notifications` prête ; **pas de génération en masse** à chaque recalcul — lignes créées seulement à l’approche (14 j / 500 km), `sent=false`. L’envoi réel appartient au **module Notifications**.
- **Odomètre** : champ `user_vehicles.odometer_updated_at` ; invite discrète sur le dashboard entretien si > 30 jours.

## 11. Module Voyages (Partie 11)

- **Tables** : `trips` (soft delete), `trip_stops` (adresse texte + lat/lng nullable), `trip_routes` (tracé Google Maps + hash waypoints).
- **Statuts** : `planned` → `in_progress` → `completed` ; `planned|in_progress` → `cancelled` (terminal, lecture seule, `TRIP_005`). Soft-delete inchangé.
- **API** : `/api/v1/trips` CRUD + stops + summary + complete + cancel ; `optimize` (itinéraires) ; `stops/:stopId/geocode`.
- **Règles** : véhicule obligatoire et appartenant au même user (`TRIP_003` 404) ; isolation voyages (`TRIP_001` 404) ; voyage terminé en lecture seule (`TRIP_005`).
- **Hors scope** : budget/dépenses (17), journal/médias.

## 11bis. Cartographie (Partie 12)

- **Fournisseur** : Google Maps via abstraction `@/services/maps` (Geocoding + Directions serveur ; Maps JS côté client).
- **Clés** : `GOOGLE_MAPS_API_KEY` (serveur) ; `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client, Maps JavaScript API uniquement) ; `NEXT_PUBLIC_GOOGLE_MAPS_ID` optionnel.
- **Cache Redis** : géocodage / directions ; adresses normalisées (trim, minuscules, espaces) avant hash.
- **Rate-limit** : 30 req/h/utilisateur ; Redis down → pas d'appel Google (`EXT_001`).
- **Périmé** : `trip_routes.waypoints_hash` vs hash courant des étapes → `route.isStale` + invite UI « Itinéraire à recalculer ».
- **Dégradé** : sans clé / API KO → adresses texte, pas de carte bloquante.
- **UI** : `TripMap` (lazy) sur fiche voyage.

## 13. Carburant — prix Régie Essence Québec (Partie 13bis)

### Écart au Document 4 (`fuel_prices` plat)

Le Doc 4 décrit une table unique `fuel_prices(country, region, city, station_name, fuel_type, price, captured_at)`.  
L’export officiel Régie Essence Québec (feuille « Régie Essence Québec », ~2 500 lignes) fournit plutôt : **Nom, Bannière, Adresse, Région, Code Postal, Latitude, Longitude, Prix Régulier, Prix Super, Prix Diesel**.

**Décision d’architecture** : deux tables normalisées —

| Table | Rôle |
| --- | --- |
| `fuel_stations` | Identité station (`external_key`, géoloc, région, soft-delete différé) |
| `fuel_prices` | Historique des relevés (`station_id`, `fuel_type`, `price` $/L, `captured_at`) — **jamais écrasé** |

Cela respecte l’esprit Doc 4 (région, nom, type, prix, historisation) tout en supportant l’upsert réel et les requêtes « prix courant ».

### Mapping `fuel_type`

| Colonne Excel Régie | Valeur stockée | Catalogue véhicule |
| --- | --- | --- |
| Prix Régulier | `regular` | `Gasoline`, `Hybrid` |
| Prix Super | `premium` | (saisie préférée / futur) |
| Prix Diesel | `diesel` | `Diesel` |

Types **sans** estimation Régie (repli / « non applicable », jamais d’erreur) : `Electric`, et hybride rechargeable si présent (`PlugInHybrid` / `PHEV`). `Propane` et autres → repli chaîne personnelle / défaut.

### Parsing XLSX

Bibliothèque retenue : **`xlsx` (SheetJS)**.  
`exceljs` a été tenté puis écarté : l’export Régie (namespaces OOXML `x:`) provoque un échec de lecture (`workbook.sheets` undefined).

Source fichier : `REGIE_ESSENCE_XLSX_URL` ou découverte via `stations.geojson.gz` → `metadata.excel_url`.

### Soft-delete stations

Une station absente du fichier incrémente `missing_streak`. Soft-delete seulement si `missing_streak ≥ 3` **et** fichier plausible (`≥ 1500` stations). Sinon ingestion refusée, données intactes.

### Chaîne de prix (estimation voyage)

1. Régie (données &lt; 48 h, régions des étapes / origin-destination)  
2. Moyenne personnelle des pleins  
3. Prix par défaut formulaire  

Commande : `npm run ingest:fuel-prices` — à planifier au déploiement (ex. toutes les 2–4 h), pas de cron dans cette partie.

## 14. Météo (Partie 14)

### Écart au Document 3 (OpenWeather)

Le Doc 3 prescrit **OpenWeather**. Fournisseur retenu : **Open-Meteo**.

| Critère | OpenWeather (Doc 3) | Open-Meteo (retenu) |
| --- | --- | --- |
| Clé API | Obligatoire | Optionnelle (`OPEN_METEO_API_KEY`) |
| Horizon | Free ≈ 5 j ; One Call payant | **16 jours** |
| Coût en développement | Compte + quotas | Gratuit sans clé (non-commercial) |

Abstraction : `@/services/weather` + `WEATHER_PROVIDER` (`open-meteo` \| `off` \| `openweather`).  
Basculer vers OpenWeather ou l’offre commerciale Open-Meteo reste trivial.

### Licence commerciale Open-Meteo

L’API publique Open-Meteo est réservée à un **usage non-commercial**.  
Sebavio est un SaaS destiné à devenir commercial.

**Avant tout lancement commercial** : souscrire l’offre API commerciale Open-Meteo (payante, avec clé → `customer-api.open-meteo.com` via `OPEN_METEO_API_KEY`) **ou** basculer `WEATHER_PROVIDER` / implémenter OpenWeather.

### Cache et données

- **Redis uniquement** (TTL 2 h) — clé par point arrondi (2 décimales) ; pas de table `weather_cache` pour l’instant (Doc 4 : reportée avec le module IA si besoin).
- Rate-limit : 60 req/h/utilisateur ; Redis down → pas d’appel fournisseur.
- Étapes sans coordonnées → pas de météo (silencieux). Hors horizon → « Prévisions disponibles à l’approche » (aucune donnée inventée).
- Mode dégradé : fiche voyage jamais bloquée.

### API / UI

- `GET /api/v1/weather/forecast?latitude=&longitude=`
- `GET /api/v1/weather/current?latitude=&longitude=`
- `GET /api/v1/trips/{id}/weather` (propriétaire uniquement)
- UI : `TripWeatherPanel` sur la fiche voyage.

### Hors scope (reporté)

Suggestions IA selon la météo ; alertes météo riches.

## 15. Campings (Partie 15)

### Source de données (option A)

Table locale `campgrounds` + seed démo (`source=seed-dev`, refusé en production) + CRUD admin.  
Aucun fournisseur externe sans accord explicite. Abstraction : `@/services/campgrounds` (`CAMPGROUND_PROVIDER=local`).

### Modèles

| Table | Rôle |
| --- | --- |
| `campgrounds` | Répertoire (lat/lng, services JSONB, max_length_m, soft-delete) |
| `user_campground_favorites` | Favoris utilisateur |
| `trip_stops.campground_id` | Planifier une nuit sur une étape |

### Soft-delete

Même patron que les groupes de voyage : refus `CAMP_003` (409) si étapes de voyages `planned` / `in_progress` référencent le camping ; `completed` / `cancelled` conservent la FK → UI « Camping archivé ».

### Proximité / avertissement

Recherche Haversine (`src/lib/geo`) près d’une étape. Si distance étape↔camping > 50 km : avertissement **non bloquant** dans l’UI.

### API / UI

- `GET /api/v1/campgrounds/search`
- `GET /api/v1/campgrounds/{id}`
- `GET/POST /api/v1/campgrounds/favorites`, `DELETE …/favorites/{campgroundId}`
- `PUT /api/v1/trips/{id}/stops/{stopId}/campground`
- Admin : `/api/v1/admin/campgrounds`, UI `/admin/campings`
- Panneau `TripCampingsPanel` sur fiche voyage
- Seed : `npm run prisma:seed:campgrounds`

### Hors scope (reporté)

Fournisseur API externe, réservation intégrée, recommandations IA.

## 16. Activités / Points d'intérêt (Partie 16)

### Source de données (option A)

Table locale unifiée `activities` (`kind` = `activity` \| `poi`) + seed démo (`source=seed-dev`, refusé en production) + CRUD admin.  
Aucun fournisseur externe sans accord explicite. Abstraction : `@/services/activities` (`ACTIVITY_PROVIDER=local`).

### Écarts au Document 4

| Écart | Justification |
| --- | --- |
| Une table `activities` au lieu de `activities` + `points_of_interest` | Même patron campings ; POI métier dans la feature activities (ARCHITECTURE) |
| `season` JSONB (tableau multi-saisons) | Une activité peut couvrir plusieurs saisons ; filtre multi |
| `price_indicative`, `address`, `region`, `rating`, `description` | Champs utiles absents / partiels dans Doc 4 |
| Liaison N:N `trip_stop_activities` | Une étape peut référencer plusieurs activités (contrairement au camping 0..1) |

### Modèles

| Table | Rôle |
| --- | --- |
| `activities` | Répertoire (lat/lng, catégorie, kind, soft-delete) |
| `user_activity_favorites` | Favoris utilisateur |
| `trip_stop_activities` | Planifier N activités sur une étape |

### Soft-delete

Refus `ACT_003` (409) si liens actifs sur voyages `planned` / `in_progress` ; `completed` / `cancelled` conservent le lien → UI « Activité archivée ».

### Proximité / avertissement

Recherche Haversine (`src/lib/geo`) près d’une étape. Si distance étape↔activité > 50 km : avertissement **non bloquant**. Compteur + aperçu visibles dans la liste des étapes de la fiche voyage.

### API / UI

- `GET /api/v1/activities/search`
- `GET /api/v1/activities/{id}`
- `GET/POST /api/v1/activities/favorites`, `DELETE …/favorites/{activityId}`
- `GET/POST /api/v1/trips/{id}/stops/{stopId}/activities`
- `DELETE /api/v1/trips/{id}/stops/{stopId}/activities/{activityId}`
- Admin : `/api/v1/admin/activities`, UI `/admin/activites`
- Panneau `TripActivitiesPanel` sur fiche voyage
- Seed : `npm run prisma:seed:activities`

### Hors scope (reporté)

Fournisseur API externe, carte dédiée riche, cache Redis recherche, recommandations IA.

## 17. Hors scope immédiat

Modules métier restants, OAuth Google, MFA réel, SMTP production, envoi notifications.
