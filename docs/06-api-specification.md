# Document 6 — Spécification des API

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

**Document** **6** **-** **Partie** **1** **Architecture** **générale** **des** **API** Spécification de l'architecture API du SaaS.

### 1. Objectifs

Définir les principes d'architecture, les conventions REST, la structure des services et les responsabilités de chaque couche.

### 2. Principes

		Architecture REST versionnée (/api/v1). 	Backend Next.js 16 avec routes API.

		Réponses JSON normalisées. 	Authentification JWT/Auth.js.

		Validation centralisée avec Zod.

		Prisma comme couche d'accès aux données.

		Services métier indépendants des contrôleurs.

**3.** **Architecture** **logique** Couche

Route API Service Repository Providers Cache

Logs

Responsabilités

Validation HTTP, authentification, réponse Règles métier

Accès PostgreSQL via Prisma Google, IA, Stripe, météo Redis

Audit et monitoring

	**4.** **Structure** **des** **endpoints** 	/api/v1/auth

		/api/v1/users

		/api/v1/vehicles 	/api/v1/trips

		/api/v1/maintenance 	/api/v1/activities

		/api/v1/fuel

		/api/v1/weather 	/api/v1/ai

		/api/v1/admin

**5.** **Format** **des** **réponses** Succès:

{

"success": true, "data": {}, "meta": {}

}

Erreur: {

"success": false, "error": {

"code": "...", "message": "...", "details": []

} }

	**6.** **Codes** **HTTP** 	200 OK

		201 Created

		204 No Content 	400 Bad Request

		401 Unauthorized 	403 Forbidden

		404 Not Found 	409 Conflict

		422 Validation Error

		429 Too Many Requests 	500 Internal Server Error

### 7. Standards

1.   Pagination uniforme.

2.   Tri et filtres normalisés.

3.   UUID dans toutes les URL. 4.   Versionnement obligatoire. 5.   Idempotence pour PUT.

6.   Suppression logique privilégiée.

### 8. Critères d'acceptation

		CA-API-001 : critère réservé. 	CA-API-002 : critère réservé. 	CA-API-003 : critère réservé. 	CA-API-004 : critère réservé. 	CA-API-005 : critère réservé.

		CA-API-006 : critère réservé. 	CA-API-007 : critère réservé. 	CA-API-008 : critère réservé. 	CA-API-009 : critère réservé. 	CA-API-010 : critère réservé. 	CA-API-011 : critère réservé. 	CA-API-012 : critère réservé. 	CA-API-013 : critère réservé. 	CA-API-014 : critère réservé. 	CA-API-015 : critère réservé.

## Document 6 - Partie 2 Authentification et sécurité

Spécification des API liées à l'authentification, l'autorisation et la sécurité.

### 1. Objectif

Définir les endpoints, les règles de sécurité et les flux d'authentification de la plateforme.

**2.** **Endpoints** Méthode POST

POST POST POST POST

POST

GET POST

Endpoint /api/v1/auth/register /api/v1/auth/login /api/v1/auth/logout /api/v1/auth/refresh /api/v1/auth/forgot-password /api/v1/auth/reset-password /api/v1/auth/me /api/v1/auth/verify-email

Authentification Non

Non Oui Oui Non

Non

Oui Non

Description Créer un compte Connexion Déconnexion

Renouveler le jeton Réinitialisation

Définir un nouveau mot de passe Profil courant

Validation du courriel

### 3. Validation

		Adresse courriel unique.

		Mot de passe conforme à la politique de sécurité. 	Validation Zod sur toutes les requêtes.

		Protection CSRF lorsque requis.

		Rate limiting sur les endpoints publics.

**4.** **Réponses** Connexion réussie {

"success": true, "data": {

"accessToken": "...", "refreshToken": "...", "user": {}

} }

	**5.** **Gestion** **des** **rôles** 	Utilisateur

		Administrateur

		Super administrateur

### 6. Sécurité

1.   Hachage Argon2 ou bcrypt. 2.   JWT de courte durée.

3.   Refresh Token révocable.

4.   Journalisation des connexions.

5.   Détection des tentatives répétées. 6.   Support futur MFA.

### 7. Codes d'erreur

		AUTH_001 Courriel invalide

		AUTH_002 Mot de passe invalide 	AUTH_003 Compte suspendu

		AUTH_004 Courriel non validé 	AUTH_005 Jeton expiré

		AUTH_006 Accès refusé

### 8. Critères d'acceptation

		CA-AUTH-001 : critère réservé. 	CA-AUTH-002 : critère réservé. 	CA-AUTH-003 : critère réservé. 	CA-AUTH-004 : critère réservé. 	CA-AUTH-005 : critère réservé. 	CA-AUTH-006 : critère réservé. 	CA-AUTH-007 : critère réservé. 	CA-AUTH-008 : critère réservé. 	CA-AUTH-009 : critère réservé. 	CA-AUTH-010 : critère réservé. 	CA-AUTH-011 : critère réservé. 	CA-AUTH-012 : critère réservé. 	CA-AUTH-013 : critère réservé. 	CA-AUTH-014 : critère réservé. 	CA-AUTH-015 : critère réservé.

## Document 6 - Partie 3 Gestion des utilisateurs

