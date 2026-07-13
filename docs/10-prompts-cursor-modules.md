# Document 10 — Prompts Cursor : initialisation et modules

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

## Document 10 - Partie 1 Prompt Cursor - Initialisation du projet

### Objectif

Fournir le premier prompt complet à exécuter dans Cursor afin d'initialiser le projet conformément à toute l'architecture définie dans les documents précédents.

Entrée

Technologies

Gestionnaire

Base

UI

Qualité

Architecture

Valeur

Next.js 16, TypeScript, App Router

npm

PostgreSQL + Prisma

Tailwind CSS + shadcn/ui

ESLint, Prettier, Husky

Feature-first

### Prompt Cursor

Agis comme un architecte logiciel senior.

Initialise un nouveau projet Next.js 16 en TypeScript avec App Router.

Contraintes :

- Respecte intégralement les Documents 1 à 9. - Architecture feature-first.

- Configure Tailwind CSS, shadcn/ui, ESLint, Prettier et Husky. - Configure Prisma sans créer les modèles métier.

- Prépare les dossiers app, features, components, lib, services, hooks, types, prisma et tests.

- N'écris aucun code métier.

- Termine par un rapport indiquant : 1. les fichiers créés,

2. les dépendances installées,

3. les prochaines étapes recommandées, 4. les éventuels problèmes détectés.

Ne pose pas de questions. Exécute toutes les étapes automatiquement.

### Résultat attendu

	•	Projet compilable. •	Architecture créée.

	•	Dépendances installées.

	•	Aucune erreur TypeScript. •	Prêt pour la partie 2.

### Validation

	•	npm install réussi. •	npm run lint réussi.

	•	npm run build réussi.

	•	Aucun avertissement critique.

## Document 10 - Partie 2

### Prompt Cursor - Architecture du projet

Créer automatiquement l'architecture logicielle complète du projet, sans développer les fonctionnalités métier.

### Section

Architecture

Dossiers

Conventions

Qualité

Documentation

### À générer

Structure feature-first

app, features, components, lib, services, hooks, types, tests

Alias TypeScript, imports, fichiers barrel

ESLint, Prettier, Husky

README d'architecture et règles de contribution

### Prompt Cursor

Agis comme un architecte logiciel senior.

En te basant sur les Documents 1 a 9, construis toute l'architecture du projet.

Exigences :

- Architecture feature-first.

- Creer tous les dossiers standards. - Configurer les alias TypeScript.

- Preparer les composants partages.

- Preparer les services, hooks et types.

- Ajouter une documentation d'architecture. - Ne creer aucune logique metier.

A la fin, affiche :

1. L'arborescence complete. 2. Les fichiers crees.

3. Les verifications effectuees. 4. Les etapes suivantes.

### Résultat attendu

### Validation

Structure

TypeScript

Qualité

Documentation

Compilation

Document 10 - Partie 2

### Résultat attendu

Arborescence feature-first complète

Alias et mode strict fonctionnels

ESLint, Prettier et Husky configurés

README architecture créé

npm run build sans erreur

Page 1

## Document 10 - Partie 3 Prompt Cursor - Prisma et base de données

### Objectif

Créer automatiquement toute la couche de persistance avec Prisma et PostgreSQL, sans développer les modules métier.

Section

Prisma

PostgreSQL

Schema

Migrations

Seed

Validation

À générer

Configuration complète

Connexion et variables d'environnement

Base commune (User, Session, Audit)

Migration initiale

Données de développement

Build et génération Prisma Client

### Prompt Cursor

Agis comme un architecte logiciel senior.

En te basant sur les Documents 1 à 9 :

- Configure Prisma avec PostgreSQL. - Crée schema.prisma.

- Prépare les modèles communs (User, Session, Audit). - Génère la migration initiale.

- Configure Prisma Client. - Crée un script de seed.

- Configure les scripts npm nécessaires.

- Vérifie que les migrations fonctionnent.

Ne crée encore aucun module métier.

À la fin, affiche :

1. Les fichiers créés.

2. Les commandes exécutées. 3. Les migrations générées. 4. Les prochaines étapes.

## Document 10 - Partie 4 Prompt Cursor - Authentification

### Objectif

