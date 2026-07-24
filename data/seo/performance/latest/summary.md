# Performance audit (laboratoire) — 2026-07-24_14-50-24-490Z

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
| `/` | 61 | 38 | 4167 ms / 4017 ms | 1237 ms / 2397 ms | 0.000 / 0.000 | 696 Ko / 824 Ko | LCP élevé (4167 ms); TBT élevé (1237 ms) |
| `/fonctionnalites` | 71 | 60 | 4019 ms / 3786 ms | 501 ms / 373 ms | 0.000 / 0.000 | 673 Ko / 682 Ko | LCP élevé (4019 ms) |
| `/pricing` | 69 | 55 | 4066 ms / 3632 ms | 496 ms / 427 ms | 0.000 / 0.000 | 645 Ko / 681 Ko | LCP élevé (4066 ms) |
| `/assistant-voyage-ia` | 91 | 60 | 2785 ms / 3630 ms | 241 ms / 399 ms | 0.000 / 0.000 | 674 Ko / 683 Ko | Aucun problème majeur détecté |
| `/planificateur-road-trip-quebec` | 79 | 66 | 3634 ms / 3610 ms | 443 ms / 272 ms | 0.000 / 0.000 | 690 Ko / 714 Ko | Aucun problème majeur détecté |
| `/guides` | 87 | 63 | 3476 ms / 3555 ms | 211 ms / 358 ms | 0.000 / 0.003 | 682 Ko / 726 Ko | Aucun problème majeur détecté |
| `/guides/road-trip-nature-quebec` | 63 | 48 | 4314 ms / 3914 ms | 690 ms / 832 ms | 0.000 / 0.000 | 685 Ko / 715 Ko | LCP élevé (4314 ms); TBT élevé (690 ms) |
| `/guides/road-trip-gastronomique-quebec` | 67 | 51 | 4170 ms / 3685 ms | 607 ms / 723 ms | 0.000 / 0.000 | 687 Ko / 715 Ko | LCP élevé (4170 ms); TBT élevé (607 ms) |
| `/register` | 87 | 63 | 3280 ms / 3472 ms | 268 ms / 350 ms | 0.000 / 0.022 | 826 Ko / 827 Ko | Aucun problème majeur détecté |

## Régressions vs latest

_Aucune régression bloquante détectée._

## Erreurs bloquantes

_Aucune._

