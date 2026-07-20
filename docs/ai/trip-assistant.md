# Assistant IA de voyage — Phase IA 1

## Architecture

```
UI (TripAssistantPanel / Sheet)
  → Server Actions (features/ai/actions)
  → auth + ownership + entitlements + rate-limit + lock
  → buildTripAssistantContext (DTO)
  → AiProvider (services/ai) — OpenAI Responses | Mock
  → validation Zod TripAssistantResponse
  → AiConversation / AiMessage / AiUsage
```

- Domaine : `src/features/ai`
- Provider : `src/services/ai`
- Calculs déterministes (itinéraire, carburant, météo) inchangés

## Variables d’environnement

| Variable | Défaut | Rôle |
|----------|--------|------|
| `AI_ENABLED` | `false` | Active l’assistant (nécessite aussi une clé) |
| `OPENAI_API_KEY` | — | Clé serveur uniquement |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Modèle Responses |
| `AI_PROVIDER` | auto | `mock` force le mock |
| `AI_REQUEST_TIMEOUT_MS` | `45000` | Timeout appel |
| `AI_MAX_MESSAGE_CHARS` | `2000` | Longueur max message |
| `AI_RATE_LIMIT_MAX` | `30` | Requêtes / fenêtre |
| `AI_RATE_LIMIT_WINDOW_SECONDS` | `3600` | Fenêtre rate-limit |

Désactivation rapide : `AI_ENABLED=false` (ou retirer la clé).

## Forfaits

- Gate principal : `ai.planning.enabled`
- Recommandations (activités / météo) : aussi `ai.recommendations.enabled`
- Découverte : démo statique, aucune donnée voyage envoyée à l’IA
- Pass 30 j / Sebavio Plus : accès personnalisé (selon seed)

## Réponses structurées

Schéma Zod : `TripAssistantResponse` + `ProposedTripAction`.  
Toute réponse hors schéma est rejetée (ou nettoyée une fois puis rejetée).

## Actions proposées

Applicables v1 (après confirmation) :

- `add_activity` → `addStop` / `addActivityToTrip`
- `add_pause` → `addStop` (`rest`)
- `update_activity_duration` → `updateStop` (+ sync `planTripActivity`)
- `update_departure_time` → `updateTrip` + `recalculateTripItineraryAtomic`

`create_detour` / `other` : informatif uniquement (« bientôt »).

## Données envoyées au fournisseur

DTO minimal (titres, dates, distances, arrêts arrondis, météo, véhicule sans VIN, pas de GPS précis sauf voyage actif + geo + besoin).

## Données enregistrées

Messages conversation + payload structuré ; métriques `AiUsage` (tokens, durée, type, forfait, version prompt). Pas de clé, pas de prompt système complet, pas de GPS précis.

## Diagnostic

1. Vérifier `AI_ENABLED` et présence de `OPENAI_API_KEY` (sans l’afficher)
2. Admin `/admin/ai` — compteurs erreurs / durée
3. Logs serveur `[ai]` (sans secrets)
4. Tester avec `AI_PROVIDER=mock`

## Remplacer le modèle

Changer uniquement `OPENAI_MODEL` (ou la config `getAiRuntimeConfig`).

## Migration

```bash
npx prisma migrate deploy
npx prisma generate
```

Migration : `prisma/migrations/20260720180000_ai_trip_assistant`
