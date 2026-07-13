# Document 8 — Préparation du serveur Contabo et des environnements

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

DOCUMENT 8 - PARTIE 1

### Préparation du serveur Contabo et des environnements

Roadmap détaillée pour préparer l'infrastructure de développement, de préproduction et de production du SaaS compagnon de voyage intelligent.

### Version

### Infrastructure cible

### Approche de déploiement

### Base de données

### Cache

### SSL

Document 8 - Partie 1 | Roadmap de développement

1.0

VPS Contabo - Ubuntu Server LTS

Node.js + PM2 + Nginx, sans Docker

PostgreSQL

Redis

Let's Encrypt

Page 1

### 1. Objectif de la phase

Préparer une infrastructure propre, sécurisée, reproductible et suffisamment stable pour soutenir toutes les phases suivantes du développement. Cette partie doit être terminée avant l'initialisation du projet Next.js afin d'éviter les changements d'environnement en cours de développement.

**Résultat** **attendu** **:** un serveur Contabo opérationnel avec des environnements séparés, un accès sécurisé, les services de base installés, les domaines préparés, la journalisation activée et une procédure de sauvegarde testée.

### 2. Périmètre

	•	Vérification du VPS Contabo et de ses ressources. •	Durcissement initial d'Ubuntu.

	•	Création des utilisateurs système et des accès SSH.

	•	Installation de Node.js, PM2, Nginx, PostgreSQL, Redis et Git.

	•	Création des environnements développement, préproduction et production. •	Préparation DNS, domaines et certificats TLS.

	•	Mise en place de la journalisation, du monitoring et des sauvegardes. •	Validation finale avec une checklist de sortie.

### 3. Hypothèses techniques

### Élément

Système

Déploiement

Processus applicatifs

Reverse proxy

Runtime

Base de données

ORM futur

Cache

Certificats

Dépôt

Développement

Document 8 - Partie 1 | Roadmap de développement

### Décision

Ubuntu Server 24.04 LTS ou version LTS compatible

Sans Docker

PM2

Nginx

Node.js 22 LTS

PostgreSQL 17

Prisma

Redis

Let's Encrypt / Certbot

GitHub

Cursor

Page 2

### 4. Séquence détaillée d'exécution

### 4.1 Inventaire et état initial du serveur

•	Documenter l'adresse IP publique, le nom d'hôte, la version d'Ubuntu, le nombre de vCPU, la RAM, l'espace disque et la configuration réseau.

	•	Vérifier les services déjà présents afin d'éviter les conflits avec Nginx, Apache, PostgreSQL ou Redis. •	Créer un instantané ou une sauvegarde initiale avant toute modification importante.

hostnamectl lsb_release -a lscpu

free -h df -h

ss -tulpn

systemctl --type=service --state=running

### 4.2 Mise à jour et durcissement de base

	•	Installer toutes les mises à jour de sécurité.

	•	Configurer le fuseau horaire America/Toronto.

	•	Activer les mises à jour automatiques de sécurité. •	Désactiver les services inutiles.

	•	Configurer UFW afin de n'autoriser que SSH, HTTP et HTTPS.

sudo apt update && sudo apt full-upgrade -y
sudo timedatectl set-timezone America/Toronto
sudo ufw allow OpenSSH

sudo ufw allow 'Nginx Full'
sudo ufw enable

### 4.3 Comptes et accès SSH

	•	Créer un utilisateur d'administration distinct du compte root. •	Ajouter l'utilisateur au groupe sudo.

	•	Utiliser exclusivement des clés SSH pour les accès administratifs.

	•	Désactiver l'authentification SSH par mot de passe lorsque les clés ont été validées. •	Conserver un accès de secours documenté.

sudo adduser deploy

sudo usermod -aG
sudo deploy
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh

### 4.4 Installation de la pile applicative

	•	Installer Git, Node.js 22 LTS, npm, PM2, Nginx, PostgreSQL et Redis. •	Vérifier les versions installées.

	•	Configurer PM2 pour redémarrer automatiquement après un redémarrage du serveur.

node -v
npm -v
pm2 -v
nginx -v

	Document 8 - Partie 1 | Roadmap de développement	Page 3

psql --version

redis-server --version
pm2 startup

### 4.5 Structure des environnements

	•	Créer trois environnements distincts : development, staging et production.

	•	Utiliser des bases de données, fichiers .env, processus PM2 et domaines différents. •	Ne jamais partager les secrets ni la base de données entre staging et production.

### Environnement

Développement distant

Préproduction

Production

### Domaine recommandé

dev.app.example.com

staging.app.example.com

app.example.com

### Port interne

3001

3002

3000

### Base de données

travel_dev

travel_staging

travel_prod

### Processus PM2

travel-dev

travel-staging

travel-prod

	Document 8 - Partie 1 | Roadmap de développement	Page 4

### 4.6 PostgreSQL

	•	Créer un utilisateur PostgreSQL distinct par environnement. •	Créer une base de données distincte par environnement.

	•	Limiter les permissions au strict nécessaire.

	•	Interdire l'accès distant direct à PostgreSQL depuis Internet. •	Planifier des sauvegardes quotidiennes avec pg_dump.

sudo -u postgres psql

CREATE ROLE travel_prod_user LOGIN PASSWORD '...'; CREATE DATABASE travel_prod OWNER travel_prod_user;

### 4.7 Redis

	•	Lier Redis à localhost uniquement.

	•	Activer une politique mémoire cohérente.

	•	Utiliser un préfixe de clés différent pour chaque environnement. •	Éviter d'y stocker des données métier permanentes.

sudo systemctl enable redis-server
sudo systemctl restart redis-server redis-cli ping

### 4.8 Nginx et domaines

	•	Créer un bloc serveur par environnement.

	•	Configurer le reverse proxy vers le port PM2 correspondant.

	•	Activer la compression, les en-têtes de sécurité et le support WebSocket. •	Configurer les redirections HTTP vers HTTPS.

	•	Valider la résolution DNS avant de demander les certificats.

### 4.9 Certificats TLS

	•	Installer Certbot et le module Nginx.

	•	Créer un certificat pour chaque domaine. •	Valider le renouvellement automatique.

	•	Tester le serveur après émission des certificats.

sudo certbot --nginx -d app.example.com
sudo certbot renew --dry-run

### 4.10 Arborescence système

	•	Créer une arborescence stable pour les applications, les fichiers partagés, les sauvegardes et les journaux. •	Attribuer les droits au compte deploy.

	•	Ne pas placer le code applicatif directement dans /root.

/var/www/travel-app/production /var/www/travel-app/staging /var/www/travel-app/development /var/backups/travel-app

	Document 8 - Partie 1 | Roadmap de développement	Page 5

/var/log/travel-app

