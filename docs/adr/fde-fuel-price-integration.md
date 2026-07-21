# ADR — Intégration FDE pour les prix carburant

## Statut

Accepté — 2026-07-16

## Contexte

Sebavio estimait les prix via ingestion locale Régie Essence Québec. Un service indépendant FDE centralise désormais Régie + StatCan.

## Décision

- Consommer FDE uniquement depuis le backend Sebavio (`src/integrations/fde`).
- Client local compatible OpenAPI v1 (remplaçable par `clients/fde-fuel-prices`).
- Prix de référence = **médiane** nearby ; fallback régional FDE.
- Conserver l’ingestion Régie locale hors chemin d’estimation tant que `FDE_ENABLED=true`.
- Redis pour cache court + rate-limit (déjà présent).

## Conséquences

- Plus d’appel Régie/StatCan direct pour l’estimation lorsque FDE est actif.
- Dépendance runtime à FDE + clé API.
- Attribution et fraîcheur exposées au frontend.