Spécification des API de gestion des utilisateurs.

### 1. Objectif

Définir les endpoints permettant de gérer le profil utilisateur, les préférences, les groupes de voyage et les appareils.

**2.** **Endpoints** Méthode

GET PATCH GET

PUT

GET

POST

PATCH

DELETE

GET

DELETE

	Endpoint	Auth /api/v1/users/me	Oui /api/v1/users/me	Oui /api/v1/users/prefer	Oui ences

	/api/v1/users/prefer	Oui ences

	/api/v1/users/travel-	Oui groups /api/v1/users/travel-	Oui groups /api/v1/users/travel-	Oui groups/{id} /api/v1/users/travel-	Oui groups/{id} /api/v1/users/device	Oui s

	/api/v1/users/device	Oui s/{id}

Description Profil courant Modifier le profil Préférences

Mettre à jour les préférences Lister les groupes

Créer un groupe

Modifier un groupe

Supprimer un groupe

Lister les appareils

Déconnecter un appareil

### 3. Validation

		Le profil doit appartenir à l'utilisateur authentifié. 	Validation des champs avec Zod.

		Codes ISO pour pays, langue et devise.

		Les limites de taille sont appliquées aux champs texte.

### 4. Exemples

PATCH /api/v1/users/me {

"firstName":"Daniel", "lastName":"Grosleau", "language":"fr",

"country":"CA" }

### 5. Permissions

1.   Un utilisateur ne peut modifier que ses propres données. 2.   Les administrateurs peuvent consulter tout profil.

3.   Les suppressions sont logiques lorsque possible.

### 6. Codes d'erreur

		USR_001 Utilisateur introuvable 	USR_002 Profil invalide

		USR_003 Groupe inexistant 	USR_004 Accès refusé

		USR_005 Préférences invalides

### 7. Critères d'acceptation

		CA-USR-001 : critère réservé. 	CA-USR-002 : critère réservé. 	CA-USR-003 : critère réservé. 	CA-USR-004 : critère réservé. 	CA-USR-005 : critère réservé. 	CA-USR-006 : critère réservé. 	CA-USR-007 : critère réservé. 	CA-USR-008 : critère réservé. 	CA-USR-009 : critère réservé. 	CA-USR-010 : critère réservé. 	CA-USR-011 : critère réservé. 	CA-USR-012 : critère réservé. 	CA-USR-013 : critère réservé. 	CA-USR-014 : critère réservé. 	CA-USR-015 : critère réservé.

## Document_6-Partie-4_Gestion_Vehicules

Spécification des API liées à la gestion des véhicules des utilisateurs.

### 1. Objectif

Définir les endpoints permettant de créer, modifier, supprimer et consulter les véhicules ainsi que leurs documents et paramètres.

**2.** **Endpoints** Méthode

GET POST GET PATCH DELETE

POST

POST

GET

PATCH

POST

	Endpoint	Auth /api/v1/vehicles	Oui /api/v1/vehicles	Oui /api/v1/vehicles/{id}	Oui /api/v1/vehicles/{id}	Oui /api/v1/vehicles/{id}	Oui

	/api/v1/vehicles/{id}/	Oui photos /api/v1/vehicles/{id}/	Oui documents /api/v1/vehicles/{id}/	Oui maintenance /api/v1/vehicles/{id}/	Oui odometer /api/v1/vehicles/{id}/	Oui primary

Description

Lister les véhicules Créer un véhicule Détails d'un véhicule Modifier un véhicule Supprimer un véhicule

Téléverser une photo

Téléverser un document Historique d'entretien Mettre à jour le kilométrage Définir comme véhicule principal

### 3. Validation

		Le véhicule doit appartenir à l'utilisateur authentifié. 	Le VIN doit être unique lorsqu'il est fourni.

    Le kilométrage ne peut jamais diminuer.     Le modèle doit exister dans le catalogue.

### 4. Exemple

POST /api/v1/vehicles {

"modelId":"uuid", "nickname":"Mon VR", "year":2024, "vin":"1ABC2345678901234", "currentOdometer":15234

}

### 5. Permissions

1.   Un utilisateur gère uniquement ses véhicules.

2.   Les administrateurs peuvent consulter tous les véhicules. 3.   Les suppressions conservent l'historique métier.

### 6. Codes d'erreur

		VEH_001 Véhicule introuvable 	VEH_002 VIN déjà utilisé

		VEH_003 Modèle inexistant

		VEH_004 Kilométrage invalide 	VEH_005 Document non valide

### 7. Critères d'acceptation

		CA-VEH-001 : critère réservé. 	CA-VEH-002 : critère réservé. 	CA-VEH-003 : critère réservé. 	CA-VEH-004 : critère réservé. 	CA-VEH-005 : critère réservé. 	CA-VEH-006 : critère réservé. 	CA-VEH-007 : critère réservé. 	CA-VEH-008 : critère réservé. 	CA-VEH-009 : critère réservé. 	CA-VEH-010 : critère réservé. 	CA-VEH-011 : critère réservé. 	CA-VEH-012 : critère réservé. 	CA-VEH-013 : critère réservé. 	CA-VEH-014 : critère réservé. 	CA-VEH-015 : critère réservé.

