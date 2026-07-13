# Document 4 — Conception de la base de données

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

## Document 4 - Base de données Partie 1 : Normes de conception

### 1. Objectif

Ce document définit les normes qui devront être respectées pour toutes les tables, relations, index, migrations et évolutions de la base PostgreSQL.

### 2. Philosophie

La base de données constitue la source de vérité. Les calculs métier sont effectués côté serveur. Les données sont normalisées afin d'éviter les duplications.

### 3. Conventions de nommage

Toutes les tables utilisent le snake_case, les clés primaires sont nommées id, les clés étrangères utilisent le format xxx_id.

### 4. Identifiants

Toutes les tables utilisent des UUID v4 comme clé primaire.

### 5. Horodatage

Toutes les tables métier possèdent created_at et updated_at. Les suppressions logiques utilisent deleted_at lorsque requis.

### 6. Types de données

TEXT pour les contenus libres, VARCHAR lorsque la longueur est connue, NUMERIC pour les montants, TIMESTAMPTZ pour les dates.

### 7. Contraintes

Toutes les clés étrangères sont protégées. Les champs obligatoires sont NOT NULL. Les validations critiques sont effectuées côté API et côté base.

### 8. Indexation

Créer des index sur toutes les clés étrangères, les colonnes de recherche fréquente, les dates de voyage, les courriels et les VIN.

### 9. Performance

Limiter les requêtes N+1, utiliser Prisma avec chargement sélectif, privilégier les index composites pour les recherches multi-critères.

### 10. Sécurité

Aucune donnée sensible n'est stockée en clair. Les mots de passe sont hachés. Les secrets sont conservés hors base.

### 11. Journalisation

Les opérations critiques sont enregistrées dans audit_logs avec utilisateur, action, date, ancienne valeur et nouvelle valeur.

### 12. Sauvegardes

Sauvegarde PostgreSQL quotidienne, rétention 30 jours, restauration testée mensuellement.

### 13. Migrations

Toutes les modifications passent par Prisma Migrate. Les migrations sont immuables une fois déployées.

### 14. Évolutivité

Les nouvelles fonctionnalités doivent privilégier l'ajout de tables plutôt que la modification des structures existantes.

### 15. Internationalisation

Toutes les devises utilisent ISO-4217, toutes les langues ISO-639-1, toutes les dates UTC.

**16.** **Standards** **applicables**     UUID sur toutes les entités.

		Soft delete uniquement lorsque nécessaire.

		Jamais de cascade delete sur les données utilisateur critiques. 	Toutes les tables documentées avant leur création.

		Une migration par évolution fonctionnelle. 	Index documentés avec justification.

		Contraintes métier décrites dans le PRD.

		Historique conservé pour les opérations importantes.

**17.** **Checklist** **avant** **création** **d'une** **table** 1.   La table est-elle réellement nécessaire ?

2.   Les relations sont-elles normalisées ? 3.   Les index sont-ils définis ?

4.   Les contraintes NOT NULL sont-elles justifiées ? 5.   Les besoins futurs ont-ils été anticipés ?

6.   Les champs d'audit sont-ils présents ? 7.   Le nom respecte-t-il les conventions ? 8.   Une migration Prisma est-elle prévue ?

### 18. Annexes

		Espace réservé pour décision d'architecture #1. 	Espace réservé pour décision d'architecture #2. 	Espace réservé pour décision d'architecture #3. 	Espace réservé pour décision d'architecture #4.

		Espace réservé pour décision d'architecture #5. 	Espace réservé pour décision d'architecture #6. 	Espace réservé pour décision d'architecture #7. 	Espace réservé pour décision d'architecture #8. 	Espace réservé pour décision d'architecture #9. 	Espace réservé pour décision d'architecture #10. 	Espace réservé pour décision d'architecture #11. 	Espace réservé pour décision d'architecture #12. 	Espace réservé pour décision d'architecture #13. 	Espace réservé pour décision d'architecture #14. 	Espace réservé pour décision d'architecture #15. 	Espace réservé pour décision d'architecture #16. 	Espace réservé pour décision d'architecture #17. 	Espace réservé pour décision d'architecture #18. 	Espace réservé pour décision d'architecture #19. 	Espace réservé pour décision d'architecture #20. 	Espace réservé pour décision d'architecture #21. 	Espace réservé pour décision d'architecture #22. 	Espace réservé pour décision d'architecture #23. 	Espace réservé pour décision d'architecture #24. 	Espace réservé pour décision d'architecture #25. 	Espace réservé pour décision d'architecture #26. 	Espace réservé pour décision d'architecture #27. 	Espace réservé pour décision d'architecture #28. 	Espace réservé pour décision d'architecture #29. 	Espace réservé pour décision d'architecture #30.

## Document 4 - Partie 2 Gestion des utilisateurs

Spécification détaillée de la conception des données liées aux utilisateurs.

### 1. Objectifs

Le module Utilisateurs est le cœur du système. Il gère l'identité, l'authentification, les préférences, les permissions et toutes les relations avec les autres modules.

**Table** **:** **users** Champ

id email

password_hash email_verified_at

status

role

created_at updated_at

**Table** **:** **user_profiles** Champ

user_id first_name last_name language country currency timezone travel_style

budget_level

Type UUID

VARCHAR(255)

TEXT TIMESTAMPTZ

VARCHAR(20)

VARCHAR(20)

TIMESTAMPTZ TIMESTAMPTZ

Type UUID

VARCHAR(100) VARCHAR(100) CHAR(2) CHAR(2) CHAR(3) VARCHAR(100) VARCHAR(50)

VARCHAR(30)

Contraintes PK

UNIQUE, NOT NULL

NULL NULL

NOT NULL

NOT NULL

NOT NULL NOT NULL

Contraintes FK users NOT NULL NOT NULL NOT NULL NOT NULL NOT NULL NOT NULL

Description Identifiant unique. Adresse de connexion.

Absent si OAuth. Validation du courriel.

active, suspended, deleted.

user, admin, super_admin. Création. Modification.

Description Relation 1:1. Prénom. Nom.

fr, en... ISO-3166.

CAD, USD... Fuseau horaire. Aventure, famille, luxe...

Économique, moyen, premium.

### Table : user_preferences

Champ user_id distance_unit

temperature_unit fuel_unit notifications_enable