Créer automatiquement le système complet d'authentification, d'autorisation et de gestion des sessions conformément à l'architecture du projet.

Section

Auth.js

Connexion

Sécurité

Rôles

Middleware

Tests

À générer

Configuration complète

Pages Login, Logout, Register

Argon2, CSRF, Rate limiting

User, Admin, Super Admin

Protection des routes

Validation automatique

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant intégralement les Documents 1 à 9 :

- Configure Auth.js.

- Implémente la connexion, l'inscription et la déconnexion.

- Ajoute la récupération et la réinitialisation du mot de passe. - Configure les rôles et les permissions.

- Protège toutes les routes privées via middleware. - Utilise React Hook Form, Zod et Argon2.

- Prépare la structure pour le MFA.

- Génère les tests et la documentation.

Ne développe encore aucun module métier.

À la fin, affiche :

1. Les fichiers créés.

2. Les dépendances ajoutées. 3. Les routes protégées.

4. Les prochaines étapes.

## Document 10 - Partie 5 Prompt Cursor - Design System

### Objectif

Générer automatiquement l'ensemble du Design System et de la bibliothèque de composants réutilisables qui serviront à tous les modules de l'application.

Section

Design Tokens

Composants

Thèmes

Icônes

Animations

Documentation

À générer

Couleurs, typographie, espacements

Button, Card, Input, Modal, Table, Badge, Toast

Clair et sombre

Lucide React

Framer Motion

Storybook ou documentation interne

### Prompt Cursor

Agis comme un architecte Frontend senior.

En respectant les Documents 1 à 9 :

- Crée le Design System complet avec Tailwind CSS et shadcn/ui. - Centralise tous les Design Tokens.

- Implémente les thèmes clair et sombre.

- Génère tous les composants UI réutilisables. - Respecte WCAG 2.2 AA.

- Utilise TypeScript strict. - Documente chaque composant.

- Ajoute les tests nécessaires.

Ne développe aucun module métier.

À la fin, affiche :

1. Les composants créés. 2. Les fichiers générés. 3. Les tests réalisés.

4. Les prochaines étapes.

## Document 10 - Partie 6 Prompt Cursor - Layout et navigation

### Objectif

Générer automatiquement toute la structure de navigation de l'application, les layouts et les composants permanents de l'interface.

Section

Layout

Navigation

Responsive

Recherche

Notifications

Accessibilité

À générer

App Router avec layouts imbriqués

Sidebar, Header, Footer, Breadcrumbs

Mobile, tablette, bureau

Barre de recherche globale

Centre de notifications UI

WCAG 2.2 AA

### Prompt Cursor

Agis comme un architecte Frontend senior.

En respectant les Documents 1 à 9 :

- Génère le layout principal de l'application.

- Crée un Header avec recherche, notifications et profil. - Crée une Sidebar repliable avec navigation par module. - Ajoute Breadcrumbs et Footer.

- Implémente une navigation responsive.

- Prépare les layouts protégés et publics. - Respecte le Design System déjà créé.

- Ajoute les tests des composants de navigation.

Ne développe aucune logique métier.

À la fin, affiche :

1. Les composants créés. 2. Les routes configurées. 3. Les fichiers générés. 4. Les prochaines étapes.

## Document 10 - Partie 7 Prompt Cursor - Module Utilisateurs

### Objectif

Créer automatiquement le module complet de gestion des utilisateurs, profils, préférences et permissions.

Section

CRUD

Préférences

Permissions

Sécurité

UI

Tests

À générer

Utilisateurs et profils

Langue, devise, unités, notifications

RBAC complet

Validation Zod, Server Actions

Pages, formulaires, tableaux

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant intégralement les Documents 1 à 9 :

- Génère le module Utilisateurs. - Crée les schémas Prisma.

- Crée les API (Server Actions ou Route Handlers).

- Génère les pages Liste, Détail, Création et Modification. - Implémente les préférences utilisateur.

- Implémente les rôles et permissions. - Utilise React Hook Form et Zod.

- Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés.

2. Les migrations Prisma. 3. Les routes générées. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 8 Prompt Cursor - Catalogue des véhicules

### Objectif

