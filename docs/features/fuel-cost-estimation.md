# Estimation du coût de carburant

## Formules

### Consommation

```text
litres consommés = distanceKm × consommationLPer100Km / 100
```

### Coût (simulation)

Le coût persiste représente les **litres achetés pendant le trajet**, pas toute la consommation.
Par défaut le réservoir est considéré plein au départ et ce plein initial n’est **pas** facturé
(`FUEL_INITIAL_TANK_STRATEGY=full_unbilled`).

### Capacité réservoir (obligatoire)

Priorité déterministe :

1. `tank_capacity_override` (saisie manuelle)
2. `vehicle_catalog_entries.fuel_tank_capacity_l` (si enrichi)
3. `vehicle_models.fuel_capacity_l` (legacy)

**Aucun fallback silencieux à 80 L.** Sans capacité → erreur `VEHICLE_TANK_CAPACITY_REQUIRED`.
Le catalogue NRCan ne fournit pas la capacité du réservoir.

### Économie comparable (règle absolue)

Plusieurs stratégies candidates sont évaluées (prix de départ, nécessaire seulement,
pleins complets, partiels, anticipés, glouton, DP). La stratégie retenue est la
**moins coûteuse valide**.

Comparaison du carburant final (méthode retenue) :

```text
coût_net = coût_achats − max(0, restant − réserve) × prix_départ
```

Niveau cible implicite = réserve minimale à destination ; le surplus est crédité
au prix de départ pour ne pas favoriser une arrivée « à sec ».

```text
économie_affichée = max(0, coût_net_naïf − coût_net_retenu)
```

Si aucune stratégie n’est moins chère que le ravitaillement standard → retenir la
naïve, économie **0 CAD**, message : aucune optimisation avantageuse.
**Jamais d’économie négative présentée comme un succès.**

### Granularité des prix

Un prix nearby n’est `station_exact` que s’il est propre à la station.
Si le même identifiant de prix (`prix|observedAt|collectedAt`) est partagé par
plusieurs stations → `regional_estimate` (jamais « exact »).

Le rapport de couverture distingue : exacts / ville / régionaux / sans prix /
valeurs distinctes / identifiants distincts / candidates / arrêts retenus.

### Anti-micro-arrêts

Config : achat min 10 L, économie nette min 3 CAD, Δprix 0,03 $/L, intervalle
min 75 km entre arrêts facultatifs. Exception : achat de sécurité obligatoire.

## Stations le long du trajet

Source : **FDE** `stations/nearby` (pas Google Places pour les stations).

1. Décoder la polyline
2. Échantillonner tous les ~40 km (configurable)
3. Nearby FDE (rayon 5 km, élargi à 10 km si peu dense)
4. Dédupliquer par `canonicalId` / `id`
5. Projeter sur le tracé (distance + détour)
6. Prix exact station, sinon prix régional FDE de la région de la station

FDE nearby n’expose pas de `next_page_token` : la couverture repose sur plusieurs points d’échantillonnage + `limit` max.

## Calcul des pleins (v2)

Le panneau voyage calcule le **coût réel des pleins** :

- niveau initial configurable (vide → plein);
- plein de départ automatique, manuel (montant) ou aucun;
- stratégies : plein complet / quantité nécessaire / optimisation;
- aller-retour avec conservation du carburant restant;
- options plein à destination / réservoir plein à la fin.

Deux totaux distincts :

1. **Argent dépensé** — achats réellement payés (départ + route + optionnels);
2. **Valeur du carburant consommé** — valorisation de toute la conso (inclut le stock initial si l’option est cochée).

Payload validé Zod : `fuelEstimateSchema` (`src/features/fuel/schemas`).

