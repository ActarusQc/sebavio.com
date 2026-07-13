# Document 9 — Prompts Cursor : fondations

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

## Document 9 - Partie 1 Prompts Cursor - Fondations du projet

### Objectif

Définir la première série de prompts destinés à Cursor afin d'automatiser la mise en place des fondations techniques de l'application conformément aux documents d'architecture précédents.

Bloc

Infrastructure

Projet

Qualité

Architecture

UI

Base

Documentation

Contenu

Validation de l'environnement

Initialisation Next.js

ESLint, Prettier, Husky

Structure feature-first

Tailwind, shadcn/ui

Prisma + PostgreSQL

README et conventions

### Prompts à produire

	•	Prompt d'initialisation du dépôt.

	•	Prompt de création de l'architecture.

	•	Prompt d'installation des dépendances. •	Prompt de configuration TypeScript.

	•	Prompt de configuration Prisma.

	•	Prompt de configuration Tailwind et shadcn/ui. •	Prompt de validation finale.

### Structure attendue

	•	Un prompt par objectif. •	Prompts idempotents. •	Étapes vérifiables.

	•	Retour d'état attendu après chaque exécution.

### Critères d'acceptation

	•	Tous les prompts exécutables dans Cursor. •	Aucune intervention manuelle inutile.

	•	Résultat reproductible.

	•	Conforme aux Documents 1 à 8.

## Document 9 - Partie 2

### Prompts Cursor - Authentification et Design System

### Objectif

Définir les prompts Cursor nécessaires pour générer le système d'authentification, le Design System et les composants de base de façon entièrement automatisée.

Bloc

Authentification

Sécurité

Design System

Composants

Navigation

Qualité

Prompts à produire

Auth.js, sessions, middleware, rôles

Validation Zod, Argon2, protection CSRF

Tailwind, shadcn/ui, thèmes

Button, Card, Input, Modal, Table, Toast

Layout, Header, Sidebar

Tests et documentation

### Prompts à générer

	•	Créer Auth.js avec gestion des sessions.

	•	Créer les pages Connexion, Inscription et Mot de passe oublié. •	Créer les middlewares et la protection des routes.

	•	Créer le Design System complet.

	•	Créer les composants réutilisables. •	Créer les layouts principaux.

	•	Créer les tests associés.

### Exigences

	•	Prompts idempotents. •	TypeScript strict.

	•	Respect des Documents 1 à 8. •	Code documenté.

	•	Tests inclus.

### Critères d'acceptation

	•	Authentification fonctionnelle. •	Design System complet.

	•	Compilation sans erreur.

	•	Documentation générée.

## Document 9 - Partie 3 Prompts Cursor - Modules métier (Partie 1)

### Objectif

Définir les prompts Cursor permettant de générer automatiquement les premiers modules métier de l'application en respectant l'architecture établie.

Module

Utilisateurs

Catalogue

Véhicules

Navigation

API

Tests

Prompts à produire

CRUD, profils, préférences

Constructeurs, modèles, versions

CRUD complet, documents, photos

Routes, permissions

Endpoints REST/Server Actions

Validation automatique

### Prompts à générer

	•	Création du module Utilisateurs.

	•	Création du module Catalogue des véhicules. •	Création du module Gestion des véhicules.

	•	Génération des schémas Prisma associés. •	Création des API et validations Zod.

	•	Création des composants React et formulaires. •	Création des tests unitaires.

### Exigences

	•	Prompts idempotents.

	•	Respect strict du Design System. •	Code TypeScript strict.

	•	Aucune duplication de logique. •	Architecture feature-first.

### Critères d'acceptation

	•	Modules générés sans erreur. •	Compilation réussie.

	•	Tests automatisés verts.

	•	Conformité avec les Documents 1 à 8.

## Document 9 - Partie 4 Prompts Cursor - Modules métier (Partie 2)

### Objectif

Définir les prompts Cursor permettant de générer les modules de gestion des voyages, entretiens, cartes et services connectés en suivant les standards du projet.

