# Rapport validation fonctionnelle — Assistant IA (mock)

Date: 2026-07-20  
Provider: `MockAiProvider` (`AI_PROVIDER=mock`, clé factice `sk-mock-validation-not-a-real-key`)  
Aucun appel OpenAI payant · Aucun déploiement · Aucun redémarrage PM2

## Scénario

| Champ | Valeur |
|-------|--------|
| Trip ID | `915d87de-2cc5-4c9d-b20f-2e4524bca537` |
| Titre | Gaspé |
| Origine | 68 Rue Soupras, Saint-Mathias-sur-Richelieu, QC |
| Destination finale | New Richmond, QC (corridor Gaspésie) |
| Distance baseline | **1144,18 km** / 765 min conduite |
| Arrêts initiaux | Plaines d'Abraham (activity), Gaspé (detour 60 min) |
| Fuel baseline | 2 arrêts ravitaillement, 57,65 L, 117,09 $ |
| Propriétaire | admin (`ai.planning` + `ai.recommendations` = true) |
| Retour | non configuré (`returnDistanceKm` = null) |

## Correctifs effectués pendant la validation

1. **Insertion intermédiaire** : `add_activity` / `add_pause` sans `activityId` calculent désormais `sequence` via `computeOutboundInsertSequence` (évite l’ajout en fin de liste qui doublait le trajet ~1144→2070 km).
2. **Lock concurrent** : `acquireAiRequestLock` capturé proprement → retourne `AI_007` au lieu d’une exception non gérée.
3. **Imports** : `getTripById` / `access` IA importent `access-resolve` (évite le barrel `subscriptions` + `next/server` en tests).

## Résultats par test

### Test 1 — Analyse (mock)
| | Avant | Après |
|--|-------|-------|
| Distance | 1144,18 | 1144,18 |
| Durée conduite | 765 | 765 |
| Fuel stops | 2 | 2 |
| Stops métier | 2 | 2 |

- Schéma Zod OK · historique `AiMessage` (2) · `AiUsage` analyze success (`mock-model`, prompt `trip-assistant-v1`)
- Aucune écriture métier

### Test 2 — Ajouter activité (Musée du Fjord, Saguenay)
**Après correctif d’insertion :**
- Ordre : Plaines → **Musée du Fjord (activity, 60 min, outbound)** → Gaspé → destination New Richmond
- Destination inchangée
- Fuel stops : conservés/recalculés (2→4 sur le 1er run avec fuel OK ; rate-limit FDE sur runs suivants)
- Compteurs activity ≠ fuel
- Retour non modifié (0 stops return)
- Confirmation obligatoire vérifiée

**Anomalie 1er run (corrigée) :** sans `sequence`, activité en fin de liste → distance 2070 km. Correctif appliqué et revalidé (ordre correct, distance stable).

### Test 3 — Pause Rimouski
- `stopType=rest`, outbound, 20 min
- Activités non remplacées · destination intacte · fuel non disparu

### Test 4 — Durée activité 60→90
- Seul le stop ciblé modifié · `totalDurationMin` +30 · distance inchangée · fuel présent

### Test 5 — Départ +2 h UTC
- Date civile cohérente · distance/durée inchangées · départ restauré ensuite

### Test 6 — Détour
- `applied=false`, `deferred=true` · `stopCount` inchangé

### Test 7 — Forfaits
- Découverte (`user@sebavio.local`) : `ai.planning.enabled=false` → démo unitaire (aucune donnée au provider)
- Admin propriétaire : planning + recommendations true
- Gate recommandations sans hardcode de slugs commerciaux

### Test 8 — Sécurité
- Non-propriétaire → `TRIP_001`
- Voyage inexistant → `TRIP_001`
- Message trop long → refus
- Rate-limit / lock → `AI_RATE_LIMIT` / `AI_007`
- Injection texte → pas de crash (mock)

## Tests automatisés ajoutés

- `tests/integration/ai-trip-assistant-functional.test.ts`
- `tests/unit/ai-apply-fuel-regression.test.ts`
- `tests/unit/ai-entitlements-security.test.ts`

## Suites exécutées

| Suite | Résultat |
|-------|----------|
| Intégration fonctionnelle IA | 8/8 OK |
| Unitaires AI + trips + itinerary + fuel + entitlements | 159/159 OK |
| typecheck | OK |
| lint | OK |
| build | OK |

## Limites observées

- Rate-limit FDE/maps après nombreux recalculs → `fuelRefuelStops` parfois 0 dans les snapshots (erreur capturée, pas une disparition métier).
- Voyage sans trajet retour configuré.
- `add_activity` sans coords ne peut pas calculer la séquence (append en fin) — les suggestions IA doivent idéalement fournir lat/lng.

## Fichiers modifiés (correctifs)

- `src/features/ai/services/apply-action.ts`
- `src/features/ai/services/trip-assistant.ts`
- `src/features/ai/services/access.ts`
- `src/features/trips/services/trips.ts` (import access-resolve)
- tests listés ci-dessus + `tests/unit/trips.test.ts` (mock access-gate)
- `tests/unit/ai-trip-assistant.test.ts` (mock path)

## Confirmations

- Aucune clé OpenAI réelle utilisée
- Aucun appel payant
- Aucun déploiement
- Aucun redémarrage PM2
- Route voyage restaurée à **1144,18 km** après validation
