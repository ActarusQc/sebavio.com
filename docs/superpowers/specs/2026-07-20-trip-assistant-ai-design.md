# Spécification — Assistant IA de voyage (Phase IA 1)

Date: 2026-07-20  
Statut: **approuvé pour implémentation**  
Décisions utilisateur: approche 1, entitlements A, actions applicables B.

## 1. Objectif

Ajouter **Assistant Sebavio** sur chaque page de voyage : conversation contextuelle, actions rapides, suggestions structurées, application confirmée de 4 mutations via les services existants. Aucun remplacement des calculs déterministes (itinéraire, carburant, météo).

## 2. Architecture

```
UI Trip Detail → Sheet Assistant
        ↓ Server Actions (features/ai/actions)
        ↓ auth + ownership + entitlements + rate-limit + lock
        ↓ buildTripAssistantContext (DTO minimal)
        ↓ tripAssistantService
        ↓ AiProvider (services/ai) — OpenAI Responses | Mock
        ↓ Zod TripAssistantResponse
        ↓ persist AiConversation / AiMessage / AiUsage
```

- Domaine : `src/features/ai`
- Provider : `src/services/ai`
- Pas de streaming v1
- Pas d’écriture Prisma depuis le modèle génératif

## 3. Entitlements

| Capacité | Clé | Découverte | Pass / Plus |
|----------|-----|------------|-------------|
| Assistant personnalisé | `ai.planning.enabled` | off (démo statique) | on |
| Recommandations (activités, météo) | `ai.recommendations.enabled` | off | on |

- Question générale / carburant / horaire / analyse : `ai.planning.enabled` seul
- Suggestions d’activités / adapter météo : les deux clés
- Pas de clé `ai.trip_assistant.enabled`

## 4. Données Prisma

`AiConversation`, `AiMessage`, `AiUsage` — UUID v4, cascade depuis Trip, Restrict depuis User (aligné soft-delete User).

## 5. Actions applicables v1

| Action | Service | Recalc |
|--------|---------|--------|
| add_activity | `addStop` (stopType activity) ou `addActivityToTrip` si `activityId` | via addStop / addActivity |
| add_pause | `addStop` stopType `rest` | auto |
| update_activity_duration | `updateStop` (durée) ; sync `planTripActivity` si lié | updateStop |
| update_departure_time | `updateTrip` + `recalculateTripItineraryAtomic` | explicite |
| create_detour / route complexe | proposition seulement (« phase ultérieure ») | — |

## 6. Env

```
AI_ENABLED=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
AI_REQUEST_TIMEOUT_MS=45000
AI_MAX_MESSAGE_CHARS=2000
AI_RATE_LIMIT_MAX=30
AI_RATE_LIMIT_WINDOW_SECONDS=3600
```

## 7. Hors scope

Streaming, production deploy, PM2 restart, appels OpenAI payants dans les tests, modification catalogue forfaits hors entitlements déjà seedés.
