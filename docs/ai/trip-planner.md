# Planifier avec l’IA

Assistant spécialisé pour préparer et créer un **nouveau voyage** Sebavio.
Distinct de l’agent conversationnel de voyage (`docs/ai/trip-assistant.md`).

## Contexte géographique

Par défaut : Québec / Canada, français canadien, kilomètres, CAD.
Suggestions de départ : domicile → récents → profil → villes québécoises → saisie manuelle.
Jamais de Paris / Lyon / Marseille spontanément sans indice Europe/France.

## Adresse de domicile

Champs `UserProfile.home_address_*` (nullable). Section Paramètres « Adresse de domicile ».
Réutilise `AddressAutocomplete`. L’assistant propose « partir du domicile à {ville} » ; le résumé affiche `Domicile — {ville}`.

## Architecture

- Feature : `src/features/ai-trip-planner/`
- Page : `/dashboard/ai` (libellé menu « Planifier avec l’IA »)
- Persistance : table `ai_trip_planning_sessions`
- IA : `createAiProvider().generateRawJsonResponse` + schéma Zod + patch `tripDraftPatch`
- Adresses : `AddressAutocomplete` + `POST …/place` (pas d’invention de placeId par l’IA)
- Création : réutilise `createTrip`, `addStop`, `rebuildTripRouteFromCanonicalData`, `estimateTripFuel`

## Dates relatives

Résolues côté serveur (`lib/resolve-relative-dates.ts`) selon le fuseau du profil.
« Ce week-end » → samedi/dimanche pertinents en année courante (jamais l’IA).
Placeholders génériques (« Arrivée et balade… ») non confirmables ; gastronomie → arrêts concrets.

## Machine d’états (serveur = autorité)

Étapes : `trip_type` → `origin` → `destination_mode` → `destination_radius` → `destination` → `dates` → `travelers` → `vehicle` → `preferences` → `itinerary_proposal` → `confirmation`.

Chaque réponse expose `sessionVersion`, `currentStep`, `quickReplies`, `requestedInput`, `proposal`.
Les quick replies sont dérivées de l’étape active (plus de véhicules pendant les dates).
Confirmation / `canCreate` impossibles sans proposition concrète (estimations + arrêts/activités).

## Résilience des réponses IA

1. Validation Zod (champs inconnus encore optionnels / null)
2. Normalisation (markdown, enums FR, listes absentes → `[]`)
3. Une seule nouvelle tentative automatique de réparation
4. Fallback conversationnel + conservation du dernier brouillon
5. Erreur utilisateur seulement après échec des niveaux précédents

## API

| Méthode | Route | Rôle |
|---------|-------|------|
| GET/POST | `/api/ai-trip-planner/session` | Session active / création |
| GET/DELETE | `/api/ai-trip-planner/session/:id` | Lecture / abandon |
| POST | `/api/ai-trip-planner/session/:id/message` | Message utilisateur |
| POST | `/api/ai-trip-planner/session/:id/place` | Confirmation lieu (adresse validée / domicile) |
| POST | `/api/ai-trip-planner/session/:id/recalculate` | Recalcul itinéraire |
| POST | `/api/ai-trip-planner/session/:id/create-trip` | Création confirmée (`confirm: true`) |

## Entitlements

- `ai.planning.enabled` (même clé que l’assistant voyage)
- Limite de rate : `assertAiRateLimit`
- Création de voyage : `assertCanCreateTrip` via `createTrip`

## Tests

```bash
npx vitest run tests/unit/ai-trip-planner*.test.ts tests/unit/home-address.test.ts tests/integration/ai-trip-planner.test.ts
```

## Procédure de validation

1. Enregistrer un domicile sur https://sebavio.com/dashboard/settings
2. Ouvrir https://sebavio.com/dashboard/ai
3. Road trip → accepter le domicile → destination → dates → véhicule
4. Vérifier le résumé (`Domicile — {ville}`)
5. Confirmer « Créer le voyage »
