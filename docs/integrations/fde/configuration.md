# Configuration FDE

Variables (serveur uniquement, jamais `NEXT_PUBLIC_*`) :

| Variable | Défaut | Description |
| --- | --- | --- |
| `FDE_ENABLED` | `false` | Active le client FDE dans la chaîne de prix |
| `FDE_BASE_URL` | `https://fde.monteregia.com` | Domaine attendu en production |
| `FDE_API_KEY` | — | Bearer API key (obligatoire si activé) |
| `FDE_TIMEOUT_MS` | `5000` | Timeout HTTP |
| `FDE_NEARBY_DEFAULT_RADIUS_KM` | `10` | Rayon nearby |
| `FDE_NEARBY_MAX_RADIUS_KM` | `50` | Plafond rayon |
| `FDE_NEARBY_DEFAULT_LIMIT` | `20` | Limite stations |
| `FDE_NEARBY_MAX_LIMIT` | `50` | Plafond limite |
| `FDE_CACHE_TTL_SECONDS` | `300` | TTL cache Redis/mémoire |
| `FDE_STALE_PRICE_MAX_HOURS` | `24` | Âge max prix station |
| `FDE_ALLOW_STALE_CACHE_HOURS` | `6` | Réserve dégradée (doc) |

Production : HTTPS obligatoire + hôte dans `fde.monteregia.com`. Sans clé si `FDE_ENABLED=true` → refus.

## Rotation de clé

1. Créer une nouvelle clé côté FDE (`auth:create-key`, client `sebavio-production`).
2. Mettre à jour `FDE_API_KEY` sur le serveur.
3. Redémarrer PM2 / process Next.
4. Smoke `npm run test:live:fde`.
5. Révoquer l’ancienne clé FDE.