Type UUID

VARCHAR(10) VARCHAR(5) VARCHAR(20) BOOLEAN

Contraintes FK

Description Utilisateur. km ou miles. C ou F.

L/100 ou MPG. Notifications

d

	ai_proactive	BOOLEAN

globales.

IA proactive.

**Table** **:** **user_devices** Champ

id user_id

device_name platform push_token

last_seen_at

Type UUID UUID

VARCHAR(100) VARCHAR(20) TEXT TIMESTAMPTZ

Contraintes PK

FK

Description

Android, iOS, Web.

### Relations

		users 1→1 user_profiles

		users 1→1 user_preferences 	users 1→N vehicles

		users 1→N trips

		users 1→N notifications 	users 1→N subscriptions

		users 1→N ai_conversations 	users 1→N user_devices

### Règles métier

1.   Un courriel ne peut appartenir qu'à un seul compte. 2.   Le changement de langue est immédiat.

3.   La devise par défaut dépend du pays.

4.   Un utilisateur suspendu ne peut plus créer de voyage.

5.   Un utilisateur supprimé est anonymisé selon la politique de conservation. 6.   L'authentification OAuth et locale peuvent coexister.

	**Index** **recommandés** 	users(email) UNIQUE 	users(status)

    user_profiles(country)     user_devices(user_id)

		user_devices(last_seen_at)

### Cas d'utilisation

		UC-001 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-002 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-003 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-004 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-005 : scénario utilisateur réservé à détailler lors des itérations suivantes.

		UC-006 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-007 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-008 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-009 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-010 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-011 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-012 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-013 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-014 : scénario utilisateur réservé à détailler lors des itérations suivantes. 	UC-015 : scénario utilisateur réservé à détailler lors des itérations suivantes.

## Document 4 - Partie 3

### Familles, voyageurs et préférences

Spécification détaillée du modèle de données pour les familles, les compagnons de voyage et les préférences de personnalisation.

### 1. Objectifs

Permettre à l'application de personnaliser les recommandations, les itinéraires, les activités et les interventions de l'IA selon la composition du groupe de voyage.

**Table** **:** **travel_groups** Champ

id

owner_user_id name default_group created_at updated_at

Type UUID

UUID VARCHAR(150) BOOLEAN TIMESTAMPTZ TIMESTAMPTZ

Contraintes PK

FK users NOT NULL

Description Identifiant du groupe. Propriétaire. Nom du groupe.

Groupe par défaut. Création. Modification.

### Table : travel_members

Champ id group_id

first_name birth_date relationship

mobility_level special_needs notes

**Table** **:** **pets** Champ

id group_id name species breed weight_kg

notes

Type UUID UUID

VARCHAR(100) DATE VARCHAR(30)

VARCHAR(30) TEXT

TEXT

Type UUID UUID

VARCHAR(100) VARCHAR(50) VARCHAR(100) NUMERIC(5,2) TEXT

Contraintes PK

FK travel_groups

Contraintes PK

FK travel_groups

Description

Pour calculer l'âge. Conjoint, enfant, ami...

Normale, réduite... Besoins particuliers.

Description

Chien, chat...

### Table : travel_preferences

Champ                              Type group_id                           UUID

	
Contraintes	Description FK travel_groups

max_drive_hours daily_budget preferred_campgrou nd_type

avoid_tolls avoid_ferries preferred_activity_ty pes food_preferences accessibility_required

NUMERIC(4,1) NUMERIC(10,2) VARCHAR(50)

BOOLEAN BOOLEAN JSONB

JSONB BOOLEAN

### Relations

		users 1→N travel_groups

		travel_groups 1→N travel_members 	travel_groups 1→N pets

		travel_groups 1→1 travel_preferences

		travel_groups N→N trips (via une table de liaison future si nécessaire)

### Règles métier

1.   Un utilisateur peut créer plusieurs groupes de voyage. 2.   Un groupe peut être composé d'une seule personne.

3.   L'âge des enfants est calculé automatiquement à partir de la date de naissance.

4.   Les recommandations d'activités tiennent compte de l'âge du plus jeune et du plus âgé.

5.   La présence d'animaux influence les recommandations de campings, restaurants et activités. 6.   Les préférences peuvent être modifiées pour chaque voyage sans modifier le profil principal. 7.   Les préférences alimentaires sont utilisées pour les suggestions de restaurants.

### Personnalisation IA

		L'IA adapte les itinéraires selon la fatigue estimée du groupe.

		L'IA privilégie des pauses plus fréquentes lorsqu'il y a de jeunes enfants.

		L'IA évite les activités incompatibles avec les animaux si un animal accompagne le voyage. 	L'IA tient compte du budget quotidien pour recommander des activités.

### Index recommandés

		travel_groups(owner_user_id) 	travel_members(group_id)

		pets(group_id)

		travel_preferences(group_id UNIQUE)

### Cas d'utilisation à documenter

		UC-FAM-001 : scénario détaillé réservé. 	UC-FAM-002 : scénario détaillé réservé. 	UC-FAM-003 : scénario détaillé réservé.

		UC-FAM-004 : scénario détaillé réservé. 	UC-FAM-005 : scénario détaillé réservé. 	UC-FAM-006 : scénario détaillé réservé. 	UC-FAM-007 : scénario détaillé réservé. 	UC-FAM-008 : scénario détaillé réservé. 	UC-FAM-009 : scénario détaillé réservé. 	UC-FAM-010 : scénario détaillé réservé. 	UC-FAM-011 : scénario détaillé réservé. 	UC-FAM-012 : scénario détaillé réservé. 	UC-FAM-013 : scénario détaillé réservé. 	UC-FAM-014 : scénario détaillé réservé. 	UC-FAM-015 : scénario détaillé réservé. 	UC-FAM-016 : scénario détaillé réservé. 	UC-FAM-017 : scénario détaillé réservé. 	UC-FAM-018 : scénario détaillé réservé. 	UC-FAM-019 : scénario détaillé réservé. 	UC-FAM-020 : scénario détaillé réservé.

## Document 4 - Partie 4

### Constructeurs, modèles et catalogue des véhicules

Spécification détaillée de la base de données des constructeurs et des modèles de véhicules (voitures et véhicules récréatifs).

### 1. Objectifs

