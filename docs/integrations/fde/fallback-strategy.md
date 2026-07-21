# Fallback régional

Si aucune station exploitable :

1. Appeler FDE `regional-prices/latest` (CA/QC, région hint ou Montréal).
2. Marquer `fallbackUsed: true`, `granularity: regional`.
3. Attribution StatCan — ne jamais présenter comme prix de station.

Si FDE nearby échoue (réseau/5xx) : tentative fallback régional, sinon erreur contrôlée (503/504/502).

**Pas de prix codé en dur.**
