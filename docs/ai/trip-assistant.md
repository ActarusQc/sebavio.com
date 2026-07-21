# Assistant IA de voyage — Phase IA 1 (xAI / Grok)

## Architecture

```
UI (TripAssistantPanel / Sheet)
  → Server Actions (features/ai/actions)
  → auth + ownership + entitlements + rate-limit + lock
  → buildTripAssistantContext (DTO)
  → AiProvider (services/ai) — xAI Responses | OpenAI Responses | Mock
  → validation Zod TripAssistantResponse
  → AiConversation / AiMessage / AiUsage
```

- Domaine : `src/features/ai`
- Provider : `src/services/ai`
- Moteur officiel : **xAI (Grok)** via `XaiAiProvider`
- Identité produit : **Assistant Sebavio** (Grok = moteur technique uniquement)
- Calculs déterministes (itinéraire, carburant, météo) inchangés

## Variables d’environnement

| Variable | Défaut | Rôle |
|----------|--------|------|
| `AI_ENABLED` | `false` | Active l’assistant (nécessite clé + modèle) |
| `AI_PROVIDER` | `xai` si clé xAI, sinon `openai` si clé OpenAI, sinon `mock` | `xai` \| `openai` \| `mock` |
| `XAI_API_KEY` | — | Clé serveur xAI uniquement |
| `XAI_MODEL` | — | Modèle Grok (ex. `grok-4.3`, `grok-4.5`) — **ne pas hardcoder ailleurs** |
| `XAI_BASE_URL` | `https://api.x.ai/v1` | Base URL API xAI |
| `XAI_REQUEST_TIMEOUT_MS` | `60000` (sinon `AI_REQUEST_TIMEOUT_MS`) | Timeout appel xAI |
| `OPENAI_API_KEY` | — | Retour arrière optionnel (`AI_PROVIDER=openai`) |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Modèle OpenAI (retour arrière) |
| `AI_REQUEST_TIMEOUT_MS` | `45000` | Timeout générique / OpenAI |
| `AI_MAX_MESSAGE_CHARS` | `2000` | Longueur max message |
| `AI_RATE_LIMIT_MAX` | `30` | Requêtes / fenêtre |
| `AI_RATE_LIMIT_WINDOW_SECONDS` | `3600` | Fenêtre rate-limit |

**Disponibilité « En ligne »** : `AI_PROVIDER=xai` + `AI_ENABLED=true` + `XAI_API_KEY` présente + `XAI_MODEL` présent.

Désactivation rapide : `AI_ENABLED=false` (ou retirer la clé).

## Sélection du fournisseur

Fabrique : `createAiProvider()` dans `src/services/ai/index.ts`.

```ts
AI_PROVIDER=xai   // officiel — Grok via Responses API
AI_PROVIDER=openai // retour arrière OpenAI
AI_PROVIDER=mock   // tests / démo sans réseau
```

`OPENAI_API_KEY` n’est **pas** requis lorsque `AI_PROVIDER=xai`.

## API xAI (Responses)

- Endpoint : `client.responses.create`
- Base URL : `https://api.x.ai/v1`
- **`store: false`** obligatoire (historique local Sebavio uniquement)
- Pas de `previous_response_id` en v1
- Pas d’outils Grok (Web Search, X Search, etc.) en v1
- Réponses structurées : `json_object` + validation Zod `TripAssistantResponse` (contrat interne inchangé)

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

## Données conservées

- Local : `AiConversation`, `AiMessage`, `AiUsage` (provider, modèle, jetons, durée, type, forfait, version prompt)
- xAI : **rien** (`store: false`)
- Jamais enregistré : clé API, prompt système complet, GPS précis

## Administration

`/admin/ai` affiche : fournisseur (xAI), modèle configuré, requêtes, erreurs, durée moyenne, jetons entrée/sortie/total, types de demandes, version prompt, forfait.

Jamais affiché : clé API, fin de clé, valeur masquée.

# Recherche Web Grok (tourisme) — ciblée uniquement
AI_WEB_SEARCH_ENABLED=true
AI_WEB_SEARCH_DAILY_LIMIT=20
AI_WEB_SEARCH_MAX_PER_CONVERSATION=5
AI_WEB_SEARCH_TIMEOUT_MS=90000
AI_ROUTE_SEARCH_RADIUS_KM=50
AI_ROUTE_MAX_DETOUR_KM=30

## Modes de connaissance

- `trip_context` : données Sebavio uniquement (analyse, carburant, horaire, météo)
- `web_grounded` : recherche Web xAI (`tools: [{ type: "web_search" }]`) pour restaurants, hôtels, tourisme

Point médian = 50 % de la distance **routière** (polyline), pas le barycentre géographique.

Désactivation rapide recherche Web : `AI_WEB_SEARCH_ENABLED=false`.


## Changer de modèle Grok

Modifier uniquement `XAI_MODEL` (ex. `grok-4.3` → `grok-4.5`). Aucun changement de code.

Si le modèle n’est pas accessible au compte xAI : erreur de configuration serveur, message générique utilisateur.

## Retour arrière OpenAI

```
AI_PROVIDER=openai
AI_ENABLED=true
OPENAI_API_KEY=<clé>
OPENAI_MODEL=gpt-4.1-mini
```

## Migration base

```bash
npx prisma migrate deploy
npx prisma generate
```

Migration provider : `prisma/migrations/20260721090000_ai_usage_provider`

## Activation serveur (développement)

Inscrire manuellement dans `/var/www/sebavio.com/.env` :

```
AI_PROVIDER=xai
AI_ENABLED=true
XAI_API_KEY=<votre clé>
XAI_MODEL=grok-4.3
XAI_BASE_URL=https://api.x.ai/v1
```

Puis build + redémarrage PM2 `sebavio` (après confirmation de la clé).