**Document_6-Partie-5_Catalogue_Constructeurs_Et_Modeles** Spécification des API du catalogue des constructeurs, modèles et fiches techniques des véhicules.

### 1. Objectif

Définir les endpoints permettant de consulter le catalogue mondial des véhicules et d'alimenter les autres modules.

**2.** **Endpoints** Méthode

GET

GET

GET

GET GET

GET

GET

GET

POST

POST

	Endpoint	Auth /api/v1/manufacture	Oui rs

	/api/v1/manufacture	Oui rs/{id}

	/api/v1/models	Oui

	/api/v1/models/{id}	Oui /api/v1/models/{id}/	Oui specifications /api/v1/models/{id}/	Oui maintenance

	/api/v1/models/{id}/	Oui documents /api/v1/models/{id}/	Oui known-issues /api/v1/admin/catalo	Admin g/import /api/v1/admin/catalo	Admin g/sync

Description Lister les constructeurs Détails d'un constructeur Rechercher des modèles

Détails d'un modèle Fiche technique complète Programme d'entretien constructeur Manuels et documents Problèmes connus

Importer le catalogue

Synchroniser les données

	**3.** **Paramètres** **de** **recherche** 	manufacturer

		category 	year

		fuelType 	engine

		keyword 	page

		pageSize 	sort

### 4. Exemple

GET /api/v1/models?manufacturer=Ford&category=ClassC&year=2025

### 5. Règles métier

1.   Le catalogue est en lecture seule pour les utilisateurs.

2.   Les synchronisations sont réservées aux administrateurs.

3.   Les modèles sont filtrables par année, catégorie et constructeur. 4.   Les fiches techniques sont versionnées.

5.   Les données importées sont validées avant publication.

### 6. Codes d'erreur

		CAT_001 Constructeur introuvable 	CAT_002 Modèle introuvable

		CAT_003 Année invalide

    CAT_004 Données d'import invalides     CAT_005 Synchronisation impossible

### 7. Critères d'acceptation

		CA-CAT-001 : critère réservé. 	CA-CAT-002 : critère réservé. 	CA-CAT-003 : critère réservé. 	CA-CAT-004 : critère réservé. 	CA-CAT-005 : critère réservé. 	CA-CAT-006 : critère réservé. 	CA-CAT-007 : critère réservé. 	CA-CAT-008 : critère réservé. 	CA-CAT-009 : critère réservé. 	CA-CAT-010 : critère réservé. 	CA-CAT-011 : critère réservé. 	CA-CAT-012 : critère réservé. 	CA-CAT-013 : critère réservé. 	CA-CAT-014 : critère réservé. 	CA-CAT-015 : critère réservé.

## Document_6-Partie-6_Voyages_Et_Itineraires

Spécification des API liées à la planification, l'optimisation et l'exécution des voyages.

### 1. Objectif

Définir les endpoints permettant de créer, modifier, optimiser et suivre les voyages ainsi que leurs itinéraires.

**2.** **Endpoints** Méthode

GET POST GET PATCH DELETE POST

POST

PATCH

GET

POST

	Endpoint	Auth /api/v1/trips	Oui /api/v1/trips	Oui /api/v1/trips/{id}	Oui /api/v1/trips/{id}	Oui /api/v1/trips/{id}	Oui /api/v1/trips/{id}/opt	Oui imize

	/api/v1/trips/{id}/sto	Oui ps

	/api/v1/trips/{id}/sto	Oui ps/{stopId} /api/v1/trips/{id}/su	Oui mmary /api/v1/trips/{id}/co	Oui mplete

Description Lister les voyages Créer un voyage

Détails d'un voyage Modifier un voyage Supprimer un voyage Optimiser l'itinéraire

Ajouter une étape

Modifier une étape

Résumé du voyage

Clôturer le voyage

	**3.** **Paramètres** 	origin

		destination

		departureDate 	returnDate

		vehicleId

		travelGroupId 	budget

		avoidTolls

		avoidFerries

		preferredFuelStops 	optimizeFuelCost

**4.** **Exemple** POST /api/v1/trips {

"vehicleId":"uuid",

"travelGroupId":"uuid", "origin":"Saint-Mathias-sur-Richelieu", "destination":"Percé", "departureDate":"2026-08-01", "returnDate":"2026-08-10"

}

### 5. Règles métier

1.   Un voyage doit être associé à un véhicule.

2.   L'optimisation tient compte du type de véhicule, de sa consommation et des prix régionaux du carburant.

3.   Les étapes sont automatiquement renumérotées.

4.   Les coûts estimés sont recalculés après chaque modification. 5.   Les voyages terminés sont archivés mais restent consultables.

### 6. Codes d'erreur

    TRIP_001 Voyage introuvable     TRIP_002 Destination invalide     TRIP_003 Véhicule obligatoire

		TRIP_004 Impossible d'optimiser l'itinéraire 	TRIP_005 Voyage déjà terminé

