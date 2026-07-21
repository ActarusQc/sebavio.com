# Sélection du prix de référence

Pour une estimation de trajet multi-zones :

1. Échantillonner des points le long de l’itinéraire (polyline / étapes).
2. Nearby dans le rayon configuré à chaque échantillon.
3. Filtrer carburant demandé, prix valides, fraîcheur ≤ `FDE_STALE_PRICE_MAX_HOURS`.
4. **Médiane** des prix (1 station → ce prix + indicateur faible couverture).
5. 0 station → fallback régional FDE pour ce point.
6. Sinon zone ignorée (pas de prix inventé) ; densification corridor possible à partir du dernier prix connu.

Le coût du voyage est ensuite calculé par **simulation de réservoir** (voir `docs/features/fuel-cost-estimation.md`), pas par `distance × prix_départ` seul.

Mode libre (`POST /api/v1/fuel/cost/estimate` sans `tripId`) : position de référence = point fourni (souvent le départ).