Constituer un catalogue mondial de référence permettant de personnaliser les calculs, l'entretien, les itinéraires et les recommandations de l'IA.

**Table** **:** **manufacturers** Champ

id name

country_code website support_url

logo_url active created_at updated_at

Type UUID

VARCHAR(150) CHAR(2) VARCHAR(255) VARCHAR(255)

TEXT BOOLEAN TIMESTAMPTZ TIMESTAMPTZ

Contraintes PK

UNIQUE

Description Identifiant. Nom officiel. Pays d'origine. Site officiel. Support constructeur. Logo.

Visible.

### Table : vehicle_models

Champ id

manufacturer_id category

model_name trim

year engine

transmission drive_type fuel_type

fuel_capacity_l avg_consumption length_m width_m height_m gvwr_kg

Type UUID UUID

VARCHAR(30)

VARCHAR(150) VARCHAR(150) INTEGER VARCHAR(150) VARCHAR(100) VARCHAR(30) VARCHAR(30)

NUMERIC(6,2) NUMERIC(6,2) NUMERIC(6,2) NUMERIC(6,2) NUMERIC(6,2) INTEGER

Contraintes PK

FK

Description

Car, ClassA, ClassB, ClassC, FifthWheel, TravelTrailer...

FWD,RWD,AWD,4x4 Gasoline, Diesel, Electric...

L/100 km

sleeping_capacity fresh_water_l grey_water_l black_water_l created_at updated_at

	
INTEGER	VR INTEGER	VR INTEGER	VR INTEGER	VR TIMESTAMPTZ

TIMESTAMPTZ

### Table : vehicle_documents

Champ id model_id

document_type

title file_url language version

**Table** **:** **known_issues** Champ

id model_id title description severity source

verified

Type UUID UUID

VARCHAR(50)

VARCHAR(200) TEXT

CHAR(2) VARCHAR(20)

Type UUID UUID

VARCHAR(200) TEXT VARCHAR(20) VARCHAR(200) BOOLEAN

Contraintes PK

FK vehicle_models

Contraintes PK

FK

Description

Manual, Brochure, Specs

Description

### Relations

		manufacturers 1→N vehicle_models

		vehicle_models 1→N vehicle_documents 	vehicle_models 1→N known_issues

		vehicle_models 1→N maintenance_templates (voir partie 6) 	vehicle_models 1→N user_vehicles (voir partie 5)

### Règles métier

1.   Un modèle est unique par constructeur, année et version.

2.   Les dimensions servent à filtrer les campings, routes et stationnements.

3.   La consommation officielle peut être ajustée par la consommation réelle de l'utilisateur. 4.   Les documents officiels sont versionnés.

5.   Les problèmes connus peuvent provenir du constructeur ou de la communauté et doivent être identifiés par leur source.

### Acquisition des données

		Import automatisé depuis les sites des constructeurs.

		Validation manuelle des données critiques.

		Historique des modifications des fiches techniques. 	Ajout annuel des nouveaux modèles.

	**Index** **recommandés** 	manufacturers(name)

		vehicle_models(manufacturer_id,year) 	vehicle_models(category)

		known_issues(model_id)

		vehicle_documents(model_id,language)

### Cas d'utilisation à documenter

		UC-CAT-001 : scénario détaillé réservé. 	UC-CAT-002 : scénario détaillé réservé. 	UC-CAT-003 : scénario détaillé réservé. 	UC-CAT-004 : scénario détaillé réservé. 	UC-CAT-005 : scénario détaillé réservé. 	UC-CAT-006 : scénario détaillé réservé. 	UC-CAT-007 : scénario détaillé réservé. 	UC-CAT-008 : scénario détaillé réservé. 	UC-CAT-009 : scénario détaillé réservé. 	UC-CAT-010 : scénario détaillé réservé. 	UC-CAT-011 : scénario détaillé réservé. 	UC-CAT-012 : scénario détaillé réservé. 	UC-CAT-013 : scénario détaillé réservé. 	UC-CAT-014 : scénario détaillé réservé. 	UC-CAT-015 : scénario détaillé réservé. 	UC-CAT-016 : scénario détaillé réservé. 	UC-CAT-017 : scénario détaillé réservé. 	UC-CAT-018 : scénario détaillé réservé. 	UC-CAT-019 : scénario détaillé réservé. 	UC-CAT-020 : scénario détaillé réservé.

## Document 4 - Partie 5 Véhicules des utilisateurs

Spécification détaillée des données propres aux véhicules enregistrés par les utilisateurs.

### 1. Objectifs

Définir les structures permettant de gérer les véhicules personnels, leur historique, leurs documents et leur utilisation.

**Table** **:** **user_vehicles** Champ

id user_id model_id nickname vin

license_plate purchase_date purchase_price current_odometer

real_avg_consumptio n tank_capacity_overri de

primary_vehicle created_at updated_at

Type UUID UUID UUID

VARCHAR(100) VARCHAR(17) VARCHAR(20) DATE NUMERIC(12,2) INTEGER NUMERIC(5,2)

NUMERIC(6,2)

BOOLEAN TIMESTAMPTZ TIMESTAMPTZ

Contraintes PK

FK users

FK vehicle_models

UNIQUE NULL

Description Identifiant. Propriétaire.

Modèle de référence. Nom personnalisé. Numéro VIN.

Plaque.

L/100 km.

Valeur personnalisée.

### Table : vehicle_documents

Champ id

vehicle_id type

title file_url

expiry_date created_at

Type UUID UUID

VARCHAR(50)

VARCHAR(150) TEXT

DATE TIMESTAMPTZ

Contraintes PK

FK user_vehicles

Description

Assurance, immatriculation, facture...

### Table : vehicle_photos

Champ                              Type id                                        UUID vehicle_id                         UUID photo_url                         TEXT

	
Contraintes	Description PK

FK

caption display_order

VARCHAR(200) INTEGER

### Table : vehicle_settings

Champ vehicle_id

preferred_fuel_type winter_mode avoid_unpaved_road s

toll_preference created_at updated_at

Type UUID

VARCHAR(30) BOOLEAN BOOLEAN

VARCHAR(20) TIMESTAMPTZ TIMESTAMPTZ

	
Contraintes	Description PK/FK

