# Intégration météo OpenWeather (Sebavio)

## Objectif

Afficher des prévisions météo fiables pour les voyages à l’approche, via **OpenWeather One Call**, sans exposer la clé API au navigateur.

> Les limites gratuites et conditions commerciales OpenWeather peuvent changer.
> Vérifiez-les sur [openweathermap.org](https://openweathermap.org) avant toute mise en production.

## Créer et configurer une clé

1. Créez un compte sur [https://home.openweathermap.org/users/sign_up](https://home.openweathermap.org/users/sign_up).
2. Souscrivez à l’abonnement **One Call by Call** (One Call API 3.0 et/ou 4.0 selon l’offre disponible sur votre compte).
3. Copiez la clé API (onglet **API keys**).
4. Sur le serveur Contabo (environnement développement), renseignez dans `/var/www/sebavio.com/.env` :

```env
WEATHER_PROVIDER=openweather
WEATHER_ENABLED=true
WEATHER_MAX_DAILY_CALLS=900
OPENWEATHER_API_KEY=votre_clé
OPENWEATHER_BASE_URL=https://api.openweathermap.org
OPENWEATHER_ONECALL_VERSION=4
```

5. Redémarrez le process Next.js (PM2 / `npm run dev`) pour charger les variables.

**Ne jamais** préfixer la clé avec `NEXT_PUBLIC_`.

## Abonnement One Call

- Offre typique : **1 000 appels / jour** inclus, puis facturation à l’appel.
- Sebavio applique un plafond interne **`WEATHER_MAX_DAILY_CALLS=900`** pour conserver une marge.
- One Call **4.0** est modulaire (`/data/4.0/onecall/...`) : chaque endpoint compte comme un appel.
- One Call **3.0** (`/data/3.0/onecall`) renvoie current + hourly + daily + alerts en **un seul appel** — utile pour économiser le quota (`OPENWEATHER_ONECALL_VERSION=3`).

Les nouveaux comptes OpenWeather peuvent n’avoir accès qu’à la 4.0 : laissez `OPENWEATHER_ONECALL_VERSION=4`.

## Variables d’environnement

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `WEATHER_PROVIDER` | `openweather` | `openweather` \| `open-meteo` \| `off` |
| `WEATHER_ENABLED` | `true` | Coupe-circuit global |
| `WEATHER_MAX_DAILY_CALLS` | `900` | Plafond interne Redis |
| `OPENWEATHER_API_KEY` | — | Clé serveur |
| `OPENWEATHER_BASE_URL` | `https://api.openweathermap.org` | Base API |
| `OPENWEATHER_ONECALL_VERSION` | `4` | `3` ou `4` |
| `WEATHER_CLUSTER_RADIUS_KM` | `20` | Regroupement géographique |
| `WEATHER_TIMEOUT_MS` | `12000` | Timeout HTTP |
| `WEATHER_MAX_RETRIES` | `2` | Retry erreurs temporaires uniquement |
| `OPEN_METEO_API_KEY` | — | Alternative Open-Meteo |

## Cache

- Redis, clés `weather:v2:{provider}:{lat}:{lng}:{parts}:{window}`.
- TTL selon proximité du voyage :
  - \> 5 jours : 6 h
  - 2–5 jours : 3 h
  - \< 48 h : 60 min
  - voyage en cours : 30 min
- Copie stale 7 jours pour repli si quota / panne.
- Cache négatif 10 min après erreur temporaire.
- Coalescing des requêtes in-flight identiques.

## Contrôle des 900 appels

- Compteur Redis `weather:daily_calls:YYYY-MM-DD` (UTC), remise à zéro quotidienne.
- Refus propre (`provider_limit_reached`) si dépassement.
- En cas de limite : utilisation des dernières données valides en cache si présentes.
- Rate-limit utilisateur existant (60 req/h) conservé.

## Fenêtre d’affichage

| Situation | Comportement |
| --- | --- |
| \> 16 jours | Aucun appel ; message d’approche |
| 9–16 jours | Aucun appel ; « prévisions détaillées pas encore disponibles » |
| ≤ 8 jours | Prévisions quotidiennes |
| ≤ 48 h | + horaires |
| En cours | Actuel + horaires + alertes |

La disponibilité réelle des données API prime toujours sur ces fenêtres.

## Fallback

1. Cache frais
2. Appel fournisseur
3. Cache stale si quota / erreur temporaire
4. Message UX — **jamais** de moyenne climatique inventée

## Ajouter un autre fournisseur

1. Implémenter `WeatherProvider` (`getForecast(input) → WeatherForecast`).
2. Ajouter le mapping vers le modèle normalisé.
3. Brancher dans `createWeatherProviderFromEnv()` via `WEATHER_PROVIDER`.
4. Le reste de l’app (features, UI) ne doit pas importer les JSON du fournisseur.

## Smoke test manuel

```bash
# Avec une vraie clé (consommation d’appels réelle)
npm run test:live:openweather
```

Sans clé, le script s’arrête proprement.

## Limites actuelles

- Pas encore de moteur complet de recommandations d’activités (classifieur prêt).
- Pas d’historique météo persisté en base (`weather_cache` Doc 4 reporté).
- One Call 4.0 peut consommer plusieurs appels par lieu (current / 1h / 1day / alertes).
- Icônes servies depuis le CDN OpenWeather (domaine externe).

## Architecture applicative

- Abstraction : `src/services/weather`
- Feature : `src/features/weather`
- Route voyage : `GET /api/v1/trips/:id/weather`
- UI : `<TripWeatherSection tripId={…} />`
