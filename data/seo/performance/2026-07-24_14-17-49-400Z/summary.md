# Performance audit (laboratoire) — 2026-07-24_14-17-49-400Z

**Origine :** https://sebavia.com
**Nature des données :** Lighthouse laboratoire (simulation). **Pas** des Core Web Vitals utilisateurs réels.
**INP terrain :** non disponible — **TBT** utilisé comme indicateur de lab.
**CrUX / Search Console CWV :** non disponibles dans cet export.

## Budgets (indicatif)

- LCP ≤ 4000 ms
- CLS ≤ 0.25
- TBT ≤ 600 ms
- Images ≤ 1500 Ko
- JS ≤ 900 Ko

Les scores Lighthouse ne bloquent **pas** le build pour une variation mineure.

## Tableau par page (mobile / desktop)

| URL | Score mobile | Score desktop | LCP m/d | TBT m/d | CLS m/d | Poids m/d | Problème principal (mobile) |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| `/` | 68 | 36 | 3338 ms / 4124 ms | 1149 ms / 2374 ms | 0.000 / 0.000 | 695 Ko / 824 Ko | TBT élevé (1149 ms) |
| `/fonctionnalites` | 72 | 54 | 4042 ms / 3699 ms | 428 ms / 557 ms | 0.000 / 0.000 | 673 Ko / 681 Ko | LCP élevé (4042 ms) |
| `/pricing` | 72 | 43 | 3105 ms / 4010 ms | 972 ms / 902 ms | 0.000 / 0.000 | 646 Ko / 683 Ko | TBT élevé (972 ms) |
| `/assistant-voyage-ia` | 70 | 54 | 4050 ms / 3615 ms | 486 ms / 555 ms | 0.000 / 0.000 | 673 Ko / 683 Ko | LCP élevé (4050 ms) |
| `/planificateur-road-trip-quebec` | 74 | 53 | 4083 ms / 3808 ms | 377 ms / 582 ms | 0.000 / 0.000 | 688 Ko / 718 Ko | LCP élevé (4083 ms) |
| `/guides` | 87 | 58 | 3178 ms / 3014 ms | 297 ms / 560 ms | 0.000 / 0.000 | 681 Ko / 724 Ko | Aucun problème majeur détecté |
| `/guides/road-trip-nature-quebec` | 70 | 50 | 4098 ms / 3774 ms | 576 ms / 687 ms | 0.000 / 0.000 | 685 Ko / 712 Ko | LCP élevé (4098 ms) |
| `/guides/road-trip-gastronomique-quebec` | 75 | 56 | 4061 ms / 3621 ms | 359 ms / 476 ms | 0.000 / 0.000 | 686 Ko / 715 Ko | LCP élevé (4061 ms) |
| `/register` | 73 | 68 | 4229 ms / 3315 ms | 396 ms / 290 ms | 0.000 / 0.000 | 825 Ko / 825 Ko | LCP élevé (4229 ms) |

## Régressions vs latest

_Première baseline — aucune comparaison._

## Erreurs bloquantes

_Aucune._