### 7. Critères d'acceptation

		CA-TRIP-001 : critère réservé. 	CA-TRIP-002 : critère réservé. 	CA-TRIP-003 : critère réservé. 	CA-TRIP-004 : critère réservé. 	CA-TRIP-005 : critère réservé. 	CA-TRIP-006 : critère réservé. 	CA-TRIP-007 : critère réservé. 	CA-TRIP-008 : critère réservé. 	CA-TRIP-009 : critère réservé. 	CA-TRIP-010 : critère réservé. 	CA-TRIP-011 : critère réservé. 	CA-TRIP-012 : critère réservé. 	CA-TRIP-013 : critère réservé. 	CA-TRIP-014 : critère réservé. 	CA-TRIP-015 : critère réservé.

**Document_6-Partie-7_Carburant_Meteo_Et_Donnees_Externes** Spécification des API permettant d'intégrer les fournisseurs de données externes (carburant, météo, cartographie, points d'intérêt et activités).

### 1. Objectif

Définir les services permettant d'alimenter les calculs de voyage avec des données en temps réel et des données mises en cache.

**2.** **Endpoints** Méthode

GET

GET

GET

GET

GET

GET

GET

POST

POST

POST

	Endpoint	Auth /api/v1/fuel/prices	Oui

	/api/v1/fuel/stations	Oui

	/api/v1/weather/fore	Oui cast

	/api/v1/weather/curr	Oui ent

	/api/v1/activities/sea	Oui rch

	/api/v1/campground	Oui s/search /api/v1/poi/search	Oui

	/api/v1/routes/estim	Oui ate-fuel /api/v1/routes/optim	Oui ize-fuel-stops

	/api/v1/admin/exter	Admin nal/sync

Description

Prix du carburant par région

Stations-service à proximité Prévisions météo

Conditions météo actuelles

Recherche d'activités

Recherche de campings Recherche de points d'intérêt

Calcul du coût de carburant Optimiser les arrêts carburant Synchroniser les données externes

	**3.** **Paramètres** 	latitude

		longitude 	radiusKm 	vehicleId 	fuelType 	origin

		destination

		departureDate 	travelGroupId

### 4. Exemple

POST /api/v1/routes/estimate-fuel {

"vehicleId":"uuid", "origin":"Montréal", "destination":"Percé", "fuelType":"Gasoline"

}

### 5. Règles métier

1.   Les données externes sont mises en cache afin de limiter les appels API. 2.   Les prix du carburant sont historisés.

3.   Les prévisions météo expirent automatiquement.

4.   Les activités sont classées selon les préférences du groupe.

5.   Le calcul du carburant utilise la consommation réelle lorsqu'elle est disponible. 6.   Les fournisseurs externes sont interchangeables via une couche d'abstraction.

### 6. Codes d'erreur

		EXT_001 Fournisseur indisponible 	EXT_002 Position invalide

		EXT_003 Données météo indisponibles 	EXT_004 Prix du carburant introuvables 	EXT_005 Itinéraire impossible

### 7. Critères d'acceptation

		CA-EXT-001 : critère réservé. 	CA-EXT-002 : critère réservé. 	CA-EXT-003 : critère réservé. 	CA-EXT-004 : critère réservé. 	CA-EXT-005 : critère réservé. 	CA-EXT-006 : critère réservé. 	CA-EXT-007 : critère réservé. 	CA-EXT-008 : critère réservé. 	CA-EXT-009 : critère réservé. 	CA-EXT-010 : critère réservé. 	CA-EXT-011 : critère réservé. 	CA-EXT-012 : critère réservé. 	CA-EXT-013 : critère réservé. 	CA-EXT-014 : critère réservé. 	CA-EXT-015 : critère réservé.

## Document_6-Partie-8_Entretien_Des_Vehicules

Spécification des API du module d'entretien, des rappels, de l'historique et des documents associés.

### 1. Objectif

Définir les endpoints permettant de gérer entièrement l'entretien des véhicules et les recommandations constructeur.

**2.** **Endpoints** Méthode

GET POST GET

PATCH

DELETE

GET

POST

GET

POST

POST

	Endpoint	Auth /api/v1/maintenance	Oui /api/v1/maintenance	Oui /api/v1/maintenance	Oui /{id}

	/api/v1/maintenance	Oui /{id}

	/api/v1/maintenance	Oui /{id}

	/api/v1/vehicles/{id}/	Oui maintenance/schedul

e

	/api/v1/maintenance	Oui /{id}/documents /api/v1/maintenance	Oui /reminders /api/v1/maintenance	Oui /reminders/{id}/post

pone

	/api/v1/maintenance	Oui /recalculate

Description

Lister les entretiens Créer un entretien Consulter un entretien

Modifier un entretien

Supprimer un entretien Calendrier des entretiens

Ajouter une facture ou un document Lister les rappels

Reporter un rappel

Recalculer les échéances

	**3.** **Paramètres** 	vehicleId

		templateId

		performedDate

		performedOdometer 	provider

		cost

		currency 	notes

### 4. Exemple

POST /api/v1/maintenance {

"vehicleId":"uuid", "templateId":"uuid", "performedDate":"2026-07-15", "performedOdometer":25500, "cost":189.95

}

### 5. Règles métier

1.   L'entretien est associé à un véhicule existant.

2.   Le kilométrage enregistré doit être supérieur ou égal au précédent.