### Relations

		user_vehicles 1→N vehicle_documents 	user_vehicles 1→N vehicle_photos

		user_vehicles 1→1 vehicle_settings

		user_vehicles 1→N maintenance_history 	user_vehicles 1→N trips

		user_vehicles N→1 vehicle_models

### Règles métier

1.   Un utilisateur peut posséder plusieurs véhicules.

2.   Un seul véhicule peut être marqué comme véhicule principal. 3.   Le kilométrage ne peut jamais diminuer.

4.   La consommation réelle est recalculée automatiquement après chaque plein. 5.   Les documents expirés déclenchent une notification.

6.   Les photos sont conservées en stockage objet et référencées uniquement par URL.

### Calculs dérivés

		Autonomie estimée selon la consommation réelle. 	Coût annuel de carburant.

		Valeur estimée du véhicule (évolution future). 	Distance totale parcourue.

		Fréquence d'utilisation.

### Index recommandés

		user_vehicles(user_id) 	user_vehicles(vin)

		vehicle_documents(vehicle_id)

		vehicle_documents(expiry_date) 	vehicle_photos(vehicle_id)

### Cas d'utilisation à documenter

		UC-VEH-001 : scénario détaillé réservé. 	UC-VEH-002 : scénario détaillé réservé. 	UC-VEH-003 : scénario détaillé réservé. 	UC-VEH-004 : scénario détaillé réservé. 	UC-VEH-005 : scénario détaillé réservé. 	UC-VEH-006 : scénario détaillé réservé. 	UC-VEH-007 : scénario détaillé réservé. 	UC-VEH-008 : scénario détaillé réservé. 	UC-VEH-009 : scénario détaillé réservé. 	UC-VEH-010 : scénario détaillé réservé. 	UC-VEH-011 : scénario détaillé réservé. 	UC-VEH-012 : scénario détaillé réservé. 	UC-VEH-013 : scénario détaillé réservé. 	UC-VEH-014 : scénario détaillé réservé. 	UC-VEH-015 : scénario détaillé réservé. 	UC-VEH-016 : scénario détaillé réservé. 	UC-VEH-017 : scénario détaillé réservé. 	UC-VEH-018 : scénario détaillé réservé. 	UC-VEH-019 : scénario détaillé réservé. 	UC-VEH-020 : scénario détaillé réservé.

## Document 4 - Partie 6

### Entretien, historique, rappels et documents

Spécification détaillée du module de gestion de l'entretien des véhicules.

### 1. Objectifs

Permettre un suivi complet de l'entretien préventif et correctif des véhicules, générer des rappels intelligents et fournir à l'IA un historique fiable.

### Table : maintenance_templates

Champ id model_id title category

interval_km

interval_months

priority

description manufacturer_source

Type UUID UUID

VARCHAR(150) VARCHAR(50)

INTEGER

INTEGER

VARCHAR(20)

TEXT TEXT

Contraintes PK

FK vehicle_models NOT NULL

Description Identifiant. Modèle concerné.

Nom de l'entretien. Moteur, pneus, toiture... Fréquence kilométrique. Fréquence temporelle.

Faible, normale, élevée.

Description officielle. Référence constructeur.

### Table : maintenance_schedule

Champ id

vehicle_id template_id

next_due_date next_due_odometer status

last_calculated_at

Type UUID UUID UUID

DATE INTEGER VARCHAR(20)

TIMESTAMPTZ

Contraintes PK

FK user_vehicles FK

maintenance_templa tes

Description

À venir, en retard, complété.

### Table : maintenance_history

Champ                              Type id                                        UUID vehicle_id                         UUID template_id                     UUID performed_date             DATE

	
Contraintes	Description PK

FK FK

performed_odomete r

provider

cost currency notes

INTEGER

VARCHAR(200)

NUMERIC(10,2) CHAR(3)

TEXT

Garage ou propriétaire.

### Table : maintenance_documents

Champ id

history_id

document_type

file_url uploaded_at

Type UUID UUID

VARCHAR(50)

TEXT TIMESTAMPTZ

Contraintes PK

FK maintenance_history

Description

Facture, photo, garantie.

### Table : maintenance_notifications

Champ id

vehicle_id schedule_id notification_date type

sent

Type UUID UUID UUID

TIMESTAMPTZ VARCHAR(30) BOOLEAN

Contraintes PK

FK FK

Description

Email, Push.

### Relations

		vehicle_models 1→N maintenance_templates 	user_vehicles 1→N maintenance_schedule

		user_vehicles 1→N maintenance_history

		maintenance_history 1→N maintenance_documents

		maintenance_schedule 1→N maintenance_notifications

### Règles métier

1.   Les modèles d'entretien proviennent des recommandations constructeur. 2.   Les prochaines échéances sont recalculées après chaque entretien.

3.   Un entretien peut être déclenché par la date ou le kilométrage.

4.   Les rappels deviennent prioritaires lorsqu'une échéance est dépassée.

5.   Les documents sont conservés même après suppression logique de l'entretien. 6.   L'IA peut recommander un entretien anticipé avant un long voyage.

### Calculs automatiques

		Prochaine échéance par date.

		Prochaine échéance par kilométrage.

		Coût annuel d'entretien.

		Historique complet des dépenses.

		Indice de santé du véhicule (évolution future).

### Index recommandés

		maintenance_schedule(vehicle_id) 	maintenance_schedule(status)

		maintenance_history(vehicle_id,performed_date)

		maintenance_history(vehicle_id,performed_odometer) 	maintenance_notifications(sent,notification_date)

### Cas d'utilisation à documenter

		UC-MNT-001 : scénario détaillé réservé. 	UC-MNT-002 : scénario détaillé réservé. 	UC-MNT-003 : scénario détaillé réservé. 	UC-MNT-004 : scénario détaillé réservé. 	UC-MNT-005 : scénario détaillé réservé. 	UC-MNT-006 : scénario détaillé réservé. 	UC-MNT-007 : scénario détaillé réservé. 	UC-MNT-008 : scénario détaillé réservé. 	UC-MNT-009 : scénario détaillé réservé. 	UC-MNT-010 : scénario détaillé réservé. 	UC-MNT-011 : scénario détaillé réservé. 	UC-MNT-012 : scénario détaillé réservé. 	UC-MNT-013 : scénario détaillé réservé. 	UC-MNT-014 : scénario détaillé réservé. 	UC-MNT-015 : scénario détaillé réservé. 	UC-MNT-016 : scénario détaillé réservé. 	UC-MNT-017 : scénario détaillé réservé. 	UC-MNT-018 : scénario détaillé réservé. 	UC-MNT-019 : scénario détaillé réservé. 	UC-MNT-020 : scénario détaillé réservé.

