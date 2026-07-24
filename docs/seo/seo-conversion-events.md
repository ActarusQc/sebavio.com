# Événements de conversion SEO — Sebavia

**Lot :** SEO 5B  
**Site :** https://sebavia.com  
**Principe :** mesurer les parcours issus du référencement naturel sans collecter de renseignements personnels.

## Outil analytique existant

| Outil | État |
| --- | --- |
| Google Analytics | Absent |
| Google Tag Manager | Absent |
| Plausible | Absent |
| Matomo | Absent |
| Umami | Absent |
| Analytics interne produit | Stub admin « Coming soon » — pas d’événements SEO |
| Bannière cookies / CMP | Absente |
| Consentement contact | Checkbox formulaire contact uniquement (pas analytics) |

**Décision lot 5B :** aucune activation automatique d’outil tiers. Une couche neutre `trackEvent` est ajoutée, **désactivée par défaut**, sans requête externe tant qu’aucun fournisseur n’est configuré.

Variables optionnelles (voir `.env.example`) :

- `NEXT_PUBLIC_ANALYTICS_PROVIDER` — vide = désactivé
- `NEXT_PUBLIC_ANALYTICS_WRITE_KEY` — jamais de secret serveur ; clé publique uniquement si un fournisseur le requiert plus tard
- `NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT` — `true` pour exiger un consentement avant envoi

Ne pas committer d’identifiants réels.

## Consentement

- Aujourd’hui : pas de CMP → le fournisseur par défaut (`noop`) n’envoie rien.
- Si un fournisseur tiers exige un consentement : `NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT=true` et brancher une bannière avant tout chargement de script.
- Ne jamais charger un script analytique avant consentement lorsque la configuration l’exige.

## Attribution SEO (prudente)

Propriétés autorisées lorsqu’un fournisseur est actif :

- `landing_path` — chemin d’entrée (sans query string complète)
- `referrer_host` — hôte du référent (pas l’URL complète si elle peut contenir des données)
- `utm_source` / `utm_medium` / `utm_campaign` — si présents
- `channel` — catégorie (`organic_search`, `direct`, `referral`, `other`)
- `first_visit_date` — jour UTC uniquement, si la solution le permet

Interdit : termes de recherche privés, reconstruction d’identité, stockage volontaire d’IP, GPS précis.

Search Console reste la source principale des requêtes Google.

## Catalogue d’événements

| Événement | Déclencheur | Page / zone | Objectif | Propriétés minimales | Données interdites | Consentement | Essentiel / analytique |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `seo_landing_view` | Affichage d’une landing SEO indexable | `/`, product pages, `/guides/*` | Mesurer l’entrée organique | `path`, `page_type`, `channel?` | PII, query complète | Selon fournisseur | Analytique |
| `pricing_view` | Affichage `/pricing` | `/pricing` | Intention commerciale | `path` | PII, prix personnalisés secrets | Selon fournisseur | Analytique |
| `registration_started` | Focus/submit début formulaire | `/register` | Entonnoir inscription | `path` | email, mot de passe | Selon fournisseur | Analytique |
| `registration_completed` | Inscription réussie (côté client après succès) | `/register` | Conversion compte | `path` | email, user id réel, mot de passe | Selon fournisseur | Analytique |
| `trip_creation_started` | Ouverture création voyage | dashboard / assistant | Intention produit | `surface` (`form` \| `assistant`) | origine/destination, prompt | Selon fournisseur | Analytique |
| `trip_created` | Voyage créé avec succès | dashboard / assistant | Activation | `surface` | trip id si non pseudonyme, lieux | Selon fournisseur | Analytique |
| `assistant_opened` | Ouverture assistant | dashboard AI / planner | Engagement | `surface` | contenu conversation | Selon fournisseur | Analytique |
| `assistant_trip_action_confirmed` | Confirmation création depuis assistant | AI trip planner | Conversion assistée | `surface` | prompt, lieux, messages | Selon fournisseur | Analytique |
| `plan_selected` | Clic forfait | `/pricing` | Intention d’achat | `plan_slug` | Stripe ids, email | Selon fournisseur | Analytique |
| `checkout_started` | Redirection Checkout | pricing / unlock | Entonnoir paiement | `plan_slug` | session Stripe, email, montant libre non affiché | Selon fournisseur | Analytique |
| `subscription_activated` | Retour succès abonnement (si page succès) | success / dashboard | Conversion payante | `plan_slug` | invoice, Stripe customer id | Selon fournisseur | Analytique |

## Renseignements personnels exclus

Aucun événement ne doit contenir :

- nom, courriel, téléphone, adresse personnelle ;
- origine/destination privée de voyage ;
- contenu de conversation / prompt ;
- identifiant Stripe, données de paiement ;
- IP stockée volontairement, GPS précis ;
- données de santé ou concernant des enfants ;
- paramètres d’URL complets pouvant contenir des données personnelles.

Utiliser uniquement des identifiants techniques pseudonymes si indispensables.

## Branchement futur

1. Choisir un fournisseur (ex. Plausible, ou GA4 derrière consentement).
2. Implémenter un adaptateur dans `src/lib/analytics/adapters/`.
3. Renseigner les variables d’environnement **sur le serveur uniquement**.
4. Ajouter une CMP si le fournisseur ou la loi l’exigent.
5. Ne pas modifier chaque composant : passer par `trackEvent`.