3.   Les rappels sont recalculés automatiquement après chaque intervention. 4.   Les documents sont conservés indépendamment des modifications.

5.   L'IA peut suggérer un entretien préventif avant un long trajet.

6.   Les programmes constructeur restent modifiables par version de véhicule.

### 6. Codes d'erreur

		MNT_001 Entretien introuvable 	MNT_002 Kilométrage invalide 	MNT_003 Véhicule introuvable

		MNT_004 Programme constructeur absent 	MNT_005 Document invalide

### 7. Critères d'acceptation

		CA-MNT-001 : critère réservé. 	CA-MNT-002 : critère réservé. 	CA-MNT-003 : critère réservé. 	CA-MNT-004 : critère réservé. 	CA-MNT-005 : critère réservé. 	CA-MNT-006 : critère réservé. 	CA-MNT-007 : critère réservé. 	CA-MNT-008 : critère réservé. 	CA-MNT-009 : critère réservé. 	CA-MNT-010 : critère réservé. 	CA-MNT-011 : critère réservé. 	CA-MNT-012 : critère réservé. 	CA-MNT-013 : critère réservé. 	CA-MNT-014 : critère réservé. 	CA-MNT-015 : critère réservé.

**Document_6-Partie-9_Budget_Depenses_Et_Abonnements** Spécification des API relatives aux budgets, dépenses, reçus, statistiques financières et abonnements.

### 1. Objectif

Définir les services permettant de suivre les coûts des voyages, les abonnements et les paiements.

**2.** **Endpoints** Méthode

GET

PUT

GET POST PATCH

DELETE

POST

GET

POST

POST

	Endpoint	Auth /api/v1/budgets/{trip	Oui Id}

	/api/v1/budgets/{trip	Oui Id}

	/api/v1/expenses	Oui /api/v1/expenses	Oui /api/v1/expenses/{id	Oui }

	/api/v1/expenses/{id	Oui }

	/api/v1/expenses/{id	Oui }/receipt /api/v1/subscriptions	Oui /me

	/api/v1/subscriptions	Oui /checkout /api/v1/webhooks/st	Public ripe

Description

Budget d'un voyage

Modifier le budget

Lister les dépenses Créer une dépense Modifier une dépense Supprimer une dépense Téléverser un reçu

Consulter l'abonnement Créer une session Stripe

Webhook Stripe

	**3.** **Paramètres** 	tripId

		category 	amount 	currency

		expenseDate 	merchant

		receipt 	plan

		couponCode

### 4. Exemple

POST /api/v1/expenses {

"tripId":"uuid", "category":"Fuel", "amount":87.42, "currency":"CAD", "merchant":"Shell"

}

### 5. Règles métier

1.   Chaque dépense appartient à un voyage.

2.   Le budget restant est recalculé immédiatement. 3.   Les reçus sont analysés par OCR lorsque possible. 4.   Les paiements Stripe sont validés par webhook.

5.   Les changements de forfait ne suppriment jamais les données. 6.   Les devises sont conservées avec chaque transaction.

### 6. Codes d'erreur

		FIN_001 Budget introuvable 	FIN_002 Dépense invalide

		FIN_003 Reçu illisible

		FIN_004 Paiement refusé

		FIN_005 Abonnement introuvable

### 7. Critères d'acceptation

		CA-FIN-001 : critère réservé. 	CA-FIN-002 : critère réservé. 	CA-FIN-003 : critère réservé. 	CA-FIN-004 : critère réservé. 	CA-FIN-005 : critère réservé. 	CA-FIN-006 : critère réservé. 	CA-FIN-007 : critère réservé. 	CA-FIN-008 : critère réservé. 	CA-FIN-009 : critère réservé. 	CA-FIN-010 : critère réservé. 	CA-FIN-011 : critère réservé. 	CA-FIN-012 : critère réservé. 	CA-FIN-013 : critère réservé. 	CA-FIN-014 : critère réservé. 	CA-FIN-015 : critère réservé.

## Document_6-Partie-10_Assistant_IA

Spécification des API de l'assistant intelligent, des conversations, de la mémoire, des recommandations et des outils.

### 1. Objectif

Définir les endpoints permettant à l'application d'interagir avec l'IA tout en conservant un contexte riche et sécurisé.

**2.** **Endpoints** Méthode POST

GET

GET

DELETE

GET

POST

POST

GET

DELETE

POST

	Endpoint	Auth /api/v1/ai/chat	Oui

	/api/v1/ai/conversati	Oui ons

	/api/v1/ai/conversati	Oui ons/{id} /api/v1/ai/conversati	Oui ons/{id} /api/v1/ai/recomme	Oui ndations /api/v1/ai/recomme	Oui ndations/{id}/accept /api/v1/ai/recomme	Oui ndations/{id}/dismiss /api/v1/ai/memory	Oui

	/api/v1/ai/memory/{i	Oui d}

	/api/v1/ai/tools/exec	Oui ute

Description

Envoyer un message à l'IA

Lister les conversations Consulter une conversation Supprimer une conversation Lister les recommandations Accepter une recommandation Ignorer une recommandation

Consulter la mémoire utilisateur

Supprimer un souvenir