Générer automatiquement le catalogue des constructeurs, modèles, versions et caractéristiques techniques qui servira de référence à toute l'application.

Section

Prisma

API

Import

Administration

Recherche

Tests

À générer

Constructeur, Modèle, Version

CRUD complet

CSV/JSON

Gestion du catalogue

Filtres et pagination

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Crée le module Catalogue des véhicules.

- Génère les modèles Prisma Constructeur, Modèle et Version. - Crée les migrations.

- Génère les API CRUD.

- Crée les écrans d'administration. - Ajoute l'import CSV/JSON.

- Implémente recherche, filtres et pagination. - Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les migrations.

3. Les API générées. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 9 Prompt Cursor - Gestion des véhicules

### Objectif

Créer automatiquement le module complet de gestion des véhicules des utilisateurs.

Section

Prisma

API

UI

Fonctions

Statistiques

Tests

À générer

Vehicle, VehiclePhoto, VehicleDocument

CRUD complet

Liste, fiche, création, édition

Photos, documents, kilométrage

Consommation et coûts

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Génère le module Gestion des véhicules. - Crée les modèles Prisma et migrations. - Génère les API CRUD.

- Crée les écrans Liste, Création, Modification et Détail. - Ajoute la gestion des photos et des documents.

- Implémente le suivi du kilométrage.

- Affiche les statistiques principales. - Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les migrations.

3. Les API générées. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 10 Prompt Cursor - Module Entretien

### Objectif

Créer automatiquement le module complet de gestion des entretiens des véhicules, incluant les rappels, l'historique et les statistiques.

Section

Prisma

API

Interface

Rappels

Statistiques

Tests

À générer

Entretien, TypeEntretien, Facture

CRUD complet

Calendrier, historique, formulaires

Date et kilométrage

Coûts, fréquence, graphiques

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant intégralement les Documents 1 à 9 :

- Génère le module Entretien.

- Crée les modèles Prisma nécessaires. - Génère les migrations.

- Développe les API CRUD.

- Crée les écrans Calendrier, Liste, Historique et Détail. - Implémente les rappels selon la date et le kilométrage. - Ajoute la gestion des factures.

- Produit les statistiques d'entretien. - Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les migrations.

3. Les API générées. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 11 Prompt Cursor - Module Voyages

### Objectif

Créer automatiquement le module complet de planification, gestion et suivi des voyages.

Section

Prisma

API

UI

Fonctions

Carte

Tests

À générer

Trip, TripStop, Traveler, Reservation

CRUD complet

Liste, calendrier, détail, édition

Étapes, budget, participants

Préparation Google Maps

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Génère le module Voyages.

- Crée les modèles Prisma et les migrations. - Génère les API CRUD.

- Crée les écrans Liste, Création, Détail et Édition. - Implémente les étapes, participants et réservations. - Prépare l'intégration Google Maps.

- Ajoute les statistiques et le budget. - Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les migrations.

3. Les API générées. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 12

### Prompt Cursor - Google Maps et cartographie

### Objectif

Créer automatiquement toute l'infrastructure cartographique de l'application en utilisant Google Maps.

Section

Carte

Itinéraires

Marqueurs

API

Optimisation

Tests

À générer

Composant Google Maps

Calcul et affichage

POI, campings, stations

Services cartographiques

Cache et clustering

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Configure Google Maps.

- Crée un composant Map réutilisable.

- Implémente les itinéraires, marqueurs et calculs de distance. - Prépare les services cartographiques.

- Ajoute le clustering, le cache et le lazy loading. - Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les API intégrées.

3. Les composants générés. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 13 Prompt Cursor - Service Carburant

### Objectif

Créer automatiquement le module de recherche des stations-service, des prix du carburant et de l'optimisation des arrêts.

Section

Services

API

UI

Optimisation

IA

Tests

À générer

Intégration fournisseur carburant

Recherche et cache

Carte, liste et filtres

Meilleur arrêt selon le trajet

Suggestions de ravitaillement

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Crée un module de gestion des prix du carburant.

- Intègre un fournisseur de données avec une couche d'abstraction. - Développe les API de recherche et de mise en cache.

- Crée les écrans Carte, Liste et Détail.

