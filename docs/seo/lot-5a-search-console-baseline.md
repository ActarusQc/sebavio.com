# Lot SEO 5A — Google Search Console, indexation et référence SEO

**Site :** https://sebavia.com  
**Périmètre :** préparation surveillance + baseline technique (pas de nouveau guide).

## Objectifs atteints côté projet

1. Inventaire automatisé des URL publiques (source : `src/app/sitemap.ts` + crawl live).
2. Export versionné sous `data/seo/baseline/<execution_id>/` et `data/seo/baseline/latest/`.
3. Audits `sitemap.xml` et `robots.txt` (multi User-Agent).
4. Préparation / confirmation de la vérification Search Console.
5. Liste d’URL prioritaires à inspecter manuellement.
6. Détection des pages orphelines (0 lien entrant interne).
7. Documentation des actions manuelles GSC.
8. Aucun nouveau contenu éditorial ; aucune demande d’indexation automatique répétitive.

## Vérification Google Search Console

### Méthode déjà en place (ne pas supprimer)

| Élément | Détail |
| --- | --- |
| Méthode | Enregistrement **DNS TXT** sur l’apex `sebavia.com` |
| Domaine | `sebavia.com` (domaine public officiel) |
| Emplacement | Zone DNS du domaine (hors dépôt Git) |
| Exposition | Le TXT est public par design ; **aucune** valeur n’est codée en dur dans le dépôt |

### Méthode complémentaire préparée (optionnelle)

| Élément | Détail |
| --- | --- |
| Variable | `GOOGLE_SITE_VERIFICATION` (serveur uniquement, voir `.env.example`) |
| Emission | `src/app/layout.tsx` via `metadata.verification.google` |
| HTML | `<meta name="google-site-verification" content="…">` **uniquement** si la variable est définie |
| Git | Interdit de committer le jeton |

La méthode DNS suffit en général. La balise meta est un filet de sécurité si Google demande une seconde preuve.

## Actions manuelles dans Google Search Console

À effectuer dans l’interface Google (compte propriétaire) — **non automatisées** :

1. Ouvrir [Google Search Console](https://search.google.com/search-console) pour la propriété **`sebavia.com`** (domaine ou préfixe URL `https://sebavia.com`).
2. Confirmer que la vérification DNS est **Validée**.
3. **Sitemaps** → ajouter `https://sebavia.com/sitemap.xml` (une seule fois ; ne pas resoumettre en boucle).
4. **Inspection d’URL** : traiter dans l’ordre de `data/seo/baseline/latest/priority-indexing-urls.json`.
5. Pour l’accueil et 2–3 pages produit clés : demander l’indexation **une fois** si « URL connue mais non indexée » — pas de rafales.
6. Activer les alertes e-mail (couverture, sécurité, expériences de page).
7. Après quelques jours : lire Impressions / Requêtes / Pages ; **ne pas** créer de pages à partir de mots-clés seuls.

## Commandes projet

```bash
# Régénérer la référence SEO (live)
npm run seo:baseline

# Tests du lot
npx vitest run tests/unit/seo-lot5a-baseline.test.ts
```

## Garde-fous

- Présence sitemap ≠ indexation.
- Pas d’API Google Indexing pour les pages normales.
- Pas de simulation de données Search Console.
- Pas de modification DNS / Nginx / comptes Google par l’agent.
- Pas de nouveau guide dans ce lot.

## Livrables

- `scripts/seo-baseline.ts`
- `src/lib/seo/google-site-verification.ts`
- `src/lib/seo/page-type.ts`
- `data/seo/baseline/latest/*`
- `tests/unit/seo-lot5a-baseline.test.ts`
- ce document