Exécuter un outil IA

	**3.** **Paramètres** **principaux** 	conversationId

		message 	context 	tripId

		vehicleId

		travelGroupId 	provider

		model

		temperature 	stream

### 4. Exemple

POST /api/v1/ai/chat

{ "conversationId":"uuid",

"message":"Planifie le trajet le plus économique jusqu'à Percé.", "tripId":"uuid"

}

### 5. Règles métier

1.   L'IA reçoit uniquement le contexte nécessaire. 2.   Les conversations sont historisées.

3.   La mémoire utilisateur est modifiable par celui-ci.

4.   Les recommandations doivent pouvoir être expliquées. 5.   Les calculs critiques restent réalisés côté backend.

6.   Le fournisseur IA est interchangeable (OpenAI, Claude, Gemini, Ollama).

### 6. Codes d'erreur

		AI_001 Conversation introuvable 	AI_002 Fournisseur indisponible 	AI_003 Limite de jetons dépassée 	AI_004 Outil indisponible

		AI_005 Réponse incomplète

	**7.** **Critères** **d'acceptation** 	CA-AI-001 : critère réservé. 	CA-AI-002 : critère réservé. 	CA-AI-003 : critère réservé. 	CA-AI-004 : critère réservé. 	CA-AI-005 : critère réservé. 	CA-AI-006 : critère réservé. 	CA-AI-007 : critère réservé. 	CA-AI-008 : critère réservé. 	CA-AI-009 : critère réservé. 	CA-AI-010 : critère réservé. 	CA-AI-011 : critère réservé. 	CA-AI-012 : critère réservé. 	CA-AI-013 : critère réservé. 	CA-AI-014 : critère réservé. 	CA-AI-015 : critère réservé.

## Document_6-Partie-11_Notifications

Spécification des API de gestion des notifications, alertes et communications utilisateur.

### 1. Objectif

Définir les services permettant d'envoyer, consulter, programmer et gérer toutes les notifications de la plateforme.

**2.** **Endpoints** Méthode

GET

GET

POST

PATCH

PATCH

DELETE

GET

PUT

POST

POST

	Endpoint	Auth /api/v1/notifications	Oui

	/api/v1/notifications/	Oui {id}

	/api/v1/notifications	Admin

	/api/v1/notifications/	Oui {id}/read /api/v1/notifications/	Oui read-all /api/v1/notifications/	Oui {id}

	/api/v1/notification-	Oui preferences /api/v1/notification-	Oui preferences /api/v1/push/register	Oui -device

	/api/v1/admin/notifi	Admin cations/broadcast

Description Lister les notifications Consulter une notification Créer une notification

Marquer comme lue

Tout marquer comme lu Supprimer une notification Préférences utilisateur Modifier les préférences Enregistrer un appareil Diffusion globale

	**3.** **Types** **de** **notifications** 	Entretien à venir

		Budget dépassé

		Voyage imminent 	Météo importante 	Prix du carburant

		Recommandation IA 	Abonnement

		Sécurité

		Annonce système 	Marketing (opt-in)

### 4. Exemple

POST /api/v1/notifications {

"userId":"uuid", "title":"Entretien recommandé", "type":"maintenance", "priority":"high"

}

### 5. Règles métier

1.   Les préférences utilisateur sont toujours respectées.

2.   Les notifications critiques peuvent ignorer le mode silencieux si autorisé par l'utilisateur. 3.   Chaque notification possède un niveau de priorité.

4.   Les notifications expirées sont archivées. 5.   Les envois massifs sont journalisés.

6.   Les notifications push, courriel et in-app utilisent un même moteur.

### 6. Codes d'erreur

		NOTIF_001 Notification introuvable 	NOTIF_002 Appareil non enregistré 	NOTIF_003 Préférences invalides

		NOTIF_004 Diffusion refusée

		NOTIF_005 Fournisseur de notification indisponible

### 7. Critères d'acceptation

		CA-NOTIF-001 : critère réservé. 	CA-NOTIF-002 : critère réservé. 	CA-NOTIF-003 : critère réservé. 	CA-NOTIF-004 : critère réservé. 	CA-NOTIF-005 : critère réservé. 	CA-NOTIF-006 : critère réservé. 	CA-NOTIF-007 : critère réservé. 	CA-NOTIF-008 : critère réservé. 	CA-NOTIF-009 : critère réservé. 	CA-NOTIF-010 : critère réservé. 	CA-NOTIF-011 : critère réservé. 	CA-NOTIF-012 : critère réservé. 	CA-NOTIF-013 : critère réservé. 	CA-NOTIF-014 : critère réservé. 	CA-NOTIF-015 : critère réservé.

## Document_6-Partie-12_Administration

Spécification des API réservées à l'administration de la plateforme.

### 1. Objectif

Définir les endpoints permettant aux administrateurs de superviser les utilisateurs, le catalogue, les intégrations, les statistiques et la configuration globale.

**2.** **Endpoints** Méthode

GET

GET PATCH

POST

POST

GET

GET GET

PUT

POST

	Endpoint	Auth /api/v1/admin/dashb	Admin oard

	/api/v1/admin/users	Admin /api/v1/admin/users/	Admin {id}

	/api/v1/admin/users/	Admin {id}/suspend /api/v1/admin/users/	Admin {id}/reactivate /api/v1/admin/statist	Admin ics

	/api/v1/admin/audit	Admin /api/v1/admin/settin	Admin gs

	/api/v1/admin/settin	Admin gs

	/api/v1/admin/cache	Admin /clear