- Ajoute les filtres (prix, distance, type de carburant). - Propose le meilleur arrêt selon l'itinéraire.

- Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les API intégrées.

3. Les composants générés. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 14 Prompt Cursor - Service Météo

### Objectif

Créer automatiquement le module météo afin d'afficher les conditions actuelles, les prévisions et les alertes liées aux voyages.

Section

Services

API

UI

Voyages

IA

Tests

À générer

Intégration fournisseur météo

Prévisions, cache et alertes

Carte, widgets et détails

Prévisions par étape

Suggestions selon la météo

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Crée le module Météo.

- Intègre un fournisseur météo derrière une couche d'abstraction. - Développe les API de prévisions et d'alertes.

- Affiche les conditions actuelles et les prévisions par étape du voyage. - Mets en cache les réponses afin de limiter les appels API.

- Ajoute des recommandations de l'assistant IA selon la météo. - Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les API intégrées.

3. Les composants générés. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 15 Prompt Cursor - Module Campings

### Objectif

Créer automatiquement le module de recherche, d'analyse et de recommandation des campings le long d'un itinéraire.

Section

Services

API

UI

Favoris

IA

Tests

À générer

Fournisseur de données campings

Recherche, cache, filtres

Carte, liste, fiche détaillée

Sauvegarde des campings

Recommandations personnalisées

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Crée le module Campings.

- Intègre un fournisseur de données derrière une couche d'abstraction. - Développe les API de recherche avec mise en cache.

- Crée les écrans Carte, Liste et Détail.

- Implémente les filtres (services, prix, type, distance). - Ajoute les favoris et l'historique.

- Permets à l'assistant IA de recommander des campings selon le voyage. - Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les API intégrées.

3. Les composants générés. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 16 Prompt Cursor - Module Activités

### Objectif

Créer automatiquement le module permettant de rechercher, filtrer et recommander des activités et points d'intérêt selon le contexte du voyage.

Section

Services

API

UI

Favoris

IA

Tests

À générer

Fournisseur d'activités et POI

Recherche, cache et filtres

Carte, liste et fiche détaillée

Enregistrement et historique

Suggestions contextuelles

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Crée le module Activités.

- Intègre un fournisseur de points d'intérêt via une couche d'abstraction.

- Développe les API de recherche avec mise en cache. - Crée les écrans Carte, Liste et Détail.

- Ajoute les filtres (catégorie, distance, prix, horaire, note). - Permets l'ajout aux favoris et à l'itinéraire.

- Ajoute des recommandations de l'assistant IA selon les préférences et le voyage.

- Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les API intégrées.

3. Les composants générés. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 17 Prompt Cursor - Module Finances

### Objectif

Créer automatiquement le module complet de gestion financière des voyages, des véhicules et des abonnements.

Section

Prisma

API

UI

Exports

Paiement

Tests

À générer

Budget, Expense, Receipt, Subscription

CRUD complet

Budgets, dépenses, rapports

PDF, Excel, CSV

Stripe

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Génère le module Finances.

- Crée les modèles Prisma Budget, Expense, Receipt et Subscription. - Génère les migrations.

- Développe les API CRUD.

- Crée les écrans Budgets, Dépenses, Rapports et Abonnements. - Intègre Stripe.

- Implémente les exports PDF, Excel et CSV. - Ajoute les statistiques financières.

- Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les migrations.

3. Les API générées. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 18 Prompt Cursor - Module Notifications

### Objectif

Créer automatiquement le système complet de notifications (temps réel, courriel et push) intégré à tous les modules de l'application.

Section

Centre

Push

Courriel

Préférences

API

Tests

À générer

Centre de notifications

Web Push et mobile

Modèles et envoi

Gestion des canaux

Création et diffusion

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Génère le module Notifications. - Crée le centre de notifications.

- Implémente les notifications Web Push et par courriel. - Ajoute les préférences utilisateur.

- Développe les API de diffusion et d'historique.

- Intègre les notifications aux modules Voyages, Entretien, Finances et Assistant IA.

- Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les API générées.

3. Les composants créés. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 19 Prompt Cursor - Assistant IA

### Objectif

Créer automatiquement le module d'assistant IA multi-fournisseurs intégré à toute l'application.

Section

Chat

Mémoire

