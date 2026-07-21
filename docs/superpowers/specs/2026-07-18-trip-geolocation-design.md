# Spécification — Géolocalisation voyage (mobile)

Date: 2026-07-18  
Statut: implémentation (corrections MVP Web intégrées)

## Objectif

Pendant un voyage `in_progress`, le propriétaire peut activer sa position GPS, la voir sur la carte, pause/reprise, recentrer, contextualiser météo / stations / activités, conserver un historique serveur temporaire, purgé à `completed` / `cancelled`.

## Limite MVP Web (obligatoire)

- Suivi garanti **uniquement** quand Sebavio est ouvert et visible au premier plan.
- Pas de suivi arrière-plan, pas de service worker GPS, pas de promesse UI contraire.
- Formulation discrète : « La position est mise à jour lorsque Sebavio est ouvert pendant votre voyage. »

## Consentement

1. Permission déjà `granted` → démarrage auto à l’ouverture du voyage actif.
2. Permission `prompt` → bouton « Activer ma position » (seul déclencheur de `watchPosition`).
3. Permission `denied` → explication + instruction paramètres ; aucun rappel répétitif.
4. Panneau compact confidentialité : visible propriétaire seul ; enregistrée pendant voyage actif ; supprimée à la fin/annulation.

## Architecture

```
navigator.geolocation.watchPosition
        ↓
useGeolocation
        ↓
useTripLocationTracking
        ├── permission / activation / pause
        ├── échantillonnage (50 m | 45 s)
        ├── buffer IndexedDB (max 20, FIFO)
        └── POST batch
                ↓
trip_locations (+ unique tripId+clientPointId)
```

## Données

`TripLocation` : id, tripId, userId, clientPointId, latitude, longitude, accuracyM, heading, speedMps, recordedAt, createdAt.  
Pas d’updatedAt / soft-delete. Indexes `(tripId, recordedAt)`, `(userId, recordedAt)`. Unique `(tripId, clientPointId)`. CASCADE sur Trip.

## API

- `POST /api/v1/trips/:id/locations` → `{ accepted, skipped, duplicates, latest }`
- Rate-limit serveur 1 point / 10 s (transaction + verrou ; skip silencieux)
- `GET .../latest` (404 si vide)
- `GET ...?since=&limit=` (défaut 500, max 2000, ordre recordedAt ASC, id ASC)

## Purge

Dans `completeTrip` / `cancelTrip` (transaction) + audit unique `purge_locations`.  
Cleanup de sécurité pour positions de voyages non `in_progress`.

## Helpers

- Haversine + `shouldKeepSample`
- `getEffectiveCoordinates` : live (<2 min, accuracy <500) → serveur frais → origin → null
- Ne jamais modifier l’origine persistée du voyage

## Headers

`Permissions-Policy: geolocation=(self)`