Description Indicateurs principaux

Lister les utilisateurs Modifier un utilisateur Suspendre un utilisateur

Réactiver un utilisateur Statistiques globales

Journal d'audit Configuration système Modifier la configuration Vider le cache

	**3.** **Modules** **administrables** 	Utilisateurs

		Abonnements

		Catalogue des véhicules 	Campings

		Activités

		Points d'intérêt 	Paramètres IA 	Clés API

		Statistiques 	Audit

### 4. Exemple

PATCH /api/v1/admin/users/{id} {

"status":"suspended",

"reason":"Violation des conditions d'utilisation" }

### 5. Règles métier

1.   Toutes les actions administratives sont journalisées.

2.   Les opérations critiques nécessitent un rôle administrateur. 3.   Les paramètres système sont versionnés.

4.   Les suppressions sont logiques lorsque possible.

5.   Les statistiques sont calculées à partir des données agrégées.

6.   Les changements majeurs peuvent nécessiter une confirmation.

### 6. Codes d'erreur

		ADM_001 Accès refusé

		ADM_002 Paramètre invalide

		ADM_003 Utilisateur introuvable 	ADM_004 Action non autorisée

		ADM_005 Service administratif indisponible

### 7. Critères d'acceptation

		CA-ADM-001 : critère réservé. 	CA-ADM-002 : critère réservé. 	CA-ADM-003 : critère réservé. 	CA-ADM-004 : critère réservé. 	CA-ADM-005 : critère réservé. 	CA-ADM-006 : critère réservé. 	CA-ADM-007 : critère réservé. 	CA-ADM-008 : critère réservé. 	CA-ADM-009 : critère réservé. 	CA-ADM-010 : critère réservé. 	CA-ADM-011 : critère réservé. 	CA-ADM-012 : critère réservé. 	CA-ADM-013 : critère réservé. 	CA-ADM-014 : critère réservé. 	CA-ADM-015 : critère réservé.

## Document_6-Partie-13_Services_Internes

Spécification des services internes, tâches planifiées, cache, importateurs et traitements asynchrones.

### 1. Objectif

Définir les composants backend qui fonctionnent sans interaction directe avec l'utilisateur.

**2.** **Services** Service FuelSync

WeatherRefresh

CatalogImporter

MaintenanceScheduler NotificationDispatcher TripOptimizer StatisticsAggregator CacheCleaner

AuditArchiver BackupVerifier

Fréquence Toutes les heures

Toutes les heures

Quotidien

Chaque nuit Chaque minute À la demande Chaque nuit Chaque nuit

Hebdomadaire Quotidien

Responsabilité Synchroniser les prix du carburant

Rafraîchir les prévisions météo

Importer les nouveaux modèles

Recalculer les échéances Envoyer les notifications Pré-calculer les itinéraires Construire les statistiques Supprimer les entrées expirées

Archiver les journaux Vérifier les sauvegardes

### 3. Cache

		Redis pour les données externes.

		TTL configurable par type de données.

		Invalider le cache après une synchronisation. 	Clés normalisées par module.

	**4.** **Files** **d'attente** 	Notifications

		Import de documents 	OCR des reçus

		Synchronisations externes 	Génération de rapports

		Traitements IA longs

### 5. Règles métier

1.   Tous les jobs sont idempotents.

2.   Les erreurs sont rejouées selon une stratégie de retry. 3.   Chaque exécution est journalisée.

4.   Les jobs critiques déclenchent une alerte en cas d'échec. 5.   Les traitements lourds sont asynchrones.

### 6. Codes d'erreur

		JOB_001 Échec d'exécution 	JOB_002 Timeout

		JOB_003 File saturée

		JOB_004 Synchronisation impossible 	JOB_005 Cache indisponible

### 7. Critères d'acceptation

		CA-JOB-001 : critère réservé. 	CA-JOB-002 : critère réservé. 	CA-JOB-003 : critère réservé. 	CA-JOB-004 : critère réservé. 	CA-JOB-005 : critère réservé. 	CA-JOB-006 : critère réservé. 	CA-JOB-007 : critère réservé. 	CA-JOB-008 : critère réservé. 	CA-JOB-009 : critère réservé. 	CA-JOB-010 : critère réservé. 	CA-JOB-011 : critère réservé. 	CA-JOB-012 : critère réservé. 	CA-JOB-013 : critère réservé. 	CA-JOB-014 : critère réservé. 	CA-JOB-015 : critère réservé.

**Document_6-Partie-14_API_Publiques_Webhooks_Et_Integrations** Spécification des API publiques, webhooks et intégrations avec les services externes.

### 1. Objectif

Définir les interfaces permettant à des services externes de communiquer avec la plateforme de façon sécurisée.

**2.** **API** **publiques** Méthode

GET GET

POST

POST

POST

POST

POST

POST

GET

GET