Providers

Tools

RAG

Tests

À générer

Conversation contextuelle

Préférences utilisateur

OpenAI, Claude, Gemini, Ollama

Actions sur l'application

Contexte et documents

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte IA senior.

En respectant les Documents 1 à 9 :

- Génère le module Assistant IA.

- Crée une couche d'abstraction supportant OpenAI, Claude, Gemini et Ollama.

- Implémente le chat contextuel avec mémoire.

- Ajoute des tools permettant de lire et modifier les données de l'application.

- Prévois le RAG et le versionnement des prompts système. - Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés.

2. Les fournisseurs configurés. 3. Les tests exécutés.

4. Les prochaines étapes.

## Document 10 - Partie 20 Prompt Cursor - Administration

### Objectif

Créer automatiquement le portail d'administration complet permettant la gestion de la plateforme, des utilisateurs, des catalogues, des intégrations et de la supervision.

Section

Dashboard

Utilisateurs

Catalogues

Audit

Configuration

Tests

À générer

Vue d'ensemble système

Gestion des comptes et rôles

Maintenance des données de référence

Journal des actions

Paramètres système et intégrations

Unitaires et E2E

### Prompt Cursor

Agis comme un architecte logiciel senior.

En respectant les Documents 1 à 9 :

- Génère le portail d'administration.

- Crée les tableaux de bord d'administration.

- Implémente la gestion des utilisateurs, rôles et permissions. - Ajoute la gestion des catalogues.

- Implémente le journal d'audit.

- Crée les pages de configuration système et des intégrations. - Respecte le Design System.

- Génère les tests unitaires et E2E. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les API générées.

3. Les composants créés. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 21 Prompt Cursor - API internes

### Objectif

Créer automatiquement l'ensemble des API internes, des services partagés et de la couche d'abstraction utilisée par tous les modules.

Section

API

Services

Validation

Erreurs

Documentation

Tests

À générer

Route Handlers / Server Actions

Couche métier réutilisable

Zod

Gestion centralisée

OpenAPI (si applicable)

Unitaires et intégration

### Prompt Cursor

Agis comme un architecte backend senior.

En respectant les Documents 1 à 9 :

- Génère la couche API interne.

- Utilise des Route Handlers ou Server Actions selon les meilleures pratiques Next.js.

- Centralise la logique métier dans des services. - Utilise Zod pour toutes les validations.

- Implémente une gestion uniforme des erreurs.

- Prépare une documentation OpenAPI lorsque pertinent. - Génère les tests unitaires et d'intégration.

- Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les API générées. 3. Les services créés. 4. Les tests exécutés.

5. Les prochaines étapes.

## Document 10 - Partie 22

### Prompt Cursor - Tests unitaires et d'intégration

### Objectif

Créer automatiquement une stratégie complète de tests unitaires et d'intégration afin de garantir la qualité et la stabilité de tous les modules.

Section

Framework

Tests unitaires

Tests d'intégration

Mocks

Couverture

CI

À générer

Vitest

Composants, services et hooks

API, Prisma et services

Services externes

Rapport de couverture

GitHub Actions

### Prompt Cursor

Agis comme un expert QA senior.

En respectant les Documents 1 à 9 :

- Configure Vitest.

- Génère les tests unitaires des composants, hooks, services et utilitaires.

- Génère les tests d'intégration des API, Prisma et services métier. - Crée les mocks nécessaires pour les services externes.

- Produit un rapport de couverture.

- Intègre les tests dans GitHub Actions. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés. 2. Les tests générés.

3. Le rapport de couverture. 4. Les prochaines étapes.

## Document 10 - Partie 23 Prompt Cursor - Tests End-to-End

### Objectif

Créer automatiquement une suite complète de tests End-to-End garantissant que tous les parcours critiques de l'application fonctionnent correctement.

Section

Framework

Scénarios

Données

CI

Rapports

Nettoyage

À générer

Playwright

Authentification, voyages, véhicules, finances

Jeux de données de test

Exécution GitHub Actions

HTML et traces

Réinitialisation automatique

### Prompt Cursor

Agis comme un expert QA senior.

En respectant les Documents 1 à 9 :

- Configure Playwright.

