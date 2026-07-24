# Lot SEO 5B — Performance Web, Bing et conversions

**Site :** https://sebavia.com  
**Prérequis :** lot 5A terminé (GSC, sitemap, baseline 22 URL).

## Livrables

| Livrable | Emplacement |
| --- | --- |
| Doc Bing Webmaster Tools | `docs/seo/bing-webmaster-tools.md` |
| Préparation Bing (HTTP) | `data/seo/bing-readiness/latest/` |
| Audit Lighthouse lab | `data/seo/performance/<id>/` + `latest/` + `initial/` |
| Événements conversion | `docs/seo/seo-conversion-events.md` |
| Revue mensuelle | `docs/seo/monthly-search-review.md` |
| Autorité externe | `docs/seo/authority-outreach.md` |
| Couche analytics | `src/lib/analytics/` |
| SoftwareApplication | JSON-LD accueil (avec Organization) |

## Commandes

```bash
npm run seo:bing:readiness
npm run seo:performance:audit
npm run seo:performance:production
npx vitest run tests/unit/seo-lot5b-*.test.ts
```

## Garde-fous

- Aucun nouveau guide.
- Aucun compte Google/Microsoft créé par l’agent.
- Aucun secret analytique dans Git.
- Lighthouse = laboratoire, pas CWV terrain.
- Pas de déploiement analytics tiers sans consentement si requis.
