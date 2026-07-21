# Remplacer le fournisseur Mock par un fournisseur commercial

## Prérequis

1. Contrat / licence du fournisseur (MOTOR, DataOne, Vehicle Databases, TorqueNode, autre).
2. URL d’API + clé serveur.
3. Validation juridique du droit de stocker et d’afficher les calendriers.

## Étapes

1. Renseigner dans `.env` (jamais dans le dépôt) :
   ```env
   MAINTENANCE_PROVIDER=commercial
   MAINTENANCE_PROVIDER_BASE_URL=https://api.votre-fournisseur.com
   MAINTENANCE_PROVIDER_API_KEY=xxxxx
   MAINTENANCE_ALLOW_MOCK=false
   ```
2. Redémarrer PM2 (`pm2 restart sebavio` ou process concerné).
3. Tester `POST /api/v1/vehicles/:id/maintenance/sync` sur un véhicule de test.
4. Vérifier que les tâches ont `officialManufacturerRecommendation` uniquement si
   le fournisseur le garantit contractuellement.
5. Désactiver toute valeur `MAINTENANCE_ALLOW_MOCK`.

## Adaptateur custom

Si l’API ne correspond pas au contrat générique `POST /v1/maintenance-schedule` :

1. Créer `src/services/maintenance-schedule/my-provider.ts`
2. Implémenter `MaintenanceScheduleProvider`
3. Normaliser via `normalizeRawTask` / `normalizeCommercialResponse`
4. Brancher dans `createMaintenanceProviderFromEnv`

## Smoke test

```bash
npm run test:live:maintenance
```