- Génère les scénarios E2E couvrant les parcours critiques. - Prépare des données de test reproductibles.

- Configure les rapports HTML et les traces. - Intègre les tests dans GitHub Actions.

- Ajoute le nettoyage automatique après exécution. - Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés.

2. Les scénarios générés. 3. Les tests exécutés.

4. Les prochaines étapes.

## Document 10 - Partie 24 Prompt Cursor - Optimisation et performance

### Objectif

Créer automatiquement les optimisations nécessaires pour offrir une application rapide, scalable et prête pour la production.

Section

Frontend

Backend

Images

Monitoring

Cache

Tests

À générer

Code splitting, lazy loading

Cache, pagination, optimisation Prisma

Optimisation Next.js

Web Vitals et Lighthouse

Redis et cache applicatif

Performance automatisée

### Prompt Cursor

Agis comme un expert en performance web.

En respectant les Documents 1 à 9 :

- Optimise le chargement de toutes les pages.

- Implémente le lazy loading, le code splitting et la mise en cache. - Optimise les requêtes Prisma.

- Configure Next/Image.

- Ajoute Redis pour les données fréquemment consultées. - Mesure les Core Web Vitals et Lighthouse.

- Génère les tests de performance. - Mets à jour la documentation.

À la fin, affiche :

1. Les optimisations réalisées. 2. Les fichiers créés.

3. Les métriques obtenues. 4. Les prochaines étapes.

## Document 10 - Partie 25 Prompt Cursor - Déploiement

### Objectif

Créer automatiquement tous les éléments nécessaires au déploiement continu de l'application vers les environnements de staging et de production.

Section

CI/CD

Serveur

Base de données

Variables

Rollback

Tests

À générer

GitHub Actions

PM2 + Nginx

Migrations automatiques

Gestion des secrets

Procédure automatisée

Validation avant déploiement

### Prompt Cursor

Agis comme un expert DevOps senior.

En respectant les Documents 1 à 9 :

- Génère les workflows GitHub Actions.

- Prépare les scripts de déploiement PM2. - Configure Nginx pour la production.

- Automatise les migrations Prisma.

- Gère les variables d'environnement de façon sécurisée. - Ajoute une procédure de rollback.

- Exécute les tests avant chaque déploiement. - Mets à jour la documentation.

À la fin, affiche :

1. Les workflows créés. 2. Les scripts générés.

3. Les vérifications effectuées. 4. Les prochaines étapes.

## Document 10 - Partie 26 Prompt Cursor - Monitoring et observabilité

### Objectif

Créer automatiquement une plateforme complète de monitoring, de journalisation et d'observabilité afin d'assurer la disponibilité de l'application en production.

Section

Logs

Monitoring

Alertes

Métriques

Tableaux

Tests

À générer

Journalisation centralisée

Santé des services

Courriel, Slack/Webhook

CPU, RAM, API, DB

Dashboard d'exploitation

Validation des alertes

### Prompt Cursor

Agis comme un ingénieur SRE senior.

En respectant les Documents 1 à 9 :

- Configure la journalisation centralisée.

- Ajoute des endpoints de santé (health checks).

- Mesure les performances des API, de PostgreSQL et des services. - Génère un tableau de bord d'exploitation.

- Configure les alertes en cas d'incident.

- Vérifie les sauvegardes et les tâches planifiées. - Génère les tests de supervision.

- Mets à jour la documentation.

À la fin, affiche :

1. Les fichiers créés.

2. Les métriques surveillées. 3. Les alertes configurées. 4. Les prochaines étapes.

## Document 10 - Partie 27

### Prompt Cursor - Sauvegardes et reprise après sinistre

### Objectif

Créer automatiquement une stratégie complète de sauvegarde, de restauration et de reprise après sinistre pour protéger l'ensemble de l'application.

Section

Sauvegardes

Automatisation

Restauration

Rétention

PRA

Tests

À générer

PostgreSQL, fichiers et médias

Cron et scripts

Procédures testées

Politiques de conservation

Plan de reprise après sinistre

Validation des restaurations

### Prompt Cursor

Agis comme un architecte DevOps senior.

En respectant les Documents 1 à 9 :