Endpoint /api/public/v1/health /api/public/v1/versio n /api/public/v1/webh ooks/stripe /api/public/v1/webh ooks/auth /api/public/v1/webh ooks/maps /api/public/v1/webh ooks/weather /api/public/v1/webh ooks/fuel /api/public/v1/integr ations/import /api/public/v1/opena pi /api/public/v1/status

Authentification Aucune

Aucune

Signature

Signature

Signature

Signature

Signature

API Key

API Key

API Key

Description État du service Version de l'API

Paiements Stripe

Événements Auth.js

Notifications cartographiques Mises à jour météo

Prix du carburant

Import de données partenaires Documentation OpenAPI

Statut des intégrations

	**3.** **Intégrations** **prévues** 	Google Maps

		Google Places

		OpenStreetMap

		Weather provider 	Prix du carburant 	Stripe

		OpenAI 	Claude 	Gemini 	Ollama 	SMTP

		Firebase Push Notifications

### 4. Sécurité

1.   Tous les webhooks sont signés.

2.   Les API publiques utilisent des clés API. 3.   Le rate limiting est appliqué.

4.   Les appels sont journalisés.

5.   Les IP peuvent être mises sur liste blanche.

### 5. Codes d'erreur

		PUB_001 Clé API invalide

		PUB_002 Signature invalide

		PUB_003 Fournisseur indisponible 	PUB_004 Quota dépassé

		PUB_005 Intégration désactivée

### 6. Critères d'acceptation

		CA-PUB-001 : critère réservé. 	CA-PUB-002 : critère réservé. 	CA-PUB-003 : critère réservé. 	CA-PUB-004 : critère réservé. 	CA-PUB-005 : critère réservé. 	CA-PUB-006 : critère réservé. 	CA-PUB-007 : critère réservé. 	CA-PUB-008 : critère réservé. 	CA-PUB-009 : critère réservé. 	CA-PUB-010 : critère réservé. 	CA-PUB-011 : critère réservé. 	CA-PUB-012 : critère réservé. 	CA-PUB-013 : critère réservé. 	CA-PUB-014 : critère réservé. 	CA-PUB-015 : critère réservé.

**Document_6-Partie-15_Standards_REST_Versionnement_Erreurs_Et_Annexes** Spécification des standards de développement applicables à l'ensemble des API de la plateforme.

### 1. Objectif

Définir les conventions communes afin d'assurer la cohérence, la maintenabilité et l'évolutivité de toutes les API.

### 2. Standards REST

		Utilisation des verbes HTTP standards (GET, POST, PUT, PATCH, DELETE). 	Endpoints utilisant des noms au pluriel.

		UUID comme identifiant principal.

		Aucune logique métier dans les routes. 	Versionnement obligatoire via /api/v1/. 	Toutes les réponses au format JSON.

**3.** **Convention** **de** **pagination** Paramètres standards :

page pageSize sort order search filter

**4.** **Convention** **des** **réponses** Réponse succès

{

"success": true, "data": {}, "meta": {

"page":1, "pageSize":25

} }

Réponse erreur

{

"success": false, "error":{

"code":"...", "message":"..."

} }

### 5. Journalisation

1.   Toutes les erreurs sont journalisées.

2.   Toutes les actions administratives sont auditées. 3.   Les appels externes sont tracés.

4.   Les temps de réponse sont enregistrés. 5.   Les erreurs critiques génèrent une alerte.

### 6. Versionnement

		Une nouvelle version majeure crée /api/v2.

		Les versions précédentes restent supportées pendant une période de transition. 	Les endpoints dépréciés sont documentés.

		Les changements incompatibles sont annoncés avant leur retrait.

	**7.** **Conventions** **de** **développement** 	Validation avec Zod.

		Prisma pour toutes les opérations SQL.

		Aucune requête SQL brute sans justification. 	Couverture de tests automatisés.

		Documentation OpenAPI maintenue.

		Commentaires uniquement lorsque nécessaires.

	**8.** **Liste** **standard** **des** **codes** **HTTP** 	200 OK

		201 Created

		204 No Content 	400 Bad Request

		401 Unauthorized 	403 Forbidden

		404 Not Found 	409 Conflict

		422 Unprocessable Entity 	429 Too Many Requests 	500 Internal Server Error 	503 Service Unavailable

	**9.** **Checklist** **avant** **mise** **en** **production** 	Validation Zod terminée

		Tests unitaires réussis

		Tests d'intégration réussis

		Tests de performance validés

		Documentation OpenAPI mise à jour 	Migration Prisma validée

		Rollback disponible

		Journalisation vérifiée 	Monitoring configuré 	Sauvegarde effectuée

### 10. Critères d'acceptation

		CA-STD-001 : critère réservé. 	CA-STD-002 : critère réservé. 	CA-STD-003 : critère réservé. 	CA-STD-004 : critère réservé. 	CA-STD-005 : critère réservé. 	CA-STD-006 : critère réservé. 	CA-STD-007 : critère réservé. 	CA-STD-008 : critère réservé. 	CA-STD-009 : critère réservé. 	CA-STD-010 : critère réservé. 	CA-STD-011 : critère réservé. 	CA-STD-012 : critère réservé. 	CA-STD-013 : critère réservé. 	CA-STD-014 : critère réservé. 	CA-STD-015 : critère réservé.
