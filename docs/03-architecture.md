# Document 3 — Architecture fonctionnelle et technique

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

# 03 - Architecture fonctionnelle et technique

Version 1.0

## 1. Objectif

Définir l'architecture cible du SaaS afin d'assurer une base évolutive, modulaire, sécuritaire et adaptée à une croissance internationale.

## 2. Architecture générale

Frontend : Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui.

Backend : API Next.js + services modulaires.

Base de données : PostgreSQL via Prisma ORM.

Cache : Redis.

Stockage : objet compatible S3.

Authentification : Auth.js ou Supabase Auth.

Paiements : Stripe.

Notifications : courriel, push, SMS (évolutif).

Exécution des processus : Node.js + PM2 derrière Nginx, directement sur le serveur (sans Docker ni conteneurisation), conformément au Document 8.

## 3. Modules applicatifs

Authentification

Gestion des utilisateurs

Profils voyageurs

Familles

Véhicules

Constructeurs et modèles

Voyages

Optimisation carburant

Entretien

Budget

Activités

Campings

Stations-service

Points d'intérêt

Météo

Assistant IA

Notifications

Administration

Abonnements

Journalisation

## 4. Architecture IA

Couche d'abstraction indépendante du fournisseur.

Support OpenAI, Claude, Gemini.

Contexte utilisateur centralisé.

Historique conversationnel.

Mémoire des préférences.

RAG pour les manuels, fiches techniques et base documentaire.

Calculs métier réalisés hors IA.

## 5. Services externes

Google Maps

Google Places

OpenRouteService

OpenWeather

Prix du carburant

Stripe

Firebase Cloud Messaging

SMTP

## 6. Flux principaux

Connexion → Tableau de bord

Ajout véhicule → Synchronisation → Entretien

Création voyage → Optimisation → IA → Budget

Voyage en cours → Notifications → Activités → Journal

## 7. Sécurité

HTTPS obligatoire

JWT sécurisés

Chiffrement des données sensibles

Sauvegardes automatiques

Journal d'audit

Protection contre les abus IA

## 8. Évolutivité

Architecture modulaire

Internationalisation dès le départ

Ajout futur : motos, bateaux, camions, Europe

API publique versionnée

## 9. Décisions d'architecture

| Sujet | Décision | Justification |
| --- | --- | --- |
| Framework | Next.js | Écosystème mature |
| BDD | PostgreSQL | Robuste |
| ORM | Prisma | Productivité |
| IA | Abstraction multi-modèles | Éviter la dépendance |
| Cartographie | Google Maps | Richesse des données |
| Paiement | Stripe | Abonnements |

## 10. Évolutions prévues

Architecture - évolution prévue #1: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #2: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #3: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #4: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #5: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #6: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #7: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #8: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #9: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #10: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #11: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #12: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #13: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #14: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #15: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #16: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #17: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #18: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #19: emplacement réservé pour les décisions futures.

Architecture - évolution prévue #20: emplacement réservé pour les décisions futures.