- Génère les scripts de sauvegarde PostgreSQL et des fichiers. - Automatise les sauvegardes planifiées.

- Crée les procédures de restauration. - Définis une politique de rétention.

- Rédige un plan de reprise après sinistre.

- Vérifie automatiquement l'intégrité des sauvegardes. - Génère les tests de restauration.

- Mets à jour la documentation.

À la fin, affiche : 1. Les scripts créés.

2. Les sauvegardes configurées. 3. Les tests exécutés.

4. Les prochaines étapes.

## Document 10 - Partie 28 Prompt Cursor - Sécurité

### Objectif

Créer automatiquement toutes les mesures de sécurité applicative afin de protéger les utilisateurs, les données et l'infrastructure.

Section

Authentification

Protection

Secrets

Audit

Conformité

Tests

À générer

MFA, sessions sécurisées

CSRF, XSS, SQLi, Rate limiting

Gestion des variables sensibles

Journal des événements de sécurité

OWASP ASVS

Analyse de sécurité automatisée

### Prompt Cursor

Agis comme un architecte cybersécurité senior.

En respectant les Documents 1 à 9 :

- Renforce toute l'application selon les bonnes pratiques OWASP.

- Active la protection contre CSRF, XSS, injections SQL et attaques par force brute.

- Prépare l'authentification multifacteur.

- Sécurise les secrets et les variables d'environnement.

- Implémente la journalisation des événements de sécurité. - Génère des tests de sécurité automatisés.

- Mets à jour la documentation.

À la fin, affiche :

1. Les protections ajoutées. 2. Les fichiers créés.

3. Les tests exécutés.

4. Les prochaines étapes.

## Document 10 - Partie 29 Prompt Cursor - Validation finale

### Objectif

Créer un prompt unique permettant de valider que l'ensemble de l'application est conforme aux exigences avant la mise en production.

Section

Compilation

Qualité

Tests

Sécurité

Performance

Documentation

Validation

Build sans erreur

Lint et formatage

Unitaires, intégration et E2E

Contrôles OWASP

Lighthouse et Web Vitals

Synchronisée

### Prompt Cursor

Agis comme un Tech Lead senior.

En respectant les Documents 1 à 10 :

- Vérifie la compilation complète du projet. - Exécute ESLint, Prettier et les tests.

- Vérifie les migrations Prisma.

- Analyse la sécurité et les performances. - Contrôle la conformité du Design System. - Vérifie que la documentation est à jour.

- Génère un rapport final avec les anomalies, leur priorité et les correctifs recommandés.

- Ne modifie rien sans l'indiquer explicitement.

À la fin, fournis : 1. Le bilan global.

2. Les erreurs bloquantes. 3. Les avertissements.

4. Les recommandations avant production.

## Document 10 - Partie 30

### Prompt maître - Génération complète de l'application

### Objectif

Fournir un prompt maître permettant à Cursor d'orchestrer la génération complète de l'application en s'appuyant sur l'ensemble des documents d'architecture et des prompts détaillés.

Entrée

Architecture

Mode

Qualité

Git

Tests

Production

Valeur

Documents 1 à 10

Exécution séquentielle

Validation après chaque étape

Commit à chaque module

Obligatoires avant de poursuivre

Seulement après validation finale

### Prompt Cursor

Agis comme un Architecte Logiciel, Tech Lead, DevOps et Expert Cursor.

Utilise intégralement les Documents 1 à 10 comme source de vérité.

Exécute automatiquement toutes les phases dans l'ordre : 1. Initialisation du projet.

2. Architecture.

3. Base de données. 4. Authentification. 5. Design System.

6. Tous les modules métier. 7. Intégrations externes. 8. Assistant IA.

9. Administration. 10. Tests.

11. Optimisation. 12. Déploiement. 13. Monitoring. 14. Sécurité.

15. Validation finale.

Après chaque phase :

- Corrige les erreurs détectées. - Exécute les tests.

- Mets à jour la documentation. - Prépare le commit Git.

Ne saute aucune étape et ne demande pas de confirmation tant qu'une intervention humaine n'est pas indispensable.

À la fin, produis :

- un rapport d'exécution, - les anomalies restantes, - les recommandations,

- l'état de préparation pour la production.
