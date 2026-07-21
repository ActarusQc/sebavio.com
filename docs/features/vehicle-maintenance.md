# Module entretien véhicule — Sebavio

## Architecture

Le module s’appuie sur `UserVehicle` (pas un modèle `Vehicle` séparé) et complète
l’entretien catalogue existant (`MaintenanceTemplate` / `MaintenanceSchedule`)
par une couche **fournisseurs de calendriers** :

```text
VIN (NHTSA vPIC) ──► confirmation utilisateur ──► UserVehicle
                                                      │
Marque/année/modèle ──────────────────────────────────┤
                                                      ▼
                              MaintenanceScheduleProvider
                              ├── MockMaintenanceProvider (dev/tests)
                              ├── CommercialMaintenanceProvider (env)
                              └── ManualFallbackProvider
                                                      │
                                                      ▼
                              ProviderMaintenanceSchedule
                              └── MaintenanceTaskDefinition[]
                                                      │
                              due-engine (km + mois) ──┤
                                                      ▼
                              VehicleMaintenanceReminder
                                                      │
Transport Canada ──► VehicleSafetyRecall
```

## Flux

1. Identification (VIN NHTSA ou saisie manuelle année/marque/modèle/finition/moteur).
2. Synchronisation calendrier (`POST .../maintenance/sync`).
3. Normalisation → km / mois / format interne.
4. Calcul des échéances (`overdue` | `due_now` | `due_soon` | `upcoming` | `unknown`).
5. Enregistrement d’un travail → recalcul de la prochaine échéance.
6. Rappels de sécurité TC (applicabilité VIN souvent incertaine).

## Variables d’environnement

Voir `.env.example` : `MAINTENANCE_PROVIDER*`, `NHTSA_VPIC_*`, `TRANSPORT_CANADA_RECALLS_*`.

- `MAINTENANCE_PROVIDER=mock` : démonstration uniquement.
- Mock **interdit** en `NODE_ENV=production` sauf `MAINTENANCE_ALLOW_MOCK=true`.
- Clés API : serveur uniquement, jamais `NEXT_PUBLIC_*`, jamais dans les logs.

## Ajouter un fournisseur commercial

1. Obtenir une licence (MOTOR, DataOne, Vehicle Databases, TorqueNode, …).
2. Configurer :
   ```env
   MAINTENANCE_PROVIDER=commercial
   MAINTENANCE_PROVIDER_BASE_URL=https://api.exemple.com
   MAINTENANCE_PROVIDER_API_KEY=...
   ```
3. L’endpoint attendu par `CommercialMaintenanceProvider` :
   `POST {BASE_URL}/v1/maintenance-schedule`
   Corps JSON : `{ vin?, year?, make?, model?, trim?, engine? }`
   Réponse validée Zod : `{ tasks: [...], providerVehicleId?, sourceVersion?, ... }`
4. Si le contrat API diffère, créer un adaptateur dans
   `src/services/maintenance-schedule/` implémentant `MaintenanceScheduleProvider`
   et l’enregistrer dans `createMaintenanceProviderFromEnv`.

Voir aussi `docs/features/maintenance-provider-commercial.md`.

## Cache

Table `maintenance_provider_cache` — clé SHA-256 (provider + VIN + année + marque + modèle + finition + moteur). TTL `MAINTENANCE_PROVIDER_CACHE_HOURS` (défaut 168 h).

## Calcul

Seuils (`src/services/maintenance-schedule/thresholds.ts`) :

- `due_now` : ≤ 500 km ou ≤ 30 jours
- `due_soon` : ≤ 2 000 km ou ≤ 90 jours
- `overdue` : km ou date dépassés

Inspection seule → jamais inventer un kilométrage de remplacement.

## Officiel vs Sebavio

- `officialManufacturerRecommendation=true` → libellé « Recommandation du fabricant »
- sinon → « Conseil préventif Sebavio »
- mock → avertissement démonstration explicite

## NHTSA

`src/services/vin-decode/` — DecodeVinValues. Résultat incomplet/ambigu → `isCertain=false`.

## Transport Canada

`src/services/safety-recalls/` — sync par année/marque/modèle.
Sans confirmation VIN : message
« Ce rappel pourrait concerner votre véhicule… ».
Script : `npm run recalls:sync`.

## Limites connues

- Pas de calendrier constructeur inventé.
- Sans fournisseur commercial ni mock autorisé → fallback manuel (liste vide).
- TC dépend de `TRANSPORT_CANADA_RECALLS_BASE_URL`.
- Licence commerciale obligatoire avant usage SaaS payant.

## Reprise d’erreur

1. Dernier calendrier DB conservé (`isStale=true`).
2. Cache persistant si encore valide.
3. Notification « Échec de synchronisation ».
4. Nouvelle tentative utilisateur / cron.

## Licence

Valider le contrat du fournisseur (stockage, affichage, attribution) avant activation commerciale.