### 4.11 Secrets et variables d'environnement

	•	Créer un fichier .env distinct par environnement. •	Limiter les permissions à 600.

	•	Ne jamais versionner les fichiers .env.

	•	Documenter uniquement les noms de variables, jamais leurs valeurs.

	•	Prévoir les variables pour PostgreSQL, Redis, Auth.js, Google Maps, Stripe et les fournisseurs IA.

chmod 600 .env.production chmod 600 .env.staging

	Document 8 - Partie 1 | Roadmap de développement	Page 6

### 5. Sécurité opérationnelle

### Contrôle

Pare-feu

SSH

Root

Fail2Ban

Secrets

Base de données

TLS

Journaux

Sauvegardes

### Exigence minimale

UFW actif; seuls SSH, HTTP et HTTPS sont ouverts

Clés obligatoires; mot de passe désactivé après validation

Connexion directe interdite ou strictement limitée

Protection des tentatives répétées

Fichiers protégés et non versionnés

Écoute locale uniquement

HTTPS obligatoire avec renouvellement automatique

Rotation et rétention configurées

Chiffrées ou protégées et copiées hors serveur

### 6. Sauvegardes et restauration

Une sauvegarde n'est considérée valide que si une restauration a été testée. La stratégie minimale comprend une sauvegarde quotidienne de PostgreSQL, une copie des fichiers utilisateurs, une rotation des sauvegardes et une copie hors du VPS Contabo.

	•	Sauvegarde quotidienne des bases de données. •	Sauvegarde quotidienne des fichiers téléversés. •	Rétention quotidienne de 30 jours.

	•	Copie hebdomadaire hors serveur. •	Test de restauration mensuel.

	•	Journal des sauvegardes et alertes en cas d'échec.

### 7. Monitoring et journalisation

### Élément

Serveur

Nginx

PM2

PostgreSQL

Redis

Certificats

Sauvegardes

### À surveiller

CPU, RAM, disque, charge système

Erreurs 4xx/5xx, temps de réponse

Disponibilité, mémoire, redémarrages

Connexions, espace, requêtes lentes

Mémoire, erreurs, taux de cache

Expiration et renouvellement

Succès, taille, durée

	Document 8 - Partie 1 | Roadmap de développement	Page 7

### 8. Critères de sortie de la phase

### Critère

Le serveur est à jour et le fuseau horaire est correct.

L'accès root direct est désactivé ou contrôlé.

L'accès SSH par clé fonctionne avec le compte deploy.

UFW et Fail2Ban sont actifs.

Node.js, PM2, Nginx, PostgreSQL, Redis et Git sont installés.

Les trois environnements possèdent leurs répertoires, bases et variables séparés.

Les domaines résolvent correctement vers le serveur.

HTTPS fonctionne sur chaque environnement.

PM2 redémarre correctement après un reboot.

Les sauvegardes sont automatisées.

Une restauration de test a été réussie.

Les journaux et alertes de base sont opérationnels.

### Statut

À valider

À valider

À valider

À valider

À valider

À valider

À valider

À valider

À valider

À valider

À valider

À valider

### 9. Livrables attendus

	•	Inventaire technique du serveur.

	•	Liste des services et versions installées.

	•	Schéma des environnements et des ports.

	•	Fichiers de configuration Nginx documentés.

	•	Fichier PM2 ecosystem.config.js (créé lors de la partie 2). •	Liste des variables d'environnement requises.

	•	Procédure de sauvegarde et restauration. •	Checklist de validation signée.

### 10. Risques principaux

### Risque

Conflit Nginx/Apache

### Impact

Ports 80/443 indisponibles

### Mesure préventive

Inventorier les services et choisir un seul reverse proxy

Mauvaise séparation des environnFeumiteenotsu corruption de données    Bases, secrets, domaines et processus distincts

Perte des données

Secrets exposés

Disque saturé

Arrêt majeur du service

Compromission des API

Arrêt de PostgreSQL ou PM2

Sauvegardes hors serveur et tests de restauration

Permissions strictes et exclusion Git

Monitoring et rotation des journaux

**Phase** **suivante** **:** Document 8 - Partie 2 : Initialisation du projet Next.js, du dépôt GitHub, des conventions de code et de l'environnement local.

	Document 8 - Partie 1 | Roadmap de développement	Page 8

DOCUMENT 8 - PARTIE 2

### Initialisation du projet Next.js et du depot GitHub

Roadmap detaillee pour creer le socle applicatif, le depot GitHub, les conventions de code, les environnements locaux et les controles de qualite du SaaS.

### Version

Framework

Langage

Interface

Gestionnaire de paquets

Depot

Cible

Document 8 - Partie 2 | Initialisation du projet

### 1.0

Next.js 16 - App Router

TypeScript en mode strict

React 19, Tailwind CSS, shadcn/ui

npm

GitHub prive

Developpement local, staging et production Contabo

Page 1

### 1. Objectif de la phase

Creer une base de projet propre, reproductible et conforme aux documents d'architecture precedents. Cette phase fixe les conventions qui devront etre respectees pendant tout le developpement : structure des dossiers, scripts, branches Git, formatage, tests, variables d'environnement et processus de revue.

**Resultat** **attendu** **:** le projet peut etre clone sur une nouvelle machine, demarre en quelques commandes et valide automatiquement avant chaque fusion ou deploiement.

### 2. Conditions prealables

	•	La partie 1 de la roadmap est terminee et le serveur Contabo est prepare. •	Un compte GitHub et un depot prive peuvent etre crees.

	•	Node.js 22 LTS, npm et Git sont installes sur le poste de developpement. •	Cursor est installe et configure.

	•	Les domaines et les environnements cibles ont ete definis.

	•	Aucun secret de production n'est requis pour l'initialisation locale.

### 3. Decisions techniques

### Sujet

Framework

Langage

Styles

Composants

Formulaires

Etat serveur

Etat client

Tests unitaires

Tests E2E

Formatage

Qualite

### Decision

Next.js 16 App Router

TypeScript strict

Tailwind CSS

shadcn/ui

React Hook Form + Zod

TanStack Query

Zustand

Vitest

Playwright

Prettier

ESLint

### Justification

Rendu serveur, routes API, layouts imbriques et ecosysteme mature

Reduction des erreurs et contrats de donnees explicites

Design system coherent et production rapide

Composants accessibles et personnalisables

Validation partagee client/serveur

Cache, synchronisation et gestion des erreurs

Etat global leger pour vehicule et voyage actifs

Rapide et adapte a TypeScript

Validation des parcours utilisateurs critiques

Style uniforme

Regles statiques et bonnes pratiques

	Document 8 - Partie 2 | Initialisation du projet	Page 2

### 4. Creation du depot GitHub