Module

Voyages

Entretien

Google Maps

Services

Finances

Tests

Prompts à produire

CRUD, étapes, itinéraires

Calendrier, rappels, historique

Carte, itinéraires, marqueurs

Carburant, météo, campings

Budgets, dépenses, rapports

Validation automatisée

### Prompts à générer

	•	Créer le module Voyages complet. •	Créer le module Entretien.

	•	Créer le composant Google Maps et les services cartographiques. •	Créer les intégrations Carburant, Météo, Campings et Activités.

	•	Créer le module Finances.

	•	Créer les API, validations et tests associés.

### Exigences

	•	Respect de l'architecture feature-first. •	Prompts idempotents.

	•	Code TypeScript strict.

	•	Conformité au Design System.

	•	Tests inclus dans chaque génération.

### Critères d'acceptation

	•	Compilation sans erreur.

	•	Tests unitaires et E2E réussis. •	API documentées.

	•	Modules conformes aux Documents 1 à 8.

## Document 9 - Partie 5

### Prompts Cursor - IA, Administration et Production

### Objectif

Définir les derniers prompts Cursor afin de générer les modules d'intelligence artificielle, d'administration, de notifications, des tests finaux et de la mise en production.

Module

Assistant IA

Notifications

Administration

Déploiement

Monitoring

Validation

Prompts à produire

Chat, mémoire, outils, fournisseurs

Push, courriel, centre de notifications

Gestion, audit, supervision

PM2, Nginx, GitHub Actions

Logs, alertes, sauvegardes

Tests finaux et checklist

### Prompts à générer

	•	Créer le module Assistant IA.

	•	Créer le système complet de notifications. •	Créer le portail d'administration.

	•	Générer les workflows GitHub Actions.

	•	Créer les scripts de déploiement PM2/Nginx. •	Créer le monitoring et les sauvegardes.

	•	Créer la checklist finale de validation.

### Exigences

	•	Prompts autonomes et idempotents. •	Conformes à l'architecture définie.

	•	Production-ready.

	•	Documentation automatique. •	Tests inclus.

### Critères d'acceptation

	•	L'application est entièrement générée. •	Tous les tests passent.

•    Déploiement automatisé. •    Documentation complète.

	•	Conformité avec les Documents 1 à 9.

## Document 9 - Partie 6 Stratégie d'exécution avec Cursor

### Objectif

Définir la méthode d'utilisation des prompts Cursor afin de construire l'application de façon entièrement séquentielle, reproductible et contrôlée.

	Phase	Objectif

	1	Initialiser l'infrastructure

	2	Créer l'architecture du projet

	3	Générer les modules métier

	4	Ajouter les intégrations externes

	5	Implanter l'IA et l'administration

	6	Tester, déployer et valider

### Ordre d'exécution

	•	Exécuter les prompts dans l'ordre des Documents 8 et 9. •	Valider chaque génération avant la suivante.

	•	Conserver chaque commit Git fonctionnel. •	Corriger les écarts avant de poursuivre.

### Règles

	•	Ne jamais lancer plusieurs prompts incompatibles simultanément.

	•	Toujours demander à Cursor de respecter les documents d'architecture. •	Conserver un historique des décisions techniques.

	•	Automatiser les tests après chaque génération.

### Livrables

	•	Application compilable à chaque étape. •	Documentation mise à jour.

	•	Tests verts.

	•	Historique Git cohérent.

## Document 9 - Partie 7 Checklist finale de développement

### Objectif

Fournir une checklist complète permettant de valider que l'application est prête pour la mise en production.

Catégorie

Architecture

Code

Tests

Sécurité

Performance

Documentation

Déploiement

Validation

Documents respectés

Compilation sans erreur

Vitest, Playwright réussis

Authentification et permissions validées

Lighthouse conforme

À jour

Pipeline CI/CD validé