## Document 4 - Partie 7

**Voyages,** **itinéraires,** **étapes** **et** **journal** **de** **bord** Spécification détaillée du module de gestion des voyages.

### 1. Objectifs

Structurer toutes les données relatives à la planification, à l'exécution et à l'archivage des voyages afin d'alimenter les recommandations IA et les analyses.

**Table** **:** **trips** Champ

id

user_id vehicle_id travel_group_id

title status

departure_date return_date origin destination planned_budget

**Table** **:** **trip_stops** Champ

id trip_id

sequence name latitude longitude arrival_time

departure_time stop_type

**Table** **:** **trip_routes** Champ

id trip_id provider

distance_km

Type UUID

UUID UUID UUID

VARCHAR(150) VARCHAR(20)

TIMESTAMPTZ TIMESTAMPTZ TEXT

TEXT NUMERIC(10,2)

Type UUID UUID INTEGER

VARCHAR(200) NUMERIC(10,7) NUMERIC(10,7) TIMESTAMPTZ TIMESTAMPTZ VARCHAR(50)

Type UUID UUID

VARCHAR(50) NUMERIC(10,2)

Contraintes PK

FK users

FK user_vehicles FK travel_groups

Contraintes PK

FK trips

Contraintes PK

FK

Description Identifiant du voyage. Propriétaire. Véhicule utilisé. Groupe de voyageurs.

Nom du voyage. Planifié, en cours, terminé.

Départ. Retour.

Point de départ. Destination finale. Budget prévu.

Description

Ordre.

Camping, activité, essence...

Description

Google Maps...

estimated_duration_ min estimated_fuel_cost polyline

INTEGER

NUMERIC(10,2)

	TEXT	Tracé compressé.

**Table** **:** **trip_logs** Champ

id trip_id

event_time event_type title description

**Table** **:** **trip_media** Champ

id trip_id

media_type file_url

caption

Type UUID UUID

TIMESTAMPTZ VARCHAR(50) VARCHAR(200) TEXT

Type UUID UUID

VARCHAR(20) TEXT

TEXT

Contraintes PK

FK

Contraintes PK

FK

Description

Départ, arrêt...

Description

Photo/Vidéo

### Relations

		users 1→N trips

		user_vehicles 1→N trips 	travel_groups 1→N trips 	trips 1→N trip_stops

		trips 1→1 trip_routes 	trips 1→N trip_logs

		trips 1→N trip_media 	trips 1→N expenses

### Règles métier

1.   Un voyage est toujours associé à un véhicule. 2.   Les étapes sont ordonnées par sequence.

3.   Le coût estimé du carburant est recalculé lors de toute modification d'itinéraire. 4.   Le journal de bord est alimenté automatiquement et manuellement.

5.   Les médias sont liés au voyage mais peuvent être géolocalisés.

6.   Un voyage terminé devient en lecture seule, sauf pour l'ajout de notes.

	**Calculs** **automatiques** 	Distance totale.

		Temps de conduite quotidien.

		Coût estimé et réel du carburant.

		Écart entre budget prévu et réel. 	Kilométrage parcouru.

		Statistiques de voyage.

**Index** **recommandés**     trips(user_id,status)

		trips(departure_date)

		trip_stops(trip_id,sequence) 	trip_logs(trip_id,event_time) 	trip_media(trip_id)

### Cas d'utilisation à documenter

		UC-TRIP-001 : scénario détaillé réservé. 	UC-TRIP-002 : scénario détaillé réservé. 	UC-TRIP-003 : scénario détaillé réservé. 	UC-TRIP-004 : scénario détaillé réservé. 	UC-TRIP-005 : scénario détaillé réservé. 	UC-TRIP-006 : scénario détaillé réservé. 	UC-TRIP-007 : scénario détaillé réservé. 	UC-TRIP-008 : scénario détaillé réservé. 	UC-TRIP-009 : scénario détaillé réservé. 	UC-TRIP-010 : scénario détaillé réservé. 	UC-TRIP-011 : scénario détaillé réservé. 	UC-TRIP-012 : scénario détaillé réservé. 	UC-TRIP-013 : scénario détaillé réservé. 	UC-TRIP-014 : scénario détaillé réservé. 	UC-TRIP-015 : scénario détaillé réservé. 	UC-TRIP-016 : scénario détaillé réservé. 	UC-TRIP-017 : scénario détaillé réservé. 	UC-TRIP-018 : scénario détaillé réservé. 	UC-TRIP-019 : scénario détaillé réservé. 	UC-TRIP-020 : scénario détaillé réservé.

## Document 4 - Partie 8

**Activités,** **campings,** **points** **d'intérêt,** **météo** **et** **carburant** Spécification détaillée des données utilisées pour enrichir les voyages et alimenter les recommandations intelligentes.

### 1. Objectifs

Centraliser les données externes et internes nécessaires aux recommandations de voyage, à l'optimisation des coûts et aux suggestions personnalisées.

**Table** **:** **activities** Champ

id name

category latitude longitude city country

family_score pet_friendly

estimated_duration_ min

website source

**Table** **:** **campgrounds** Champ

id name latitude

longitude max_length_m services pet_friendly rating

reservation_url

Type UUID

VARCHAR(200) VARCHAR(60) NUMERIC(10,7) NUMERIC(10,7) VARCHAR(120) CHAR(2) INTEGER BOOLEAN INTEGER

TEXT VARCHAR(80)

Type UUID

VARCHAR(200) NUMERIC(10,7) NUMERIC(10,7) NUMERIC(6,2) JSONB BOOLEAN NUMERIC(3,2) TEXT

Contraintes PK

Contraintes PK

Description Identifiant Nom

Parc, musée, plage...

0-100

Google, partenaire...

Description

### Table : points_of_interest

Champ id

type name latitude

Type UUID

VARCHAR(50) VARCHAR(200) NUMERIC(10,7)

	
Contraintes	Description PK

longitude description

NUMERIC(10,7) TEXT

