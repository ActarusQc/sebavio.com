# Intégration FDE — Fuel Data Engine

Sebavio consomme les prix carburant via **FDE** (`https://fde.monteregia.com`), jamais directement auprès de Régie Essence Québec ni StatCan depuis le navigateur ou le métier.

```text
Navigateur Sebavio → Backend Sebavio → HTTPS + Bearer → FDE → Régie / StatCan
```

## Emplacement code

| Chemin | Rôle |
| --- | --- |
| `src/integrations/fde/` | Config, cache, métriques, client HTTP |
| `src/integrations/fde/client/` | Copie locale alignée sur `clients/fde-fuel-prices` (dépôt FDE) |
| `src/services/fuel-prices/fde/` | Mapping, médiane, lookup, provider, rate-limit |
| `src/features/fuel/services/fuel-cost-estimation.ts` | Orchestrateur litres × prix |
| `docs/integrations/fde/openapi-v1.yaml` | Contrat OpenAPI v1 |

## Remplacer le client local par le client officiel

1. Copier `clients/fde-fuel-prices/` depuis le dépôt FDE.
2. Remplacer `src/integrations/fde/client/`.
3. Adapter les imports `.js` si le bundler l’exige.
4. Conserver `fde-config.ts`, `fde-cache.ts`, `fde-client-factory.ts`.

## Documentation associée

- [configuration.md](configuration.md)
- [api-contract.md](api-contract.md)
- [fuel-price-selection.md](fuel-price-selection.md)
- [fallback-strategy.md](fallback-strategy.md)
- [security.md](security.md)
- [troubleshooting.md](troubleshooting.md)
- [../../features/fuel-cost-estimation.md](../../features/fuel-cost-estimation.md)
- [../../adr/fde-fuel-price-integration.md](../../adr/fde-fuel-price-integration.md)
