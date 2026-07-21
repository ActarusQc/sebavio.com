# Suggestions d'activités voyage

Module `src/features/trips/activities` — recherche Places API (New) côté serveur, classement déterministe, profil voyageurs.

## Variables d'environnement

| Variable | Rôle |
|----------|------|
| `TRIP_ACTIVITY_PROVIDER` | `google` (défaut) ou `mock` |
| `GOOGLE_PLACES_SERVER_API_KEY` | Optionnel ; sinon `GOOGLE_MAPS_PLACES_API_KEY` / `GOOGLE_MAPS_API_KEY` |
| `TRIP_ACTIVITY_AI_ENHANCEMENT_ENABLED` | `false` par défaut |

## Google Cloud (obligatoire)

Sur la clé serveur (`GOOGLE_MAPS_API_KEY` ou `GOOGLE_PLACES_SERVER_API_KEY`) :

1. Activer l'API **Places API (New)** sur le projet.
2. Facturation active.
3. Restrictions de clé → **API restrictions** : inclure explicitement **Places API (New)**  
   (sinon erreur `API_KEY_SERVICE_BLOCKED` / HTTP 403 — Geocoding/Directions peuvent fonctionner alors que Places est bloqué).
4. Restriction IP du VPS Contabo recommandée (pas de referrer HTTP).

Diagnostic local :

```bash
curl -sS -X POST 'https://places.googleapis.com/v1/places:searchNearby' \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $GOOGLE_MAPS_API_KEY" \
  -H "X-Goog-FieldMask: places.id,places.displayName,places.location" \
  -d '{"includedTypes":["park"],"maxResultCount":3,"locationRestriction":{"circle":{"center":{"latitude":46.81,"longitude":-71.21},"radius":15000}}}'
```

Un 200 avec `places` confirme la config. Un 403 `API_KEY_SERVICE_BLOCKED` indique une restriction de clé.

## UX

- Onglet principal **Activités** : `/dashboard/activities` (sélection d’un voyage planifié / en cours, exploration, étoile).
- Fiche voyage : section compacte **Activités choisies** uniquement (`saved` | `added_to_trip` | `completed`).
- Étoile : `suggested` ↔ `saved` (`toggleStarTripActivity` / action `star` | `toggle_star`).
- Ajout à l’itinéraire : durée sur place saisie manuellement ; si arrêt routier, `rebuildTripRouteFromCanonicalData` puis `estimateTripFuel`. Échec d’itinéraire → rollback de l’arrêt.
- Durée totale voyage : `totalDurationMin` = conduite + somme des `estimatedVisitMinutes` des activités `added_to_trip` / `completed`.
- **Destination immuable** : un arrêt activité est un waypoint intermédiaire. La destination reste `trip.destination*`. Ne jamais déduire la destination du dernier `TripStop` (bug carte / carburant corrigé via `buildTripRouteRequest` + `buildCanonicalRoutePoints`).

## APIs Sebavio

- `GET/PUT /api/v1/trips/:id/activities/profile`
- `GET/POST /api/v1/trips/:id/activities`
- `POST /api/v1/trips/:id/activities/generate`
- `PATCH/DELETE /api/v1/trips/:id/activities/:activityId` (actions : `add`, `reject`, `restore`, `star` / `toggle_star`)

## Budgets d'appels (anti-quota)

Une génération Places **ne consomme plus** `maps:rl` (geocode/directions/fuel).

| Limite | Valeur |
|--------|--------|
| Appels Google max / génération | 10 (`MAX_PLACES_CALLS_PER_GENERATION`) |
| Nearby | 1 appel / zone, ≤ 6 zones, ≤ 5 types |
| Text Search | destination uniquement, ≤ 2 requêtes |
| Budget horaire activités | 60 (`trip-act:rl:{userId}`) |

Les 429 Google sont journalisés en structured log `[trip-activities] places-quota` (sans corps brut ni clé).
