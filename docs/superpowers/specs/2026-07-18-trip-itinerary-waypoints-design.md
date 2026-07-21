# Spécification — Détours et étapes manuelles d'itinéraire

Date: 2026-07-18

## Cause des limitations précédentes

- Les `TripStop` existaient mais sans `direction`, durée sur place ni types détour dédiés.
- L'ajout manuel d'une étape ne recalculait pas automatiquement Directions + carburant (`isStale` jusqu'à Optimiser).
- Le trajet retour était un miroir de l'aller (pas de waypoints / polyline retour).
- L'UI carte était en lecture seule ; pas de réordonnancement drag-and-drop.

## Architecture retenue

Extension de `TripStop` (équivalent `TripWaypoint`) plutôt qu'une table parallèle :

- destination finale = toujours `Trip.destination*` (jamais le dernier stop)
- waypoints filtrés par `direction` (`outbound` | `return`)
- séquences indépendantes par direction (`@@unique([tripId, direction, sequence])`)
- recalcul atomique via `recalculateTripItineraryAtomic` (rollback route si fuel échoue)
- segments assemblés : origin → waypoints → destination (distance cumulative pour le fuel)

## Migrations

- `20260718180000_trip_stop_waypoints`
- `20260718181000_trip_stop_direction_sequence_unique`
