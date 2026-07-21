# Dépannage FDE

| Symptôme | Cause probable | Action |
| --- | --- | --- |
| `FDE_001` | `FDE_ENABLED=false` | Activer + redémarrer |
| `FDE_002` | Clé / URL invalide | Vérifier `.env`, HTTPS prod |
| `FDE_004` / 504 | Timeout | Augmenter `FDE_TIMEOUT_MS` ou vérifier FDE |
| `FDE_005` / `FDE_006` | Auth | Rotation clé / permissions `fuel-sync.stations.read` |
| `FDE_007` | Rate-limit FDE | Attendre Retry-After |
| `FDE_009` | Aucune donnée | Vérifier zone QC / sync FDE |
| `EXT_RATE_LIMIT` | Rate-limit Sebavio | Attendre 1 h |

Smoke live : `npm run test:live:fde`