**Table** **:** **fuel_prices** Champ

id country region city

station_name fuel_type price

captured_at

Type UUID CHAR(2)

VARCHAR(120) VARCHAR(120) VARCHAR(200) VARCHAR(30) NUMERIC(8,3) TIMESTAMPTZ

	Contraintes	Description PK

### Table : weather_cache

Champ id

location_key forecast_date provider raw_data expires_at

Type UUID

VARCHAR(200) DATE VARCHAR(50) JSONB TIMESTAMPTZ

	
Contraintes	Description PK

### Relations

		trip_stops peuvent référencer activities, campgrounds ou points_of_interest. 	fuel_prices est utilisé par trip_routes pour les estimations.

		weather_cache alimente les recommandations IA.

		Les activités peuvent être suggérées selon travel_preferences.

### Règles métier

1.   Les prix du carburant sont historisés et jamais écrasés. 2.   Les données météo sont mises en cache avec expiration.

3.   Les campings filtrent automatiquement les véhicules incompatibles selon leurs dimensions. 4.   Les activités sont classées par pertinence selon le profil du groupe.

5.   Les points d'intérêt peuvent être enrichis par l'IA mais la source doit être conservée.

### Calculs et recommandations

		Suggestion automatique des meilleurs arrêts carburant. 	Détection des activités adaptées aux enfants et animaux.

		Évaluation des détours rentables selon le prix de l'essence. 	Recommandations météo avant et pendant le voyage.

		Classement intelligent des points d'intérêt.

### Index recommandés

		activities(category,city)

		campgrounds(latitude,longitude)

		fuel_prices(country,region,city,fuel_type,captured_at) 	weather_cache(location_key,forecast_date)

		points_of_interest(type)

### Cas d'utilisation à documenter

		UC-EXT-001 : scénario détaillé réservé. 	UC-EXT-002 : scénario détaillé réservé. 	UC-EXT-003 : scénario détaillé réservé. 	UC-EXT-004 : scénario détaillé réservé. 	UC-EXT-005 : scénario détaillé réservé. 	UC-EXT-006 : scénario détaillé réservé. 	UC-EXT-007 : scénario détaillé réservé. 	UC-EXT-008 : scénario détaillé réservé. 	UC-EXT-009 : scénario détaillé réservé. 	UC-EXT-010 : scénario détaillé réservé. 	UC-EXT-011 : scénario détaillé réservé. 	UC-EXT-012 : scénario détaillé réservé. 	UC-EXT-013 : scénario détaillé réservé. 	UC-EXT-014 : scénario détaillé réservé. 	UC-EXT-015 : scénario détaillé réservé. 	UC-EXT-016 : scénario détaillé réservé. 	UC-EXT-017 : scénario détaillé réservé. 	UC-EXT-018 : scénario détaillé réservé. 	UC-EXT-019 : scénario détaillé réservé. 	UC-EXT-020 : scénario détaillé réservé.

## Document 4 - Partie 9

**Budget,** **dépenses** **et** **abonnements** Spécification détaillée des données financières du SaaS.

### 1. Objectifs

Assurer le suivi des budgets de voyage, des dépenses, des revenus liés aux abonnements et fournir des analyses financières à l'utilisateur.

**Table** **:** **trip_budgets** Champ

id trip_id

planned_amount currency created_at

**Table** **:** **expenses** Champ

id trip_id category

amount currency expense_date merchant notes

Type UUID UUID

NUMERIC(10,2) CHAR(3) TIMESTAMPTZ

Type UUID UUID

VARCHAR(50)

NUMERIC(10,2) CHAR(3)

DATE VARCHAR(200) TEXT

Contraintes PK

FK trips

Contraintes PK

FK trips

Description

Description

Carburant, camping, activité...

### Table : expense_receipts

Champ id

expense_id file_url ocr_json created_at

**Table** **:** **subscriptions** Champ

id user_id plan status provider

renewal_date

Type UUID UUID TEXT JSONB

TIMESTAMPTZ

Type UUID UUID

VARCHAR(50) VARCHAR(30) VARCHAR(30) DATE

Contraintes PK

FK expenses

Contraintes PK

FK users

Description

Résultat OCR

Description

Free, Premium...

Stripe

	cancelled_at	TIMESTAMPTZ

**Table** **:** **payments** Champ

id subscription_id

provider_payment_id amount

currency paid_at

status

Type UUID UUID

VARCHAR(200) NUMERIC(10,2) CHAR(3) TIMESTAMPTZ VARCHAR(30)

	Contraintes	Description PK

FK subscriptions

### Relations

		trips 1→1 trip_budgets 	trips 1→N expenses

		expenses 1→N expense_receipts 	users 1→N subscriptions

		subscriptions 1→N payments

### Règles métier

1.   Chaque dépense est associée à un voyage.

2.   Les montants sont conservés dans la devise d'origine. 3.   Le budget restant est recalculé après chaque dépense.

4.   Les reçus sont conservés indépendamment des dépenses. 5.   Les abonnements sont synchronisés avec Stripe.

### Calculs

		Coût total du voyage. 	Coût au kilomètre.

		Répartition par catégorie. 	Écart budget prévu/réel.

		Historique annuel des dépenses.

### Index recommandés

		expenses(trip_id,expense_date) 	expenses(category)

		subscriptions(user_id,status)

		payments(subscription_id,paid_at)

### Cas d'utilisation à documenter

		UC-BUD-001 : scénario détaillé réservé. 	UC-BUD-002 : scénario détaillé réservé. 	UC-BUD-003 : scénario détaillé réservé. 	UC-BUD-004 : scénario détaillé réservé.

		UC-BUD-005 : scénario détaillé réservé. 	UC-BUD-006 : scénario détaillé réservé. 	UC-BUD-007 : scénario détaillé réservé. 	UC-BUD-008 : scénario détaillé réservé. 	UC-BUD-009 : scénario détaillé réservé. 	UC-BUD-010 : scénario détaillé réservé. 	UC-BUD-011 : scénario détaillé réservé. 	UC-BUD-012 : scénario détaillé réservé. 	UC-BUD-013 : scénario détaillé réservé. 	UC-BUD-014 : scénario détaillé réservé. 	UC-BUD-015 : scénario détaillé réservé. 	UC-BUD-016 : scénario détaillé réservé. 	UC-BUD-017 : scénario détaillé réservé. 	UC-BUD-018 : scénario détaillé réservé. 	UC-BUD-019 : scénario détaillé réservé. 	UC-BUD-020 : scénario détaillé réservé.