### Checklist technique

	•	Le projet compile sans erreur.

	•	Les migrations Prisma sont appliquées. •	Tous les tests unitaires sont réussis.

	•	Tous les tests E2E sont réussis.

	•	Aucun avertissement ESLint bloquant. •	Les dépendances sont à jour.

### Checklist fonctionnelle

	•	Tous les modules sont accessibles. •	Les permissions sont validées.

	•	Les formulaires sont fonctionnels.

	•	Les notifications sont opérationnelles. •	L'assistant IA répond correctement.

### Checklist production

	•	HTTPS actif.

	•	Sauvegardes validées. •	Monitoring configuré.

	•	Rollback documenté.

	•	Documentation finale complétée.

## Document 9 - Partie 8 Gouvernance et évolution du projet

### Objectif

Définir les règles permettant de faire évoluer l'application sans dégrader l'architecture, la qualité du code ou la cohérence des fonctionnalités.

Volet

Architecture

Documentation

Git

Qualité

Versionnement

Dette technique

Règle

Toute nouvelle fonctionnalité respecte l'architecture feature-first

Les documents d'architecture sont mis à jour avant le code

Une fonctionnalité = une branche = une Pull Request

Tests et revue obligatoires

Semantic Versioning

Suivi et planification continue

### Processus d'évolution

	•	Toute demande est documentée avant son développement. •	Les impacts sur les documents existants sont analysés.

	•	Les changements sont validés sur un environnement de staging. •	La production n'est mise à jour qu'après validation complète.

### Bonnes pratiques Cursor

	•	Utiliser des prompts ciblés.

	•	Limiter chaque prompt à un objectif précis.

	•	Conserver l'historique des prompts exécutés. •	Documenter toute décision prise par l'IA.

### Critères d'acceptation

	•	Architecture préservée.

	•	Documentation synchronisée. •	Qualité maintenue.

	•	Évolution maîtrisée.

## Document 9 - Partie 9 Annexes et références

### Objectif

Centraliser les références techniques, les conventions, les dépendances et les documents qui servent de fondation à l'ensemble du projet.

Catégorie

Architecture

Roadmap

Prompts

Technologies

Qualité

Déploiement

Références

Documents 1 à 8

Document 8

Documents 9

Next.js, Prisma, PostgreSQL, Tailwind, Auth.js

Vitest, Playwright, ESLint, Prettier

PM2, Nginx, GitHub Actions

## Documentation de référence

	•	Tous les développements doivent respecter les documents d'architecture. •	Les décisions techniques importantes sont documentées.

	•	Les changements majeurs nécessitent une mise à jour documentaire.

### Conventions de maintenance

	•	Une seule source de vérité pour chaque sujet. •	Versionnement des documents.

	•	Archivage des versions obsolètes.

	•	Synchronisation entre code et documentation.

### Critères de clôture

	•	La documentation est complète. •	Les références sont à jour.

	•	Tous les liens internes sont validés.

	•	Le projet est prêt pour son évolution future.

## Document 9 - Partie 10 Guide de démarrage du projet

### Objectif

Décrire l'ordre recommandé pour démarrer le développement complet de l'application en utilisant toute la documentation produite.

	Étape	Action

	1	Lire les Documents 1 à 7

	2	Suivre la Roadmap (Document 8)

	3	Exécuter les prompts Cursor (Document 9)

	4	Valider les tests

	5	Déployer sur staging

	6	Mettre en production

### Ordre recommandé

	•	Préparer l'infrastructure.

	•	Créer les fondations du projet. •	Développer les modules métier.

	•	Ajouter les intégrations externes. •	Implanter l'assistant IA.

	•	Exécuter les tests.

	•	Déployer progressivement.

### Bonnes pratiques

	•	Faire un commit Git après chaque étape majeure. •	Conserver la documentation synchronisée.

	•	Corriger immédiatement les régressions. •	Ne pas sauter d'étape de la roadmap.

### Validation finale

	•	L'application compile. •	Les tests sont réussis.

	•	La documentation est complète. •	La production est prête.
