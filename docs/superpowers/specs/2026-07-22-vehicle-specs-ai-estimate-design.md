# Spécification — Préremplissage conso / réservoir (NRCan + IA)

Date: 2026-07-22  
Statut: **brouillon validé en dialogue** — en attente relecture fichier  
Réf.: catalogue NRCan (`fuel-vehicle-catalog`), formulaire véhicule (`features/vehicles`), abstraction IA (`services/ai`), estimation carburant (`docs/features/fuel-cost-estimation.md`)

## 1. Objectif

Lors de la création (ou édition) d’un véhicule, préremplir automatiquement :

- la **consommation moyenne** (L/100 km) ;
- la **capacité du réservoir** (L) ;

dès qu’un véhicule est identifié (catalogue NRCan ou saisie manuelle marque / modèle / année), sans bloquer la création si l’estimation échoue. Les valeurs restent toujours modifiables par l’utilisateur.

## 2. Décisions produit

| Décision | Choix |
|----------|--------|
| Moment du préremplissage | À la sélection / saisie (approche A), pas au submit seul |
| Consommation | **NRCan prioritaire** si disponible ; sinon IA |
| Réservoir | Cache → sinon IA (NRCan ne fournit en général pas ce champ) |
| Saisie manuelle | Oui — IA dès que marque + modèle + année sont présents |
| Cache partagé | Oui — réutilisé pour tous les utilisateurs |
| Échec IA | Champs vides ; création possible |
| Saisie utilisateur en cours | Ne pas écraser une valeur déjà modifiée manuellement dans la session |

## 3. Architecture

```
Formulaire véhicule (create / edit)
        ↓ sélection config NRCan OU marque/modèle/année (debounce)
        ↓ POST /api/v1/vehicles/specs-estimate  (auth requise)
        ↓ features/vehicles/services/specs-estimate
             1. Résoudre conso NRCan (catalogEntryId) si présente
             2. Lire fuelTankCapacityL catalogue si déjà enrichi
             3. Lire cache (Redis + table vehicle_spec_estimates)
             4. Si manque conso et/ou réservoir → IA (createAiProvider)
             5. Valider bornes Zod ; persister cache
             6. Si catalogEntryId + réservoir IA → écrire fuelTankCapacityL
        ↓ JSON { consumptionL100, tankCapacityL, sources, confidence }
        ↓ UI préremplit OverridableNumberField (+ hints source)
```

Conventions :

- Aucun appel fournisseur IA depuis le client ni le code métier hors `services/ai`.
- Calculs métier inchangés : priorité réservoir déterministe existante (`tank_capacity_override` → catalogue → legacy).
- Rate-limit par utilisateur (aligné sur les endpoints externes véhicules / IA).

## 4. Comportement métier

### Entrée API

- `catalogEntryId` (UUID, optionnel) **ou**
- `make`, `model`, `year` (requis si pas de catalogEntryId) ;
- `configuration` / trim (optionnel) ;
- `fuelType` (optionnel, aide l’IA).

### Sortie API

```ts
{
  consumptionL100: number | null;
  tankCapacityL: number | null;
  sources: {
    consumption: "nrcan" | "ai_estimate" | "catalog_cache" | null;
    tankCapacity: "nrcan" | "ai_estimate" | "catalog_cache" | null;
  };
  confidence: "high" | "medium" | "low" | null; // pertinence IA / cache
}
```

### Priorité de résolution

**Consommation**

1. Valeur combinée NRCan de l’entrée catalogue (si `catalogEntryId`)
2. Cache (`vehicle_spec_estimates` / Redis)
3. Estimation IA
4. `null`

**Réservoir**

1. `vehicle_catalog_entries.fuel_tank_capacity_l` (si déjà renseigné)
2. Cache
3. Estimation IA → persistance cache (+ catalogue si id connu)
4. `null`

### Cache

- Clé normalisée : `make|model|year|configuration` (normalisation lowercase / trim) ; si `catalogEntryId`, clé primaire = cet id.
- Stockage **double** : Redis (hot path, TTL **90 jours**) + table Prisma `vehicle_spec_estimates` (persistance longue ; Redis miss → DB → éventuellement IA).
- Champs cache : conso, réservoir, source, confidence, `created_at` / `updated_at`, `deleted_at` (soft-delete projet).

### IA

- Via `createAiProvider().generateRawJsonResponse`.
- Prompt système : estimer conso combinée L/100 km et capacité réservoir L pour un véhicule nord-américain / canadien ; répondre JSON strict uniquement.
- Parse + validation Zod (bornes **conso 1–100**, **réservoir 10–500**).
- Hors bornes ou JSON invalide → traiter comme échec partiel (champ concerné `null`).
- **Véhicules 100 % électriques** : ne pas inventer une conso L/100 km ; `consumptionL100 = null` ; estimer uniquement le réservoir si pertinent (souvent `null` pour BEV). Les champs kWh / autonomie restent hors de cet endpoint.

### Rate-limit

- Ex. **10 requêtes / minute / utilisateur** (Redis).
- Dépassement → HTTP 429, message clair ; UI laisse les champs vides.

## 5. UI

- Formulaire véhicule : écoute sélection `NrcanVehiclePicker` + champs manuels.
- Debounce **~600 ms** en saisie manuelle.
- État « Estimation… » pendant l’appel.
- Hints sous consommation / réservoir : `NRCan` / `IA (estimé)` / `cache`.
- Ne pas écraser si l’utilisateur a déjà édité le champ depuis le dernier préremplissage (flag dirty local).
- Mapping des champs préremplis :
  - Conso **NRCan** → valeur suggérée (`manufacturer` / officielle catalogue) ; **pas** `customConsumptionL100`.
  - Conso **IA** (manuel ou gap) → `officialCombinedConsumptionL100` en saisie manuelle, sinon suggestion affichée (même canal que constructeur) ; pas d’override utilisateur tant que non modifié.
  - Réservoir **IA / cache** → `manufacturerTankCapacityL` (suggestion) ; `tankCapacityOverride` seulement si l’utilisateur modifie.

## 6. Persistance à la création véhicule

Inchangé côté create, enrichi par le préremplissage UI + éventuel `fuelTankCapacityL` catalogue :

- Conso NRCan déjà copiée depuis le catalogue à la création.
- Si estimation IA a écrit `fuelTankCapacityL` sur l’entrée catalogue, `createVehicle` la reprend déjà via `catalogEntry.fuelTankCapacityL`.
- En manuel : conso / réservoir issus des champs formulaire (préremplis).

## 7. Hors scope V1

- Job batch d’enrichissement hors parcours utilisateur
- Estimation kWh / autonomie électrique (champs déjà séparés)
- UI admin de correction du cache
- Remplacement de la résolution déterministe carburant voyage

## 8. Tests

- Unitaire : ordre NRCan > cache > IA ; bornes Zod ; clé de cache ; pas d’écrasement dirty (logique UI testable si extrait)
- Intégration : endpoint 401 sans auth ; cache hit sans appel IA (provider mock) ; écriture `fuelTankCapacityL` catalogue
- Mock AI provider pour les parcours CI

## 9. Critères d’acceptation

1. Sélection d’une config NRCan préremplit la consommation (valeur NRCan) sans appel IA pour la conso.
2. Le réservoir est prérempli via cache ou IA ; source visible.
3. Saisie manuelle marque/modèle/année déclenche l’estimation (debounce).
4. Second utilisateur / second véhicule même clé → cache hit (pas de second appel IA).
5. Échec IA ou rate-limit → création véhicule toujours possible.
6. Modification manuelle d’un champ n’est pas écrasée par une estimation suivante tant que dirty.
