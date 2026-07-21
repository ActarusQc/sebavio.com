# Planifier avec l’IA

Assistant spécialisé pour préparer et créer un **nouveau voyage** Sebavio.
Distinct de l’agent conversationnel de voyage (`docs/ai/trip-assistant.md`).

## Architecture

- Feature : `src/features/ai-trip-planner/`
- Page : `/dashboard/ai` (libellé menu « Planifier avec l’IA »)
- Persistance : table `ai_trip_planning_sessions`
- IA : `createAiProvider().generateRawJsonResponse` + schéma Zod `tripPlanningAiResponseSchema`
- Création : réutilise `createTrip`, `addStop`, `rebuildTripRouteFromCanonicalData`, `estimateTripFuel`

## Schéma de réponse IA

Voir `src/features/ai-trip-planner/schemas/draft.ts` (`tripPlanningAiResponseSchema`).
Le serveur valide, nettoie (IDs véhicule/groupe), géocode et recalcule distances/durées.

## API

| Méthode | Route | Rôle |
|---------|-------|------|
| GET/POST | `/api/ai-trip-planner/session` | Session active / création |
| GET/DELETE | `/api/ai-trip-planner/session/:id` | Lecture / abandon |
| POST | `/api/ai-trip-planner/session/:id/message` | Message utilisateur |
| POST | `/api/ai-trip-planner/session/:id/recalculate` | Recalcul itinéraire |
| POST | `/api/ai-trip-planner/session/:id/create-trip` | Création confirmée (`confirm: true`) |

## Entitlements

- `ai.planning.enabled` (même clé que l’assistant voyage)
- Limite de rate : `assertAiRateLimit`
- Création de voyage : `assertCanCreateTrip` via `createTrip`

## Variables d’environnement

Réutilise la configuration IA existante (`AI_PROVIDER`, clés fournisseur, etc.).
Aucune nouvelle clé secrète spécifique.

## Tests

```bash
npm run test -- tests/unit/ai-trip-planner.test.ts
```

## Procédure de validation

1. Ouvrir https://sebavio.com/dashboard/ai
2. Répondre aux questions (départ, destination, dates, véhicule)
3. Vérifier le résumé évolutif
4. Confirmer « Créer le voyage »
5. Vérifier la fiche voyage créée