## Document 4 - Partie 10

**Assistant** **IA,** **mémoire,** **conversations** **et** **recommandations** Spécification détaillée du modèle de données soutenant les fonctionnalités d'intelligence artificielle du SaaS.

### 1. Objectifs

Permettre à l'IA de conserver un contexte durable, personnaliser ses réponses, expliquer ses recommandations et apprendre des habitudes de voyage.

### Table : ai_conversations

Champ id

user_id trip_id vehicle_id

provider

model title created_at

updated_at

**Table** **:** **ai_messages** Champ

id conversation_id role

content prompt_tokens completion_tokens total_tokens created_at

**Table** **:** **ai_memory** Champ

id user_id

memory_type

memory_key memory_value

Type UUID

UUID UUID UUID

VARCHAR(30)

VARCHAR(100) VARCHAR(200) TIMESTAMPTZ TIMESTAMPTZ

Type UUID UUID

VARCHAR(20)

TEXT INTEGER INTEGER INTEGER

TIMESTAMPTZ

Type UUID UUID

VARCHAR(50)

VARCHAR(100) JSONB

Contraintes PK

FK users

FK trips NULL

FK user_vehicles NULL

Contraintes PK

FK ai_conversations

Contraintes PK

FK users

Description Identifiant de la conversation. Propriétaire. Voyage associé. Véhicule concerné.

OpenAI, Claude, Gemini, Ollama. Nom du modèle. Titre généré.

Description

system,user,assistant ,tool

Description

Préférence, habitude...

confidence last_used_at

	
NUMERIC(4,2)	0-1 TIMESTAMPTZ

### Table : ai_recommendations

Champ id user_id trip_id category title

description reasoning

accepted created_at

**Table** **:** **ai_feedback** Champ

id recommendation_id

rating comment created_at

Type UUID UUID UUID

VARCHAR(50) VARCHAR(200) TEXT

TEXT

BOOLEAN TIMESTAMPTZ

Type UUID UUID

INTEGER TEXT

TIMESTAMPTZ

Contraintes PK

FK users

FK trips NULL

Contraintes PK

FK ai_recommendations

Description

Carburant, activité...

Explication de la recommandation.

Description

1 à 5

### Relations

		users 1→N ai_conversations

		ai_conversations 1→N ai_messages 	users 1→N ai_memory

		users 1→N ai_recommendations

		ai_recommendations 1→N ai_feedback

		Les recommandations peuvent être liées à un voyage.

### Règles métier

1.   L'IA ne conserve que les informations utiles à long terme. 2.   Les calculs déterministes restent effectués par le backend.

3.   Chaque recommandation doit pouvoir expliquer son raisonnement.

4.   Les préférences apprises peuvent être oubliées ou réinitialisées par l'utilisateur. 5.   Les conversations sont historisées afin d'améliorer la continuité.

6.   Les coûts en jetons sont enregistrés pour le suivi des API.

	**Sources** **de** **contexte** 	Profil utilisateur

		Groupe de voyage

		Véhicule sélectionné

		Historique d'entretien 	Voyages précédents

		Météo

		Prix des carburants 	Budget

		Activités favorites

		Calendrier du voyage

### Index recommandés

		ai_conversations(user_id,updated_at)

		ai_messages(conversation_id,created_at) 	ai_memory(user_id,memory_key)

		ai_recommendations(user_id,created_at) 	ai_feedback(recommendation_id)

### Cas d'utilisation à documenter

		UC-IA-001 : scénario détaillé réservé. 	UC-IA-002 : scénario détaillé réservé. 	UC-IA-003 : scénario détaillé réservé. 	UC-IA-004 : scénario détaillé réservé. 	UC-IA-005 : scénario détaillé réservé. 	UC-IA-006 : scénario détaillé réservé. 	UC-IA-007 : scénario détaillé réservé. 	UC-IA-008 : scénario détaillé réservé. 	UC-IA-009 : scénario détaillé réservé. 	UC-IA-010 : scénario détaillé réservé. 	UC-IA-011 : scénario détaillé réservé. 	UC-IA-012 : scénario détaillé réservé. 	UC-IA-013 : scénario détaillé réservé. 	UC-IA-014 : scénario détaillé réservé. 	UC-IA-015 : scénario détaillé réservé. 	UC-IA-016 : scénario détaillé réservé. 	UC-IA-017 : scénario détaillé réservé. 	UC-IA-018 : scénario détaillé réservé. 	UC-IA-019 : scénario détaillé réservé. 	UC-IA-020 : scénario détaillé réservé.

## Document 4 - Partie 11

### Administration, sécurité, journalisation et statistiques

Spécification détaillée des données de gestion, d'administration, d'audit et de sécurité.

### 1. Objectifs

Assurer la traçabilité complète des opérations, la sécurité des données, la supervision du système et la production de statistiques.

**Table** **:** **audit_logs** Champ

id user_id entity entity_id action old_value

new_value ip_address

created_at

Type UUID UUID

VARCHAR(100) UUID VARCHAR(50) JSONB

JSONB VARCHAR(64) TIMESTAMPTZ

Contraintes PK

FK users NULL

Description Identifiant Utilisateur concerné Table ou module Identifiant de l'entité CREATE, UPDATE... Valeur précédente Nouvelle valeur Adresse IP Horodatage

### Table : security_events

Champ id user_id severity

event_type details resolved created_at

Type UUID UUID

VARCHAR(20)

VARCHAR(80) JSONB BOOLEAN TIMESTAMPTZ

Contraintes PK

FK users NULL

Description

Info, Warning, Critical

Connexion, blocage...

### Table : admin_settings

Champ setting_key setting_value description updated_at

**Table** **:** **system_jobs** Champ

id job_name status

started_at

Type VARCHAR(100) JSONB

TEXT TIMESTAMPTZ

Type UUID

VARCHAR(120) VARCHAR(30) TIMESTAMPTZ

Contraintes PK

Contraintes PK

Description

Description

finished_at duration_ms result

TIMESTAMPTZ INTEGER JSONB

**Table** **:** **statistics_daily** Champ

