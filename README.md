# Sebavio

Compagnon de voyage intelligent — monolithe Next.js 16 (App Router).

## Prérequis

- [nvm](https://github.com/nvm-sh/nvm) avec Node.js 22 LTS
- PostgreSQL et Redis sur le serveur Contabo (via variables d'environnement)

```bash
cd /var/www/sebavio.com
nvm use          # lit .nvmrc → 22
cp .env.example .env
# Éditer .env avec les valeurs du serveur (jamais versionnées)
npm install
npm run dev
```

Le Node.js système (`/usr/bin/node`, v20) n'est pas utilisé pour ce projet.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run test:run` | Tests unitaires Vitest |
| `npm run quality` | lint + typecheck + tests + build |

## Architecture

Structure feature-first sous `src/` : `app`, `features`, `components`, `lib`, `services`, `hooks`, `types`, `prisma`, `tests`.

Source de vérité : dossier `docs/` (Documents 1 à 10 et 12).

## Interdictions

- Pas de Docker / conteneurisation
- Pas de secrets dans Git (`.env` exclu)
- Pas de code métier dans cette phase fondations