### 4.1 Parametres du depot

	•	Creer un depot prive avec un nom court et stable.

	•	Ne pas initialiser le depot avec un README si le projet local est cree d'abord. •	Activer la protection de la branche main.

	•	Interdire les push directs sur main.

	•	Exiger une Pull Request et la reussite des controles automatiques. •	Activer Dependabot pour les dependances npm.

	•	Activer les alertes de securite GitHub. **4.2** **Strategie** **de** **branches**

### Branche

main

develop

feature/*

fix/*

hotfix/*

chore/*

### Usage

Production

Integration staging

Nouvelle fonctionnalite

Correction non urgente

Correction urgente production

Maintenance et dependances

### Regle

Protegee, fusion uniquement par Pull Request

Protegee, base des fonctionnalites terminees

Creee depuis develop

Creee depuis develop

Creee depuis main puis fusionnee dans main et develop

Creee depuis develop

### 4.3 Convention des commits

Utiliser une convention inspiree de Conventional Commits afin que l'historique soit lisible et exploitable pour les changelogs.

feat: ajoute le formulaire de creation de voyage fix: corrige le calcul du cout de carburant docs: met a jour la documentation API

test: ajoute les tests du module vehicule chore: met a jour les dependances

### 4.4 Regles de Pull Request

	•	Titre clair et relie a une fonctionnalite ou un correctif.

	•	Description du changement, des impacts et de la methode de test. •	Captures d'ecran pour les changements visuels.

	•	Aucun secret, fichier .env ou journal sensible dans le diff. •	Lint, typecheck, tests et build reussis avant fusion.

	•	Documentation mise a jour lorsque le comportement change.

	Document 8 - Partie 2 | Initialisation du projet	Page 3

### 5. Creation du projet Next.js

### 5.1 Commande d'initialisation

npx create-next-app@latest travel-companion --typescript --tailwind --eslint --app --src-dir --import-alias '@/*'

### 5.2 Verification initiale

	1	Entrer dans le dossier du projet. 2	Executer npm run dev.

	3	Ouvrir http://localhost:3000. 4	Executer npm run lint.

	5	Executer npm run build.

	6	Valider qu'aucune erreur TypeScript ou ESLint n'est presente. **5.3** **Dependances** **de** **base**

npm install zod react-hook-form @hookform/resolvers @tanstack/react-query zustand lucide-react clsx tailwind-merge npm install -D prettier prettier-plugin-tailwindcss vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test husky lint-staged

Installer uniquement les dependances necessaires a la phase courante. Les bibliotheques de cartes, de paiement, d'authentification et d'IA seront ajoutees dans leurs phases respectives.

### 6. Structure initiale des dossiers

La structure doit etre suffisamment stable pour eviter les deplacements massifs de fichiers au fil du projet. L'approche retenue est feature-first : chaque module regroupe ses composants, services, schemas, types et tests.

src/ app/ (auth)/

(dashboard)/ api/ layout.tsx page.tsx components/ ui/

common/ features/ users/ vehicles/ trips/ maintenance/ finance/

ai/ hooks/ lib/ services/ stores/ types/ config/ styles/ tests/ unit/

integration/ e2e/

	Document 8 - Partie 2 | Initialisation du projet	Page 4

### Dossier

app

components/ui

features

lib

services

stores

types

config

### Responsabilite

Routes, layouts, metadata, routes API

Composants generiques du design system

Modules metier complets

Utilitaires generiques et clients techniques

Acces API et orchestrations

Etat client global

Types transversaux

Configuration centralisee

### Interdictions

Logique metier complexe

Appels API directs

Dependances circulaires

Logique specifique a une page

Composants React

Donnees serveur mises en cache

Schemas de validation executables

Secrets en clair

	Document 8 - Partie 2 | Initialisation du projet	Page 5

### 7. Configuration TypeScript

	•	Conserver strict: true.

	•	Interdire l'utilisation non justifiee de any. •	Utiliser des alias d'import @/*.

	•	Preferer unknown a any pour les donnees externes.

	•	Definir des types de retour explicites pour les services critiques.

	•	Activer noUncheckedIndexedAccess si le projet demeure compatible. •	Centraliser les types partages dans des modules clairement identifies.

### 8. ESLint et Prettier

### 8.1 Regles ESLint minimales

	•	Aucune variable inutilisee. •	Aucun import inutilise.

	•	Hooks React conformes aux regles officielles.

	•	Pas de console.log en production, sauf service de journalisation autorise. •	Pas de dependance implicite non declaree.

	•	Aucune desactivation globale d'une regle sans justification documentee. **8.2** **Scripts** **de** **qualite**

"scripts": { "dev": "next dev",

"build": "next build", "start": "next start", "lint": "next lint", "typecheck": "tsc --noEmit",

"format": "prettier --write .", "format:check": "prettier --check .", "test": "vitest",

"test:run": "vitest run", "test:e2e": "playwright test",

"quality": "npm run lint && npm run typecheck && npm run test:run && npm run build" }

### 9. Variables d'environnement

Creer un fichier .env.example contenant uniquement les noms des variables et des valeurs fictives. Les fichiers .env.local, .env.staging et .env.production ne doivent jamais etre commites.

### Variable

NODE_ENV

NEXT_PUBLIC_APP_URL

DATABASE_URL

REDIS_URL

### Portee

Tous les environnements

Frontend

Serveur

Serveur

### Phase d'activation

Immediate

Immediate

Partie 3

Partie 3

	Document 8 - Partie 2 | Initialisation du projet	Page 6

### Variable

AUTH_SECRET

GOOGLE_MAPS_API_KEY

NEXT_PUBLIC_GOOGLE_MAPS_ID

STRIPE_SECRET_KEY

OPENAI_API_KEY

ANTHROPIC_API_KEY

GEMINI_API_KEY

### Portee

Serveur

Serveur

Frontend

Serveur

Serveur

Serveur

Serveur

### Phase d'activation

Partie 4

Partie 12

Partie 12

Partie 14

Partie 15

Partie 15

Partie 15

### 10. Git hooks et controles locaux

	•	Configurer Husky apres l'installation des dependances. •	Executer lint-staged avant chaque commit.

	•	Verifier les fichiers TypeScript, TSX, JSON, CSS et Markdown modifies.

	•	Ne pas lancer le build complet a chaque commit pour conserver une bonne vitesse de travail. •	Executer le controle complet avant une Pull Request.

### 11. Tests initiaux

### Niveau

Unitaire

Composant

Integration

E2E

Qualite

### Objectif initial

Valider les utilitaires et schemas

Valider rendu et interactions simples

Valider services et routes API

Valider la page d'accueil et une navigation de base

Valider lint, types et build

### Outil

Vitest

Testing Library

Vitest

Playwright

Scripts npm

	Document 8 - Partie 2 | Initialisation du projet	Page 7

### 12. Integration continue GitHub Actions

Creer un workflow execute sur chaque Pull Request vers develop ou main. Le workflow doit installer les dependances avec npm ci, executer le lint, le typecheck, les tests et le build.

name: quality on: pull_request:

branches: [main, develop] jobs:

validate:

runs-on: ubuntu-latest steps:

- uses: actions/checkout@v4

- uses: actions/setup-node@v4 with:

node-version: 22 cache: npm

- run: npm ci

- run: npm run lint

- run: npm run typecheck - run: npm run test:run - run: npm run build

## 13. Documentation initiale du depot

	•	README.md avec objectif du produit, prealables et commandes de demarrage. •	CONTRIBUTING.md avec branches, commits, Pull Requests et controles.

	•	SECURITY.md avec procedure de signalement de vulnerabilite.

	•	docs/architecture.md avec liens vers les documents de conception. •	.env.example sans secrets.

	•	CHANGELOG.md initialise.

	•	LICENSE selon la strategie commerciale du projet.

### 14. Definition of Done de cette phase

### Critere

Le projet Next.js fonctionne localement.

Le depot GitHub prive existe et les protections de branches sont actives.

La structure des dossiers est creee.

TypeScript strict, ESLint et Prettier sont configures.

Les scripts npm de qualite fonctionnent.

Vitest et Playwright executent au moins un test valide.

Le workflow GitHub Actions reussit.

Le fichier .env.example est present.

Aucun secret n'est versionne.

Document 8 - Partie 2 | Initialisation du projet

### Statut

A valider

A valider

A valider

A valider

A valider

A valider

A valider

A valider

A valider

Page 8

### Critere

Le README permet a un nouveau developpeur de demarrer le projet.

Le build de production est reussi.

### Statut

A valider

A valider

### 15. Risques et mesures preventives

		**Risque**	**Impact**	**Mesure**

Ajout precoce de trop de dependanCcoemsplexite et failles

Structure de dossiers incoherenteRefactorisations couteuses

Installer les bibliotheques par phase

Respecter l'approche feature-first

Secrets commites

Branches non protegees

Tests absents

Build different entre local et CI

Compromission

Code instable en production

Regressions

Echecs de deploiement

gitignore, hooks et revue PR

Regles GitHub obligatoires

Creer le socle de tests des maintenant

Node 22 et npm ci partout

**Phase** **suivante** **:** Document 8 - Partie 3 : creation de PostgreSQL, integration Prisma, migrations initiales et strategie des donnees.

	Document 8 - Partie 2 | Initialisation du projet	Page 9

## Document 8 - Partie 3 Base de données PostgreSQL et Prisma

### Objectif

Préparer la couche de persistance de l'application avant le développement des fonctionnalités métier.

Élément

SGBD

ORM

Migration

Seed

UUID

Fuseau

Soft Delete

Décision

PostgreSQL 17

Prisma

Prisma Migrate

TypeScript

UUID v7

UTC

Oui

### Étapes

	•	Installer Prisma

	•	Configurer DATABASE_URL •	Créer schema.prisma

	•	Créer migration initiale •	Générer Prisma Client •	Créer le seed

	•	Tester migrations

### Conventions

	•	Une migration par changement •	Aucune modification manuelle •	Relations explicites

	•	Index sur recherches •	Contraintes d'intégrité

### Modules

	•	Utilisateurs •	Véhicules •	Voyages

•    Entretien •    Finances

	•	Notifications

	•	Administration

### Critères d'acceptation

•    Migration réussie •    Seed fonctionnel

	•	Connexion PostgreSQL validée •	Client Prisma généré

## Document 8 - Partie 4 Authentification (Auth.js)

### Objectif

Mettre en place un système d'authentification sécurisé, extensible et prêt pour les futures intégrations OAuth et MFA.

Composant

Librairie

Session

Hash

Validation

Formulaires

OAuth

MFA

Choix retenu

Auth.js

JWT sécurisés

Argon2

Zod

React Hook Form

Google (prévu), autres extensibles

Prévu dans l'architecture

### Étapes de développement

	•	Installer Auth.js et ses dépendances. •	Configurer les providers.

	•	Créer la page de connexion. •	Créer la page d'inscription.

	•	Créer la récupération du mot de passe. •	Configurer les routes protégées.

	•	Créer les middlewares.

	•	Tester les différents scénarios.

### Sécurité

	•	Hachage Argon2. •	Protection CSRF. •	Cookies sécurisés. •	Rate limiting.

	•	Expiration des sessions.

	•	Journalisation des connexions.

### Écrans à développer

•    Connexion •    Inscription

	•	Validation du courriel •	Mot de passe oublié •	Réinitialisation

	•	Gestion du profil

### Critères d'acceptation

	•	Connexion fonctionnelle. •	Déconnexion sécurisée. •	Sessions persistantes.

	•	Routes protégées.

	•	Tests de sécurité validés.

### Risques

Risque

Vol de session

Attaques par force brute

Mot de passe faible

Accès non autorisé

Mesure préventive

Cookies HttpOnly + Secure

Rate limiting + Fail2Ban

Politique de complexité

Middleware sur toutes les routes privées

**Livrables** **:** Auth.js configuré, routes protégées, écrans d'authentification, middleware et documentation.

## Document 8 - Partie 5 Design System et composants de base

### Objectif

Construire la fondation visuelle complète de l'application avant de développer les modules fonctionnels.

Élément

Framework UI

CSS

Icônes

Animations

Police

Thèmes

Design Tokens

Décision

shadcn/ui

Tailwind CSS

Lucide React

Framer Motion

Inter

Clair et sombre

Couleurs, espacements, rayons, ombres centralisés

### Étapes de développement

	•	Installer Tailwind CSS et shadcn/ui. •	Créer les Design Tokens.

	•	Configurer les thèmes clair et sombre.

	•	Créer les composants Button, Card, Input, Modal, Table, Badge, Toast. •	Créer les layouts Skeleton et Empty State.

	•	Créer la bibliothèque interne de composants. •	Documenter chaque composant.

### Conventions

	•	Aucun style codé en dur.

	•	Tous les composants sont réutilisables. •	Props fortement typées.

	•	Compatibilité mobile native. •	Respect WCAG 2.2 AA.

### Tests

	•	Validation visuelle.

	•	Tests des états hover, focus, disabled.

	•	Compatibilité Chrome, Edge, Firefox et Safari. •	Tests responsive.

### Critères d'acceptation

	•	Tous les composants disponibles. •	Thèmes fonctionnels.

	•	Aucune duplication.

	•	Documentation complète.

	•	Prêt pour les modules métier.

### Risques

Risque

Incohérence visuelle

Duplication

Régression

Accessibilité

Prévention

Utilisation exclusive du Design System

Bibliothèque unique de composants

Tests visuels automatisés

Validation WCAG continue

**Livrables** **:** bibliothèque de composants, Design Tokens, thèmes, documentation UI et Storybook (ou équivalent).

## Document 8 - Partie 6 Layout principal et navigation

### Objectif

Construire l'ossature permanente de l'application avant l'intégration des modules fonctionnels.

Élément

Header

Sidebar

Breadcrumb

Zone centrale

Panneau IA

Footer

Description

Logo, recherche, notifications, profil

Navigation principale repliable

Contexte de navigation

Affichage des modules

Assistant contextuel

Version et informations système

### Étapes de développement

	•	Créer le layout App Router. •	Créer le Header.

	•	Créer la Sidebar responsive. •	Créer le Footer.

	•	Créer les Breadcrumbs.

	•	Créer les routes protégées.

	•	Ajouter les transitions de navigation. •	Tester sur mobile et ordinateur.

### Navigation

	•	Tableau de bord •	Voyages

	•	Véhicules •	Entretien •	Finances

•    Assistant IA •    Notifications

	•	Administration (selon rôle)

### Conventions

	•	Navigation persistante.

	•	Responsive mobile-first.

	•	Aucune logique métier dans les layouts. •	Composants réutilisables.

### Critères d'acceptation

	•	Navigation fluide.

	•	Layouts imbriqués fonctionnels. •	Responsive validé.

•    Compatibilité avec le Design System. •    Aucune régression entre les modules.

### Risques

Risque

Navigation incohérente

Composants dupliqués

Régression responsive

Complexité

Prévention

Layouts uniques réutilisés

Structure centralisée

Tests systématiques

Architecture modulaire

**Livrables** **:** Layout principal, Header, Sidebar, Footer, Breadcrumbs, navigation protégée et documentation.

## Document 8 - Partie 7 Gestion des utilisateurs et profils

### Objectif

Développer le module permettant à chaque utilisateur de gérer son compte, son profil, ses préférences et les membres de son groupe de voyage.

Module

Profil

Préférences

Famille

Animaux

Documents

Appareils

Confidentialité

Fonction

Informations personnelles

Langue, devise, unités

Gestion des membres

Compagnons de voyage

Permis, assurances

Sessions actives

Consentements et données

### Étapes de développement

	•	Créer les pages Profil et Paramètres.

	•	Créer la gestion des préférences utilisateur. •	Créer la gestion des membres de la famille. •	Créer la gestion des animaux.

	•	Créer la gestion des appareils connectés. •	Créer la suppression du compte.

	•	Ajouter la validation des formulaires. •	Tester les permissions.

### Fonctionnalités

	•	Modification du profil. •	Photo de profil.

	•	Préférences régionales.

	•	Notifications personnalisées. •	Gestion des sessions.

	•	Export et suppression des données personnelles.

### Conventions

	•	Toutes les données passent par les API. •	Validation client et serveur.

	•	Historisation des modifications importantes. •	Respect des exigences de confidentialité.

### Critères d'acceptation

	•	Profil entièrement modifiable. •	Préférences persistantes.

	•	Gestion des membres fonctionnelle. •	Suppression sécurisée du compte.

	•	Interface conforme au Design System.

### Risques

Risque

Perte de données

Accès non autorisé

Incohérence des profils

Fuite de données

Prévention

Sauvegardes et confirmations

Contrôle des permissions

Validation serveur

Respect des règles de confidentialité

**Livrables** **:** module Profil, préférences, famille, animaux, appareils, confidentialité et documentation utilisateur.

## Document 8 - Partie 8 Catalogue des véhicules

### Objectif

Mettre en place le catalogue central des constructeurs, modèles et caractéristiques techniques servant de référence à l'ensemble de l'application.

Module

Constructeurs

Modèles

Motorisations

Spécifications

Consommation

Médias

Administration

Description

Marques automobiles et VR

Classification par année

Essence, diesel, hybride, électrique

Dimensions, capacités, poids

Valeurs de référence

Photos et documents

Gestion du catalogue

### Étapes de développement

	•	Créer les tables Constructeur, Modèle et Version. •	Importer les données initiales.

	•	Créer les interfaces d'administration. •	Créer les API de consultation.

	•	Créer les recherches avec filtres.

	•	Prévoir les futures mises à jour automatiques. •	Documenter le format des imports.

### Fonctionnalités

	•	Recherche rapide.

	•	Filtres par marque, année et type. •	Ajout manuel.

	•	Import CSV.

	•	Gestion des images.

	•	Historique des modifications.

### Conventions

	•	Chaque modèle possède un identifiant unique. •	Les données techniques sont normalisées.

	•	Aucune suppression physique des références utilisées.

	•	Historisation des changements importants.

### Critères d'acceptation

	•	Catalogue consultable rapidement. •	Filtres performants.

	•	Administration fonctionnelle.

	•	Compatible avec le module Véhicules. •	Documentation complète.

### Risques

Risque

Données incomplètes

Doublons

Performances

Erreur d'import

Prévention

Validation des imports

Contraintes d'unicité

Index adaptés

Prévisualisation avant intégration

**Livrables** **:** catalogue des véhicules, interfaces d'administration, API, scripts d'import et documentation.

## Document 8 - Partie 9 Gestion des véhicules

### Objectif

Implanter le module permettant aux utilisateurs de créer, gérer et suivre leurs véhicules ainsi que toutes les informations qui leur sont associées.

Module

Création

Fiche

Documents

Kilométrage

Photos

Statistiques

Synchronisation

Fonction principale

Assistant d'ajout d'un véhicule

Informations complètes du véhicule

Permis, assurances, factures

Historique des relevés

Galerie du véhicule

Consommation et coûts

Préparation aux intégrations futures

### Étapes de développement

	•	Créer les écrans Liste, Création et Fiche véhicule. •	Connecter le catalogue des véhicules.

	•	Créer les API CRUD.

	•	Ajouter la gestion des photos et documents. •	Créer le suivi du kilométrage.

	•	Afficher les statistiques principales. •	Tester les permissions utilisateur.

### Fonctionnalités

	•	Ajout rapide d'un véhicule. •	Modification complète.

	•	Archivage sans suppression physique. •	Recherche et filtres.

	•	Téléversement de documents. •	Gestion de plusieurs véhicules.

### Conventions

	•	Chaque véhicule appartient à un seul utilisateur. •	Historisation du kilométrage.

	•	Validation serveur de toutes les données.

	•	Compatibilité avec le module Entretien et Voyages.

### Critères d'acceptation

	•	CRUD complet fonctionnel.

	•	Import des photos opérationnel. •	Statistiques cohérentes.

	•	Recherche rapide.

	•	Interface conforme au Design System.

### Risques

Risque

Doublons

Perte de documents

Photos volumineuses

Accès non autorisé

Prévention

Validation d'unicité

Stockage sécurisé et sauvegardes

Compression et optimisation

Contrôle des permissions

**Livrables** **:** module Gestion des véhicules, API, écrans, stockage des documents, statistiques et documentation.

## Document 8 - Partie 10 Module Entretien

### Objectif

Développer le module complet de gestion des entretiens préventifs et correctifs des véhicules afin d'assurer leur suivi tout au long de leur cycle de vie.

Sous-module

Calendrier

Rappels

Interventions

Factures

Statistiques

IA

Description

Entretiens planifiés et historiques

Notifications selon le kilométrage ou la date

Vidanges, pneus, freins, inspections, etc.

Archivage des pièces justificatives

Coûts, fréquence, tendances

Suggestions d'entretien selon l'utilisation

### Étapes de développement

	•	Créer les écrans Liste, Calendrier et Historique. •	Développer les API CRUD des entretiens.

	•	Créer le moteur de rappels automatiques. •	Permettre le téléversement de factures.

	•	Afficher les statistiques par véhicule.

	•	Intégrer les recommandations de l'assistant IA. •	Tester les scénarios de notification.

### Fonctionnalités

	•	Entretien planifié ou imprévu.

	•	Rappels par date ou kilométrage. •	Historique complet.

	•	Gestion des coûts.

	•	Ajout de pièces jointes. •	Recherche et filtres.

### Conventions

•    Historique jamais supprimé physiquement. •    Toutes les modifications sont journalisées.

	•	Validation des données côté client et serveur.

	•	Compatibilité avec les modules Véhicules, Voyages et Finances.

### Critères d'acceptation

	•	Création et modification des entretiens fonctionnelles. •	Rappels automatiques opérationnels.

	•	Documents correctement archivés. •	Statistiques cohérentes.

	•	Respect du Design System.

### Risques

Risque

Rappels erronés

Perte de documents

Historique incohérent

Données invalides

Prévention

Tests unitaires et validation des règles

Sauvegardes et stockage sécurisé

Journalisation et transactions

Validation stricte

**Livrables** **:** module Entretien complet, API, rappels automatiques, gestion documentaire, statistiques et documentation.

## Document 8 - Partie 11 Module Voyages

### Objectif

Développer le module central permettant la création, la planification, le suivi et la clôture des voyages en intégrant les itinéraires, les étapes, les participants et le budget.

Sous-module

Création

Itinéraire

Participants

Budget

Documents

Historique

IA

Description

Assistant de création d'un voyage

Gestion des étapes et trajets

Famille, amis et animaux

Prévisions et dépenses

Réservations, billets, confirmations

Voyages passés

Optimisation et recommandations

### Étapes de développement

	•	Créer les écrans Liste, Création et Détail d'un voyage. •	Développer les API CRUD.

	•	Ajouter la gestion des étapes.

	•	Créer les calculs de distance et de durée. •	Ajouter les documents associés.

	•	Afficher les statistiques du voyage.

	•	Préparer les intégrations cartographiques.

### Fonctionnalités

	•	Création d'un voyage.

	•	Duplication d'un voyage. •	Gestion des étapes.

	•	Calcul automatique des distances. •	Budget prévisionnel.

	•	Archivage des voyages terminés.

### Conventions

	•	Tous les voyages sont liés à un utilisateur. •	Historisation des modifications.

	•	Validation complète des données.

	•	Compatibilité avec les modules Carte, Finances et IA.

### Critères d'acceptation

	•	CRUD complet.

	•	Itinéraires sauvegardés. •	Calculs fiables.

	•	Historique consultable.

	•	Interface conforme au Design System.

### Risques

Risque

Perte d'itinéraire

Calcul erroné

Données incomplètes

Conflits de synchronisation

Prévention

Sauvegarde automatique

Validation avec API cartographique

Validation des formulaires

Gestion des versions

**Livrables** **:** module Voyages, API, gestion des itinéraires, statistiques, historique et documentation.

## Document 8 - Partie 12

### Carte interactive et intégration Google Maps

### Objectif

Implanter le moteur cartographique central permettant la planification, la visualisation et l'optimisation des trajets ainsi que l'affichage des points d'intérêt.

Sous-module

Google Maps

Itinéraires

Étapes

Marqueurs

Navigation

Couches

IA

Description

Carte principale

Calcul et recalcul des trajets

Gestion des arrêts

Stations, campings, activités

Position GPS et suivi

Trafic, météo, carburant

Suggestions contextuelles

### Étapes de développement

	•	Configurer Google Maps API.

	•	Créer le composant Map principal. •	Afficher les itinéraires.

	•	Ajouter les marqueurs dynamiques.

	•	Créer les couches trafic, météo et carburant.

	•	Ajouter le déplacement des étapes par glisser-déposer. •	Optimiser les performances avec le clustering.

### Fonctionnalités

	•	Zoom et déplacement fluides. •	Plusieurs itinéraires.

	•	Ajout d'étapes directement sur la carte. •	Calcul automatique des distances.

•    Affichage des points d'intérêt. •    Suggestions de l'assistant IA.

### Conventions

	•	Tous les appels passent par des services dédiés. •	Mise en cache des données cartographiques.

	•	Chargement différé des couches lourdes.

	•	Architecture compatible avec d'autres fournisseurs cartographiques.

### Critères d'acceptation

	•	Carte fluide.

	•	Recalcul instantané des trajets. •	Marqueurs interactifs.

	•	Responsive complet.

	•	Respect du Design System.

### Risques

Risque

Quota API dépassé

Performances

Perte GPS

Dépendance fournisseur

Prévention

Mise en cache et optimisation

Clustering et lazy loading

Mode dégradé

Couche d'abstraction cartographique

**Livrables** **:** composant cartographique, intégration Google Maps, gestion des itinéraires, couches dynamiques, API et documentation.

## Document 8 - Partie 13 Carburant, météo, campings et activités

### Objectif

Implanter les services externes qui enrichissent chaque voyage avec des données en temps réel et des recommandations intelligentes.

Module

Carburant

Météo

Campings

Activités

Restaurants

Assistant IA

Description

Prix, stations et optimisation des arrêts

Prévisions actuelles et futures

Recherche et filtrage

Attractions et points d'intérêt

Suggestions à proximité

Recommandations personnalisées

### Étapes de développement

	•	Intégrer les API de prix du carburant. •	Intégrer un fournisseur météo.

	•	Créer le moteur de recherche des campings. •	Créer le moteur de recherche des activités. •	Ajouter les filtres avancés.

	•	Connecter les résultats à la carte interactive.

	•	Permettre les recommandations de l'assistant IA.

### Fonctionnalités

	•	Recherche selon l'itinéraire.

	•	Suggestions en fonction du budget. •	Alertes météo.

	•	Comparaison des prix du carburant. •	Favoris.

	•	Consultation hors ligne des données téléchargées.

### Conventions

	•	Tous les fournisseurs sont encapsulés derrière une couche d'abstraction. •	Mise en cache des données lorsque possible.

	•	Respect des quotas API.

	•	Gestion centralisée des erreurs.

### Critères d'acceptation

	•	Résultats rapides.

	•	Données cohérentes. •	Carte synchronisée.

	•	Fonctionnement sur mobile et ordinateur. •	Intégration complète avec les voyages.

### Risques

Risque

Quota API

Données indisponibles

Informations périmées

Coûts API

Prévention

Cache et limitation des appels

Provider de secours

Expiration contrôlée du cache

Surveillance de la consommation

**Livrables** **:** intégrations carburant, météo, campings, activités, couche d'abstraction des fournisseurs, API et documentation.

## Document 8 - Partie 14 Module Finances

### Objectif

Développer le module financier permettant de planifier, suivre et analyser les coûts des voyages, des véhicules et des abonnements.

Sous-module

Budgets

Dépenses

Reçus

Rapports

Abonnements

Exports

Description

Prévisions par voyage

Saisie et import des dépenses

Archivage et OCR

Analyses et graphiques

Gestion du forfait utilisateur

PDF, Excel, CSV

### Étapes de développement

	•	Créer les écrans Budget, Dépenses et Rapports. •	Développer les API CRUD des dépenses.

•    Ajouter l'import OCR des reçus. •    Créer les graphiques financiers.

	•	Ajouter les exports PDF/Excel/CSV.

	•	Intégrer Stripe pour les abonnements.

	•	Créer les alertes de dépassement de budget.

### Fonctionnalités

	•	Budgets par voyage.

	•	Dépenses catégorisées. •	Historique complet.

	•	Recherche et filtres.

	•	Graphiques interactifs.

	•	Comparaison prévision/réel.

### Conventions

	•	Tous les montants sont stockés avec devise. •	Calculs centralisés côté serveur.

	•	Historisation des modifications.

	•	Compatible avec Voyages, Véhicules et IA.

### Critères d'acceptation

•    Calculs exacts. •    Imports fiables.

•    Exports fonctionnels. •    Rapports cohérents.

	•	Interface conforme au Design System.

### Risques

Risque

Erreur de calcul

Perte de reçus

Devise incorrecte

Performance

Prévention

Tests unitaires et validation

Sauvegardes automatiques

Normalisation des devises

Agrégation et indexation

**Livrables** **:** module Finances complet, API, rapports, graphiques, exports, intégration Stripe et documentation.

## Document 8 - Partie 15 Assistant IA

### Objectif

Développer le module d'intelligence artificielle qui agit comme copilote du voyageur en exploitant le contexte utilisateur, les données des véhicules, les voyages et les services externes.

Sous-module

Conversation

Mémoire

Planification

Actions

Recommandations

Fournisseurs

Journal

Description

Chat contextuel

Préférences utilisateur

Création et optimisation des voyages

Modification directe des données

Activités, carburant, météo

OpenAI, Claude, Gemini, Ollama

Historique des échanges

### Étapes de développement

	•	Créer le panneau de conversation. •	Implanter la mémoire utilisateur.

	•	Développer la couche d'abstraction des fournisseurs IA. •	Ajouter les outils permettant à l'IA d'agir sur l'application. •	Créer les recommandations contextuelles.

	•	Journaliser toutes les actions importantes. •	Tester les scénarios multi-fournisseurs.

### Fonctionnalités

	•	Conversation naturelle.

	•	Création de voyages par IA. •	Optimisation d'itinéraires.

	•	Suggestions de campings, carburant et activités. •	Réponses contextualisées.

	•	Choix du fournisseur IA.

### Conventions

	•	L'IA ne modifie jamais les données sans confirmation lorsqu'une action est critique. •	Toutes les requêtes passent par une couche d'abstraction.

•    Les prompts système sont versionnés. •    Les échanges sensibles sont protégés.

### Critères d'acceptation

	•	Assistant disponible dans toute l'application. •	Actions fonctionnelles.

	•	Support multi-modèles.

	•	Temps de réponse optimisé. •	Documentation complète.

### Risques

Risque

Hallucinations

Coût API

Indisponibilité d'un fournisseur

Fuite de données

Prévention

Validation métier et confirmations

Cache, limitation et choix du modèle

Bascule automatique

Filtrage et journalisation

**Livrables** **:** module Assistant IA, couche d'abstraction des fournisseurs, outils IA, mémoire, recommandations et documentation.

## Document 8 - Partie 16 Notifications

### Objectif

Développer un système de notifications centralisé permettant d'informer les utilisateurs des événements importants tout en offrant un contrôle complet sur les préférences de diffusion.

Sous-module

Centre de notifications

Notifications push

Courriels

Alertes voyage

Entretien

Finances

Préférences

Description

Historique et gestion

Mobile et navigateur

Résumé et alertes

Départs, météo, changements

Échéances et rappels

Budget et paiements

Gestion des canaux

### Étapes de développement

	•	Créer le centre de notifications.

	•	Développer les API de création et consultation. •	Implanter les notifications push.

	•	Créer les modèles de courriels.

	•	Ajouter les préférences utilisateur. •	Créer les tâches planifiées d'envoi. •	Tester tous les scénarios.

### Fonctionnalités

	•	Notifications en temps réel. •	Historique complet.

	•	Marquer comme lu. •	Filtres par catégorie.

	•	Notifications groupées. •	Actions rapides.

### Conventions

	•	Priorisation des alertes.

	•	Historisation des notifications.

	•	Respect des préférences utilisateur. •	Journalisation des envois.

### Critères d'acceptation

	•	Envoi fiable.

	•	Préférences respectées. •	Historique disponible.

	•	Push et courriel fonctionnels.

	•	Compatible avec tous les modules.

### Risques

Risque

Trop de notifications

Échec d'envoi

Retards

Spam

Prévention

Regroupement et préférences

Reprise automatique

File d'attente asynchrone

Limitation et validation

**Livrables** **:** système de notifications, API, modèles de courriels, notifications push, préférences utilisateur et documentation.

## Document 8 - Partie 17 Administration

### Objectif

Développer le portail d'administration permettant la gestion complète de la plateforme, des utilisateurs, des données de référence, des intégrations et de la supervision opérationnelle.

Sous-module

Tableau de bord

Utilisateurs

Catalogue

Intégrations

Audit

Paramètres

Supervision

Description

Vue globale du système

Gestion des comptes et permissions

Référentiels (véhicules, activités, etc.)

Clés API et fournisseurs

Journal des actions

Configuration système

État des services

### Étapes de développement

	•	Créer le tableau de bord administrateur.

	•	Développer la gestion des utilisateurs et rôles. •	Créer les interfaces de gestion des catalogues. •	Ajouter les paramètres système.

	•	Implanter le journal d'audit.

	•	Créer les tableaux de supervision.

	•	Tester les permissions administratives.

### Fonctionnalités

	•	Recherche globale. •	Gestion des rôles.

	•	Consultation des journaux. •	Activation des intégrations. •	Maintenance des données.

	•	Tableaux de bord temps réel.

### Conventions

	•	Toutes les actions critiques sont journalisées. •	Permissions basées sur les rôles.

	•	Double confirmation pour les opérations destructives. •	Aucune action administrative sans authentification.

### Critères d'acceptation

	•	Administration complète.

	•	Journal d'audit fonctionnel. •	Permissions validées.

	•	Supervision opérationnelle.

	•	Conforme au Design System.

### Risques

Risque

Erreur administrative

Escalade de privilèges

Suppression accidentelle

Configuration invalide

Prévention

Confirmations et journalisation

Contrôle strict des rôles

Archivage et sauvegardes

Validation avant application

**Livrables** **:** portail d'administration, gestion des rôles, audit, supervision, paramètres système et documentation.

## Document 8 - Partie 18 Tests automatisés et optimisation

### Objectif

Mettre en place une stratégie de qualité logicielle assurant la stabilité, la performance et la fiabilité de la plateforme avant chaque mise en production.

Domaine

Tests unitaires

Tests d'intégration

Tests E2E

Lint

Formatage

Performance

CI

Outils / approche

Vitest

API + Base de données

Playwright

ESLint

Prettier

Lighthouse, Web Vitals

GitHub Actions

### Étapes de développement

	•	Configurer Vitest et Playwright.

	•	Créer les premiers tests unitaires.

	•	Créer les tests d'intégration des API.

	•	Automatiser les tests dans GitHub Actions. •	Mesurer les performances avec Lighthouse. •	Corriger les régressions détectées.

	•	Définir les seuils minimaux de qualité.

### Optimisations

	•	Code splitting. •	Lazy loading.

	•	Optimisation des images.

	•	Mise en cache des données. •	Réduction des requêtes.

	•	Analyse des Web Vitals.

### Conventions

	•	Aucune Pull Request sans tests.

	•	Build bloqué si les tests échouent.

	•	Lint obligatoire.

	•	Suivi des performances à chaque livraison.

### Critères d'acceptation

	•	Tests automatisés exécutés.

	•	Couverture des composants critiques. •	Performance validée.

	•	Aucune erreur de lint. •	Pipeline CI vert.

### Risques

Risque

Régression

Performance dégradée

Couverture insuffisante

Échec CI

Prévention

Tests automatiques

Mesures Lighthouse

Objectifs minimaux

Validation avant fusion

**Livrables** **:** suite de tests automatisés, pipeline CI, rapports de performance, couverture de tests et documentation.

## Document 8 - Partie 19 Déploiement sur le serveur Contabo

### Objectif

Préparer et automatiser le déploiement sécurisé de l'application sur le serveur Contabo en assurant une disponibilité maximale et un risque minimal lors des mises à jour.

Composant

Serveur

Reverse proxy

Runtime

Gestionnaire

Base de données

Cache

TLS

Technologie

Contabo Ubuntu LTS

Nginx

Node.js 22 LTS

PM2

PostgreSQL

Redis

Let's Encrypt

### Étapes de déploiement

	•	Compiler l'application.

	•	Exécuter les tests automatisés. •	Créer les migrations Prisma.

	•	Déployer les fichiers sur le serveur. •	Redémarrer PM2 sans interruption. •	Valider les endpoints de santé.

	•	Surveiller les journaux après le déploiement.

### Automatisation

	•	Pipeline GitHub Actions.

	•	Déploiement vers staging avant production. •	Validation automatique des migrations.

	•	Rollback documenté.

	•	Notifications en cas d'échec.

### Conventions

	•	Jamais de déploiement manuel directement sur la production. •	Déploiement reproductible.

	•	Secrets stockés uniquement sur le serveur.

	•	Versionnement Git obligatoire.

### Critères d'acceptation

	•	Déploiement reproductible. •	Temps d'arrêt minimal.

	•	Rollback testé.

	•	Application opérationnelle après redémarrage. •	Surveillance active.

### Risques

Risque

Déploiement incomplet

Migration échouée

Temps d'arrêt

Erreur humaine

Prévention

Pipeline automatisé

Sauvegarde et rollback

Redémarrage contrôlé via PM2

Automatisation maximale

**Livrables** **:** pipeline de déploiement, scripts, procédures de rollback, configuration PM2/Nginx et documentation.

## Document 8 - Partie 20

### Mise en production, monitoring et maintenance

### Objectif

Finaliser la mise en production du SaaS et mettre en place les mécanismes assurant sa disponibilité, sa sécurité, son évolution et son exploitation quotidienne.

Volet

Mise en production

Monitoring

Sauvegardes

Alertes

Maintenance

Continuité

Documentation

Description

Checklist finale avant ouverture

Surveillance applicative et infrastructure

Base de données et fichiers

Notifications d'incident

Correctifs et mises à jour

Reprise après incident

Procédures d'exploitation

### Étapes de mise en production

	•	Valider la checklist de déploiement. •	Exécuter les migrations finales.

	•	Activer HTTPS et les domaines.

	•	Configurer les sauvegardes automatiques. •	Activer le monitoring et les alertes.

	•	Effectuer les tests de fumée.

	•	Autoriser progressivement les utilisateurs.

### Surveillance

	•	Disponibilité des services. •	CPU, mémoire, disque.

	•	Temps de réponse des API. •	Erreurs applicatives.

	•	Expiration des certificats. •	État des sauvegardes.

### Maintenance continue

	•	Application mensuelle des correctifs. •	Rotation des journaux.

	•	Revue des performances. •	Tests de restauration.

	•	Audit des accès.

	•	Révision des dépendances.

### Critères d'acceptation

	•	Tous les services sont opérationnels. •	Sauvegardes validées.

	•	Alertes fonctionnelles.

	•	Plan de reprise documenté.

	•	Documentation d'exploitation complétée.

### Risques

Risque

Panne serveur

Incident critique

Perte de données

Dette technique

Prévention

Sauvegardes et PRA documenté

Supervision 24/7 et alertes

Tests réguliers de restauration

Planification des mises à jour

**Livrables** **:** environnement en production, monitoring, sauvegardes, plan de reprise, procédures d'exploitation et documentation finale.
