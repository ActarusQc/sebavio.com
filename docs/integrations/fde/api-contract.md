# Contrat API FDE utilisé par Sebavio

Source : `openapi-v1.yaml` (copie du dépôt FDE `docs/integrations/sebavio/`).

## Auth

`Authorization: Bearer <FDE_API_KEY>`

## Endpoints utilisés

| Méthode | Chemin | Usage |
| --- | --- | --- |
| GET | `/api/v1/plugins/fuel-sync/stations/nearby` | Stations + prix |
| GET | `/api/v1/plugins/fuel-sync/regional-prices/latest` | Fallback StatCan |
| GET | `/api/v1/plugins/fuel-sync/status` | Santé (ops) |

## Identifiants stations

- `id` opaque (UUID) — ne pas reconstruire, ne pas dépendre du préfixe `fst_`.
- `canonicalId` / résolution `req-*` si renvoyés par FDE.

## Route Sebavio

`POST /api/v1/fuel/cost/estimate`

- Mode trajet : `{ "tripId": "<uuid>" }`
- Mode libre : distance, conso L/100, fuelType, referencePosition