id stat_date new_users

active_users trips_created ai_requests fuel_savings

created_at

Type UUID DATE INTEGER INTEGER INTEGER INTEGER

NUMERIC(12,2) TIMESTAMPTZ

	Contraintes	Description PK

UNIQUE

### Relations

		Tous les modules alimentent audit_logs.

		security_events peut référencer un utilisateur. 	system_jobs est utilisé par les tâches planifiées.

		statistics_daily agrège les données des autres tables.

### Règles métier

1.   Toute modification d'une donnée critique est auditée.

2.   Les événements de sécurité ne peuvent jamais être supprimés. 3.   Les paramètres système sont versionnés.

4.   Les statistiques quotidiennes sont recalculables.

5.   Les tâches planifiées conservent leur historique d'exécution.

### Index recommandés

		audit_logs(created_at)

		audit_logs(entity,entity_id)

		security_events(event_type,created_at) 	system_jobs(status)

		statistics_daily(stat_date)

### Cas d'utilisation à documenter

		UC-ADM-001 : scénario détaillé réservé. 	UC-ADM-002 : scénario détaillé réservé. 	UC-ADM-003 : scénario détaillé réservé. 	UC-ADM-004 : scénario détaillé réservé. 	UC-ADM-005 : scénario détaillé réservé. 	UC-ADM-006 : scénario détaillé réservé. 	UC-ADM-007 : scénario détaillé réservé. 	UC-ADM-008 : scénario détaillé réservé.

		UC-ADM-009 : scénario détaillé réservé. 	UC-ADM-010 : scénario détaillé réservé. 	UC-ADM-011 : scénario détaillé réservé. 	UC-ADM-012 : scénario détaillé réservé. 	UC-ADM-013 : scénario détaillé réservé. 	UC-ADM-014 : scénario détaillé réservé. 	UC-ADM-015 : scénario détaillé réservé. 	UC-ADM-016 : scénario détaillé réservé. 	UC-ADM-017 : scénario détaillé réservé. 	UC-ADM-018 : scénario détaillé réservé. 	UC-ADM-019 : scénario détaillé réservé. 	UC-ADM-020 : scénario détaillé réservé.

## Document 4 - Partie 12

### Diagrammes relationnels, index, optimisations, migrations Prisma et annexes

### 1. Objectif

Définir les règles finales d'évolution de la base de données, les bonnes pratiques de migration, les stratégies d'optimisation et les standards de maintenance.

	**2.** **Relations** **principales** **du** **modèle** 	users → user_profiles (1:1)

		users → user_vehicles (1:N)

		manufacturers → vehicle_models (1:N)

		vehicle_models → maintenance_templates (1:N) 	user_vehicles → maintenance_history (1:N)

		user_vehicles → trips (1:N) 	travel_groups → trips (1:N) 	trips → trip_stops (1:N)

		trips → expenses (1:N)

		trips → ai_conversations (1:N) 	subscriptions → payments (1:N) 	users → audit_logs (1:N)

### 3. Index stratégiques

		UUID comme clé primaire sur toutes les tables. 	Index sur toutes les clés étrangères.

	Index composites sur les recherches fréquentes (user_id + status, trip_id + date, vehicle_id + odometer).

		Index géospatiaux (PostGIS futur) pour les activités, campings et stations-service. 	Index plein texte pour la recherche documentaire.

### 4. Optimisations

		Pagination obligatoire sur toutes les listes. 	Cache Redis pour les données externes.

		Archivage des journaux anciens.

		Partitionnement futur des tables volumineuses.

		Éviter les colonnes calculées persistantes lorsque le calcul peut être effectué côté serveur.

### 5. Normes Prisma

		Une migration par évolution fonctionnelle.

		Jamais de modification manuelle des migrations déjà déployées.

		Les modèles Prisma reflètent fidèlement PostgreSQL.

		Toutes les contraintes sont documentées avant création.

### 6. Politique de sauvegarde

		Sauvegarde quotidienne PostgreSQL. 	Conservation 30 jours.

		Sauvegarde hebdomadaire externalisée. 	Tests de restauration mensuels.

### 7. Politique de rétention

		Soft delete pour les données utilisateur. 	Audit conservé selon la politique interne.

		Anonymisation des données après suppression de compte lorsque requis.

### 8. Évolutions prévues

1.   Évolution BD #1: emplacement réservé pour les futures versions. 2.   Évolution BD #2: emplacement réservé pour les futures versions. 3.   Évolution BD #3: emplacement réservé pour les futures versions. 4.   Évolution BD #4: emplacement réservé pour les futures versions. 5.   Évolution BD #5: emplacement réservé pour les futures versions. 6.   Évolution BD #6: emplacement réservé pour les futures versions. 7.   Évolution BD #7: emplacement réservé pour les futures versions. 8.   Évolution BD #8: emplacement réservé pour les futures versions. 9.   Évolution BD #9: emplacement réservé pour les futures versions. 10. Évolution BD #10: emplacement réservé pour les futures versions. 11. Évolution BD #11: emplacement réservé pour les futures versions. 12. Évolution BD #12: emplacement réservé pour les futures versions. 13. Évolution BD #13: emplacement réservé pour les futures versions. 14. Évolution BD #14: emplacement réservé pour les futures versions. 15. Évolution BD #15: emplacement réservé pour les futures versions. 16. Évolution BD #16: emplacement réservé pour les futures versions. 17. Évolution BD #17: emplacement réservé pour les futures versions. 18. Évolution BD #18: emplacement réservé pour les futures versions. 19. Évolution BD #19: emplacement réservé pour les futures versions. 20. Évolution BD #20: emplacement réservé pour les futures versions. 21. Évolution BD #21: emplacement réservé pour les futures versions. 22. Évolution BD #22: emplacement réservé pour les futures versions. 23. Évolution BD #23: emplacement réservé pour les futures versions. 24. Évolution BD #24: emplacement réservé pour les futures versions. 25. Évolution BD #25: emplacement réservé pour les futures versions.

	**9.** **Checklist** **avant** **mise** **en** **production** 	Migration testée.

		Rollback disponible. 	Index validés.

    Performance mesurée.     Sauvegarde effectuée.

		Documentation mise à jour. 	Tests d'intégrité réussis.

		Validation Prisma réussie.
