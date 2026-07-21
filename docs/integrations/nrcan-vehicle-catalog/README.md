# Catalogue véhicules — Ressources naturelles Canada

## Source officielle

- **Jeu de données** : [Cotes de consommation de carburant / Fuel consumption ratings](https://open.canada.ca/data/en/dataset/98f1a129-f628-4ce4-b24d-6f16bf24dd64)
- **Producteur** : Ressources naturelles Canada
- **Identifiant CKAN** : `98f1a129-f628-4ce4-b24d-6f16bf24dd64`
- **API de découverte** : `https://open.canada.ca/data/api/3/action/package_show?id=98f1a129-f628-4ce4-b24d-6f16bf24dd64`

Les URL de fichiers CSV individuels peuvent changer ; Sebavio les découvre via l’API CKAN à chaque synchronisation.
Les téléchargements sont souvent redirigés vers le CDN officiel `opencanada.blob.core.windows.net` (autorisé côté serveur).

### Attribution

Données ouvertes du gouvernement du Canada — Ressources naturelles Canada.
Ce catalogue **ne représente pas** tous les véhicules immatriculés au Québec ; il couvre les modèles et configurations publiés dans les cotes officielles canadiennes (environ 1995 → année la plus récente).

## Architecture

Module : `src/features/fuel-vehicle-catalog/`

| Couche | Rôle |
|--------|------|
| `domain/` | Normalisation, validation, mapping de colonnes FR/EN |
| `application/` | Sync + recherche |
| `infrastructure/` | HTTP sécurisé, détection ressources, CSV, Prisma, verrou Redis |
| `components/` | Sélecteur progressif + panneau admin |

Distinct du catalogue VR/constructeurs (`src/features/vehicle-catalog/` → `Manufacturer` / `VehicleModel`).

## Modèles Prisma

- `VehicleCatalogEntry` → `vehicle_catalog_entries`
- `VehicleCatalogSync` → `vehicle_catalog_syncs`
- `UserVehicle.catalogEntryId` + champs `official_*_consumption_l100`, `fuel_type`, `consumption_data_source`

## Synchronisation

### Import initial (production / développement)

```bash
cd /var/www/sebavio.com
. ~/.nvm/nvm.sh && nvm use
npm run vehicle-catalog:sync
# ou forcer :
npm run vehicle-catalog:sync -- --force
```

### Planification (cron Linux)

Exemple hebdomadaire (dimanche 03:30) — à installer avec approbation serveur :

```cron
30 3 * * 0 cd /var/www/sebavio.com && . ~/.nvm/nvm.sh && nvm use && npm run vehicle-catalog:sync >> /var/log/sebavio-vehicle-catalog-sync.log 2>&1
```

### Admin

- Page : `/admin/catalogue-carburant`
- API : `POST /api/v1/admin/vehicle-catalog/sync` (admin)
- Statut : `GET /api/v1/admin/vehicle-catalog/status`

### Comportement

- Idempotent (clé `source_key` déterministe)
- Skip si checksum inchangé
- En cas d’échec partiel : conserve le catalogue déjà importé
- Verrou Redis + garde DB `status=running`

## Variables d’environnement

Voir `.env.example` (`VEHICLE_CATALOG_*`).

## API recherche (authentifié)

- `GET /api/v1/vehicle-catalog/years`
- `GET /api/v1/vehicle-catalog/makes?year=`
- `GET /api/v1/vehicle-catalog/models?year=&make=`
- `GET /api/v1/vehicle-catalog/configurations?year=&make=&model=`
- `GET /api/v1/vehicle-catalog/vehicles/:id`

## Ordre des sources de consommation

1. Moyenne réelle des pleins (≥ 2 pleins complets)
2. Consommation personnalisée (`real_avg_consumption`)
3. Consommation officielle catalogue / NRCan
4. Aucune (pas de valeur inventée)

## Limites

- Véhicules avant 1995, certains importés, lourds, VR, configs rares : hors catalogue → mode manuel (`user_manual`)
- Fichiers originaux 2-cycle 1995–2014 exclus (on utilise la série 5-cycle ajustée)
- Prix FDE : types `electric` / `plugin_hybrid` → non applicable ; `ethanol` / `natural_gas` → non supportés FDE

## Dépannage

| Symptôme | Action |
|----------|--------|
| Sync 409 | Attendre fin / vérifier sync `running` stale |
| 0 ressources | Vérifier `VEHICLE_CATALOG_SOURCE_DATASET_URL` et accès HTTPS open.canada.ca |
| Redis down | Sync possible via garde DB ; cache recherche désactivé |
| Menus vides | Lancer `npm run vehicle-catalog:sync` |

## Ajouter une source future

1. Autoriser le domaine dans `ALLOWED_DOWNLOAD_HOSTS`
2. Étendre `resource-detector` / `columns` / `normalizeFuelType`
3. Documenter l’attribution et la licence
4. Ajouter tests de parsing
