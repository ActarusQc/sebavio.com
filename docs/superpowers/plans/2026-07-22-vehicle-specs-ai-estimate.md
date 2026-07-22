# Vehicle Specs AI Estimate — Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Préremplir consommation et capacité réservoir à la sélection véhicule (NRCan prioritaire pour conso, cache+IA pour réservoir).

**Architecture:** Endpoint `POST /api/v1/vehicles/specs-estimate` → service serveur (NRCan → cache Redis+DB → IA via `createAiProvider`) → UI formulaire.

**Tech Stack:** Next.js App Router, Prisma, Redis, Zod, Vitest, `services/ai`.

## Global Constraints

- Pas d’appel IA hors `services/ai`
- Port 3050 / déploiement PM2 `sebavio` uniquement
- UUID v4, soft-delete `deleted_at` sur la table cache
- Bornes : conso 1–100, réservoir 10–500

---

### Task 1: Schéma Prisma + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260722190000_vehicle_spec_estimates/migration.sql`

- [x] Model `VehicleSpecEstimate` (`vehicle_spec_estimates`)
- [x] Migration SQL + `prisma migrate deploy`

### Task 2: Schemas + service + rate-limit + API

**Files:**
- Create: `src/features/vehicles/schemas/specs-estimate.ts` (ou dans schemas/index)
- Create: `src/features/vehicles/services/specs-estimate.ts`
- Create: `src/features/vehicles/lib/specs-estimate-cache-key.ts`
- Create: `src/app/api/v1/vehicles/specs-estimate/route.ts`
- Test: `tests/unit/vehicle-specs-estimate.test.ts`

- [x] Résolution NRCan > cache > IA
- [x] Rate-limit 10/min
- [x] Tests unitaires

### Task 3: UI picker + formulaire

**Files:**
- Modify: `nrcan-vehicle-picker.tsx` (`onSelectionChange`)
- Modify: `overridable-spec-field.tsx` (sync externe)
- Modify: `vehicle-form.tsx`

- [x] Debounce manuel 600 ms
- [x] Préremplissage + hints source + dirty

### Task 4: Build + deploy

- [x] `npm run test` ciblé + `npm run build` + `pm2 restart sebavio`
