# Guide de contribution — Sebavio

## Prérequis

- Node.js 22 LTS via nvm (`.nvmrc`) — **ne jamais** utiliser ni modifier le Node système (v20)
- PostgreSQL et Redis via variables d’environnement (voir `.env.example`)
- Travail sur l’environnement **développement** du serveur Contabo

```bash
cd /var/www/sebavio.com
nvm use
cp .env.example .env   # si besoin
npm install
npm run quality
```

## Conventions de nommage

| Élément | Convention | Exemple |
| --- | --- | --- |
| Features / dossiers | `kebab-case` | `vehicle-catalog` |
| Composants React | `PascalCase` | `TripCard.tsx` |
| Hooks | `use` + `PascalCase` | `useActiveVehicle.ts` |
| Services / utils | `camelCase` | `calculateFuelCost.ts` |
| Types / interfaces | `PascalCase` | `TripSummary` |
| Schémas Zod | `camelCase` + `Schema` | `createTripSchema` |
| Constantes | `SCREAMING_SNAKE` ou `as const` | `MAX_TRAVELERS` |
| BDD (Prisma) | `snake_case`, UUID v4, `created_at` / `updated_at` / `deleted_at` | — |

## Architecture feature-first

1. Lire `docs/ARCHITECTURE.md` avant toute évolution structurelle.
2. Nouveau module métier → dossier sous `src/features/<nom>/` avec le squelette standard (`actions`, `components`, `hooks`, `schemas`, `services`, `types`, `index.ts`).
3. Exposer uniquement via le **barrel** `index.ts` de la feature.
4. Pas de logique métier dans `app/`, l’IA, ou le client.
5. Pas de Docker / conteneurisation.
6. Secrets uniquement dans `.env` (jamais commités).

## Imports

```ts
// ✅
import { Button } from "@/components/ui";
import { cn } from "@/lib";

// ❌ imports profonds entre features
import { something } from "@/features/trips/services/internal";
```

Alias : `@/*` uniquement.

## Qualité avant de considérer une étape terminée

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
```

Ou en une commande : `npm run quality`.

## Commits

Style Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, …).  
Husky + lint-staged formatent et lintent les fichiers stagés.

## Documentation

Tout changement d’architecture significatif met à jour `docs/ARCHITECTURE.md` et, si besoin, le Document concerné dans `docs/`.

## Environnements

Exactement trois : **développement**, **préproduction** (staging), **production**.  
Ne jamais toucher à la production directement depuis cette phase.
