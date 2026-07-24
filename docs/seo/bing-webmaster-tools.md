# Bing Webmaster Tools — Sebavia

**Site :** https://sebavia.com  
**Objectif :** faire découvrir Sebavia à Bing sans créer de contenu ni modifier le DNS.

Ce document décrit uniquement des **actions manuelles** à réaliser avec un compte Microsoft propriétaire. Aucun agent ni script du dépôt ne crée de compte, ne stocke d’autorisation OAuth, ni ne contourne la vérification de propriété.

## Prérequis

- Propriété Google Search Console `sebavia.com` déjà validée (DNS) — lot SEO 5A.
- Sitemap live : `https://sebavia.com/sitemap.xml`
- Compte Microsoft personnel ou professionnel avec lequel vous gérez Bing Webmaster Tools.

## Procédure d’importation depuis Google Search Console

1. Ouvrir [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Se connecter avec le compte Microsoft propriétaire.
3. Choisir **Importer depuis Google Search Console** (ou équivalent « Import » / « Add a site » → import GSC).
4. Autoriser **temporairement** l’accès demandé par Microsoft pour lire la liste des propriétés Google Search Console (écran OAuth Google).
5. Sélectionner la propriété **`sebavia.com`** (domaine ou préfixe URL `https://sebavia.com`).
6. Confirmer l’importation de la propriété dans Bing Webmaster Tools.
7. Dans Bing → **Sitemaps** : vérifier que `https://sebavia.com/sitemap.xml` est présent ou l’ajouter une seule fois.
8. Dans **Exploration** / **Crawl** : vérifier que Bingbot explore le site (erreurs éventuelles, couverture).
9. **Ultérieurement**, dans le compte Google, retirer l’autorisation d’application Microsoft si elle n’est plus nécessaire (sécurité — principe du moindre privilège).

## Vérifications techniques déjà automatisées

Commande :

```bash
npm run seo:bing:readiness
```

Export : `data/seo/bing-readiness/latest/`

Contrôles :

| Contrôle | Attendu |
| --- | --- |
| `robots.txt` avec User-Agent Bingbot | HTTP 200, `Allow: /` |
| `sitemap.xml` | HTTP 200, locs `https://sebavia.com` |
| Pages publiques échantillon | HTTP 200 |
| Domaine historique `sebavio.com` | Absent des réponses publiques |
| Blocage spécifique Bingbot | Aucun |

## Ce que ce dépôt ne fait pas

- Créer un compte Microsoft ou Google.
- Stocker des jetons OAuth.
- Modifier les DNS.
- Soumettre automatiquement des URL en boucle.
- Promettre un classement Bing.

## Après l’importation

- Surveiller indexation et erreurs d’exploration dans Bing (données réelles Bing, distinctes des audits HTTP locaux).
- Conserver Google Search Console comme source principale des requêtes Google.
- Documenter la période dans `docs/seo/monthly-search-review.md`.
