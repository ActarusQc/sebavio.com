# Document 5 — Cas particuliers et gestion des erreurs

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

## Document 5 - UX Flow

## Partie 1 : Authentification et Onboarding

Spécification des parcours utilisateurs liés à l'inscription, la connexion et la configuration initiale.

### 1. Objectif

Créer une première expérience simple, rapide et personnalisée afin que l'utilisateur puisse commencer à planifier un voyage en moins de cinq minutes.

### 2. Parcours principal

1.   Étape 1 : Ouverture de l'application 2.   Étape 2 : Écran d'accueil

3.   Étape 3 : Connexion ou création d'un compte 4.   Étape 4 : Validation du courriel

5.   Étape 5 : Choix de la langue 6.   Étape 6 : Choix du pays

7.   Étape 7 : Choix de la devise

8.   Étape 8 : Acceptation des conditions 9.   Étape 9 : Configuration initiale

10. Étape 10 : Accès au tableau de bord

### 3. Écrans

		Écran d'accueil 	Connexion

		Inscription

		Mot de passe oublié 	Validation du courriel 	Choix de la langue

		Choix du pays

		Choix de la devise

		Présentation des fonctionnalités 	Configuration initiale terminée

**4.** **Flux** **détaillé** Écran

Accueil

Connexion Inscription Validation Configuration Fin

Actions

Boutons Connexion / Créer un compte / Continuer avec Google

Email + mot de passe + OAuth

Nom, courriel, mot de passe, validation Envoi du courriel et confirmation

Langue, pays, devise, préférences de base Redirection automatique vers le dashboard

### 5. Cas particuliers

		Courriel déjà utilisé

		Mot de passe invalide

		Lien de validation expiré

		Connexion Google refusée

		Perte de connexion Internet 	Serveur indisponible

### 6. Règles UX

11. Maximum de trois actions avant l'inscription. 12. Les champs sont validés en temps réel.

13. L'utilisateur peut interrompre l'onboarding et reprendre plus tard. 14. Les choix de langue et de devise sont modifiables après l'inscription. 15. Aucun écran ne doit contenir plus d'une action principale.

### 7. Critères d'acceptation

		CA-ONB-001 : critère d'acceptation réservé. 	CA-ONB-002 : critère d'acceptation réservé. 	CA-ONB-003 : critère d'acceptation réservé. 	CA-ONB-004 : critère d'acceptation réservé. 	CA-ONB-005 : critère d'acceptation réservé. 	CA-ONB-006 : critère d'acceptation réservé. 	CA-ONB-007 : critère d'acceptation réservé. 	CA-ONB-008 : critère d'acceptation réservé. 	CA-ONB-009 : critère d'acceptation réservé. 	CA-ONB-010 : critère d'acceptation réservé. 	CA-ONB-011 : critère d'acceptation réservé. 	CA-ONB-012 : critère d'acceptation réservé. 	CA-ONB-013 : critère d'acceptation réservé. 	CA-ONB-014 : critère d'acceptation réservé. 	CA-ONB-015 : critère d'acceptation réservé.

## Document 5 - Partie 2 Gestion du profil utilisateur

Spécification des parcours UX liés au profil, à la famille, aux animaux et aux préférences.

### 1. Objectif

Permettre à l'utilisateur de configurer un profil complet afin que l'application et l'IA puissent personnaliser toutes les recommandations.

### 2. Parcours utilisateur

1.   Étape 1 : Ouverture du profil

2.   Étape 2 : Modification des informations personnelles 3.   Étape 3 : Ajout des membres de la famille

4.   Étape 4 : Ajout des animaux

5.   Étape 5 : Configuration des préférences de voyage 6.   Étape 6 : Configuration des notifications

7.   Étape 7 : Enregistrement 8.   Étape 8 : Confirmation

### 3. Écrans

		Profil principal

		Informations personnelles 	Famille

		Animaux

		Préférences de voyage 	Notifications

		Confidentialité 	Résumé

**4.** **Flux** **détaillés** Écran

Profil Famille Animaux Préférences

Notifications Résumé

Actions principales

Modifier les informations personnelles Ajouter, modifier ou supprimer un membre Ajouter un animal et ses caractéristiques Budget, style de voyage, péages, ferries, unités

Choisir les alertes désirées

Sauvegarder et retourner au tableau de bord

### 5. Cas particuliers

		Suppression du dernier membre 	Animal sans photo

    Changement de devise     Changement de langue

		Aucune connexion Internet 	Échec de sauvegarde

### 6. Règles UX

9.   Les modifications sont sauvegardées automatiquement lorsque possible. 10. Chaque section est indépendante.

11. Les champs obligatoires sont clairement identifiés.

12. Les préférences influencent immédiatement les recommandations IA. 13. Un historique des modifications importantes est conservé.

### 7. Critères d'acceptation

		CA-PRO-001 : critère d'acceptation réservé. 	CA-PRO-002 : critère d'acceptation réservé. 	CA-PRO-003 : critère d'acceptation réservé. 	CA-PRO-004 : critère d'acceptation réservé. 	CA-PRO-005 : critère d'acceptation réservé. 	CA-PRO-006 : critère d'acceptation réservé. 	CA-PRO-007 : critère d'acceptation réservé. 	CA-PRO-008 : critère d'acceptation réservé. 	CA-PRO-009 : critère d'acceptation réservé. 	CA-PRO-010 : critère d'acceptation réservé. 	CA-PRO-011 : critère d'acceptation réservé. 	CA-PRO-012 : critère d'acceptation réservé. 	CA-PRO-013 : critère d'acceptation réservé. 	CA-PRO-014 : critère d'acceptation réservé. 	CA-PRO-015 : critère d'acceptation réservé.

## Document 5 - Partie 3 Gestion des véhicules

Spécification des parcours UX liés à l'ajout, la gestion et la configuration des véhicules.

### 1. Objectif

Permettre à l'utilisateur d'ajouter un ou plusieurs véhicules et de les configurer afin que toutes les fonctionnalités du SaaS soient personnalisées.

### 2. Parcours principal

1.   Étape 1 : Accéder à Mes véhicules

2.   Étape 2 : Clique sur Ajouter un véhicule 3.   Étape 3 : Choisir le type (Voiture ou VR) 4.   Étape 4 : Choisir le constructeur

5.   Étape 5 : Choisir le modèle

6.   Étape 6 : Choisir l'année et la version

7.   Étape 7 : Compléter les informations personnelles (VIN, plaque, surnom, kilométrage) 8.   Étape 8 : Téléverser des photos et documents

9.   Étape 9 : Configurer les préférences du véhicule 10. Étape 10 : Enregistrer

11. Étape 11 : Le véhicule devient disponible pour les voyages

### 3. Écrans

		Liste des véhicules 	Sélection du type

		Recherche constructeur 	Recherche modèle

		Informations du véhicule 	Photos et documents

		Préférences

		Résumé de validation

**4.** **Flux** **détaillés** Écran

Liste

Type Constructeur Modèle Informations

Documents

Actions principales

Ajouter, modifier, supprimer, définir comme principal

Voiture, VR Classe A/B/C, caravane, etc. Recherche et sélection

Recherche filtrée par année VIN, plaque, achat, kilométrage, consommation

Importer assurance, immatriculation,

Préférences Résumé

factures

Péages, routes non pavées, carburant préféré Validation finale et sauvegarde

### 5. Cas particuliers

    VIN déjà enregistré     Modèle introuvable     Import interrompu

		Photo trop volumineuse

		Suppression du véhicule principal 	Absence de connexion

### 6. Règles UX

12. Le constructeur et le modèle doivent être recherchables. 13. Les données connues sont préremplies automatiquement. 14. Le kilométrage est toujours demandé lors de la création. 15. Le véhicule principal est clairement identifié.

16. Le changement de véhicule actif doit être possible en un clic. 17. Les erreurs sont expliquées clairement.

### 7. Critères d'acceptation

		CA-VEH-001 : critère d'acceptation réservé. 	CA-VEH-002 : critère d'acceptation réservé. 	CA-VEH-003 : critère d'acceptation réservé. 	CA-VEH-004 : critère d'acceptation réservé. 	CA-VEH-005 : critère d'acceptation réservé. 	CA-VEH-006 : critère d'acceptation réservé. 	CA-VEH-007 : critère d'acceptation réservé. 	CA-VEH-008 : critère d'acceptation réservé. 	CA-VEH-009 : critère d'acceptation réservé. 	CA-VEH-010 : critère d'acceptation réservé. 	CA-VEH-011 : critère d'acceptation réservé. 	CA-VEH-012 : critère d'acceptation réservé. 	CA-VEH-013 : critère d'acceptation réservé. 	CA-VEH-014 : critère d'acceptation réservé. 	CA-VEH-015 : critère d'acceptation réservé.

## Document 5 - Partie 4 Tableau de bord

Spécification des parcours UX du tableau de bord principal.

### 1. Objectif

Le tableau de bord constitue le point d'entrée de l'application. Il doit présenter les informations essentielles et permettre d'accéder rapidement à toutes les fonctionnalités.

**2.** **Parcours** **principal** 1.   Étape 1 : Connexion

2.   Étape 2 : Chargement du tableau de bord 3.   Étape 3 : Affichage du véhicule actif

4.   Étape 4 : Affichage du prochain voyage 5.   Étape 5 : Consultation des notifications

6.   Étape 6 : Consultation des recommandations IA 7.   Étape 7 : Accès rapide aux modules

8.   Étape 8 : Création d'un nouveau voyage

### 3. Widgets

		Résumé du véhicule actif 	Prochain entretien

		Prochain voyage 	Prévisions météo 	Prix du carburant 	Budget du voyage 	Suggestions IA

		Activités recommandées 	Notifications

		Historique récent

**4.** **Flux** **détaillés** Widget

Véhicule Voyage IA

Entretien Budget Notifications Météo Carburant

Actions disponibles

Changer le véhicule actif, voir les détails Ouvrir, modifier ou créer un voyage Poser une question, voir les recommandations

Consulter ou ajouter un entretien Voir les dépenses

Marquer comme lues

Voir les prévisions détaillées Voir les meilleurs prix

	**5.** **Cas** **particuliers** 	Aucun véhicule

		Aucun voyage

		Première connexion 	Connexion hors ligne 	Aucune notification

		Erreur de chargement des API

### 6. Règles UX

9.   Le tableau de bord doit être entièrement personnalisable. 10. Les informations critiques apparaissent en premier.

11. Les recommandations IA sont visibles sans ouvrir le chat. 12. Chaque widget possède une action principale.

13. Le temps de chargement doit être minimal grâce au chargement progressif.

### 7. Critères d'acceptation

		CA-DASH-001 : critère d'acceptation réservé. 	CA-DASH-002 : critère d'acceptation réservé. 	CA-DASH-003 : critère d'acceptation réservé. 	CA-DASH-004 : critère d'acceptation réservé. 	CA-DASH-005 : critère d'acceptation réservé. 	CA-DASH-006 : critère d'acceptation réservé. 	CA-DASH-007 : critère d'acceptation réservé. 	CA-DASH-008 : critère d'acceptation réservé. 	CA-DASH-009 : critère d'acceptation réservé. 	CA-DASH-010 : critère d'acceptation réservé. 	CA-DASH-011 : critère d'acceptation réservé. 	CA-DASH-012 : critère d'acceptation réservé. 	CA-DASH-013 : critère d'acceptation réservé. 	CA-DASH-014 : critère d'acceptation réservé. 	CA-DASH-015 : critère d'acceptation réservé.

## Document 5 - Partie 5 Création d'un voyage

Spécification des parcours UX liés à la planification complète d'un voyage.

### 1. Objectif

Permettre à l'utilisateur de créer un voyage intelligent en quelques minutes tout en bénéficiant de recommandations automatiques.

### 2. Parcours principal

1.   Étape 1 : Cliquer sur Nouveau voyage 2.   Étape 2 : Choisir le véhicule

3.   Étape 3 : Choisir le groupe de voyageurs 4.   Étape 4 : Saisir le point de départ

5.   Étape 5 : Saisir la destination 6.   Étape 6 : Choisir les dates

7.   Étape 7 : Définir le budget

8.   Étape 8 : Ajouter des arrêts (optionnel) 9.   Étape 9 : Lancer l'analyse IA

10. Étape 10 : Recevoir les recommandations 11. Étape 11 : Valider et enregistrer le voyage

### 3. Écrans

		Choix du véhicule 	Participants

		Itinéraire 	Dates

		Budget

		Préférences

		Suggestions IA 	Résumé

		Confirmation

**4.** **Flux** **détaillés** Écran

Véhicule Participants Itinéraire Budget Préférences IA

Résumé

Actions principales Sélection du véhicule utilisé

Choisir famille, amis et animaux Départ, destination et étapes Définir le budget global

Routes, péages, ferries, style de voyage Optimiser le trajet et les coûts

Valider toutes les informations

	Confirmation	Création du voyage

### 5. Cas particuliers

		Aucun véhicule disponible 	Dates invalides

		Destination introuvable 	Budget insuffisant

		API cartographique indisponible 	Analyse IA impossible

### 6. Règles UX

12. Le véhicule est obligatoire.

13. Le groupe de voyageurs peut être modifié à tout moment. 14. Les recommandations IA sont explicables.

15. Les coûts estimés sont mis à jour en temps réel. 16. Le résumé affiche toutes les hypothèses utilisées.

### 7. Critères d'acceptation

		CA-TRIP-001 : critère d'acceptation réservé. 	CA-TRIP-002 : critère d'acceptation réservé. 	CA-TRIP-003 : critère d'acceptation réservé. 	CA-TRIP-004 : critère d'acceptation réservé. 	CA-TRIP-005 : critère d'acceptation réservé. 	CA-TRIP-006 : critère d'acceptation réservé. 	CA-TRIP-007 : critère d'acceptation réservé. 	CA-TRIP-008 : critère d'acceptation réservé. 	CA-TRIP-009 : critère d'acceptation réservé. 	CA-TRIP-010 : critère d'acceptation réservé. 	CA-TRIP-011 : critère d'acceptation réservé. 	CA-TRIP-012 : critère d'acceptation réservé. 	CA-TRIP-013 : critère d'acceptation réservé. 	CA-TRIP-014 : critère d'acceptation réservé. 	CA-TRIP-015 : critère d'acceptation réservé.

## Document 5 - Partie 6 Voyage en cours

Spécification des parcours UX pendant l'exécution d'un voyage.

### 1. Objectif

Accompagner le voyageur en temps réel en lui présentant uniquement les informations pertinentes selon sa position, son véhicule, la météo, son budget et ses préférences.

### 2. Parcours principal

1.   Étape 1 : Ouverture du voyage actif

2.   Étape 2 : Affichage de la carte interactive 3.   Étape 3 : Suivi GPS en temps réel

4.   Étape 4 : Affichage de la prochaine étape 5.   Étape 5 : Suggestions IA contextuelles

6.   Étape 6 : Détection des arrêts recommandés

7.   Étape 7 : Recherche des meilleurs prix d'essence 8.   Étape 8 : Consultation des activités à proximité 9.   Étape 9 : Ajout d'une dépense

10. Étape 10 : Ajout d'une photo ou d'une note 11. Étape 11 : Modification de l'itinéraire

12. Étape 12 : Fin du voyage

### 3. Écrans

		Carte du voyage 	Navigation

		Étape actuelle 	Suggestions IA 	Stations-service 	Campings

		Activités 	Budget

		Journal de bord 	Urgence

		Résumé quotidien

**4.** **Flux** **détaillés** Écran

Carte Navigation

IA

Actions principales

Voir le trajet, les étapes et les points d'intérêt Lancer Google Maps ou navigation intégrée Recevoir des recommandations en temps réel

Carburant Campings

Activités Budget Journal Urgence

Fin du voyage

Trouver où faire le plein au meilleur coût Voir les campings compatibles avec le véhicule

Afficher les activités adaptées au groupe Ajouter une dépense et consulter le budget Ajouter des notes, photos et événements Accéder aux numéros d'urgence, garages et hôpitaux

Clôturer le voyage et générer le résumé

### 5. Cas particuliers

		Perte du signal GPS

		Aucune connexion Internet

		Changement d'itinéraire imprévu 	Carburant insuffisant

		Météo dangereuse

		Fermeture d'une route

		Annulation d'un camping

		Batterie faible de l'appareil

### 6. Règles UX

13. Toutes les informations critiques doivent être accessibles en moins de deux interactions. 14. L'application doit continuer à fonctionner partiellement hors ligne.

15. Les recommandations IA doivent être discrètes et non intrusives.

16. Le conducteur ne doit jamais être distrait par une interaction complexe. 17. Les informations sont adaptées au contexte géographique et temporel.

18. Les modifications d'itinéraire doivent recalculer automatiquement les coûts estimés.

### 7. Critères d'acceptation

		CA-LIVE-001 : critère d'acceptation réservé. 	CA-LIVE-002 : critère d'acceptation réservé. 	CA-LIVE-003 : critère d'acceptation réservé. 	CA-LIVE-004 : critère d'acceptation réservé. 	CA-LIVE-005 : critère d'acceptation réservé. 	CA-LIVE-006 : critère d'acceptation réservé. 	CA-LIVE-007 : critère d'acceptation réservé. 	CA-LIVE-008 : critère d'acceptation réservé. 	CA-LIVE-009 : critère d'acceptation réservé. 	CA-LIVE-010 : critère d'acceptation réservé. 	CA-LIVE-011 : critère d'acceptation réservé. 	CA-LIVE-012 : critère d'acceptation réservé. 	CA-LIVE-013 : critère d'acceptation réservé. 	CA-LIVE-014 : critère d'acceptation réservé.

		CA-LIVE-015 : critère d'acceptation réservé.

## Document 5 - Partie 7 Entretien du véhicule

Spécification des parcours UX liés à la gestion de l'entretien préventif et correctif des véhicules.

### 1. Objectif

Permettre à l'utilisateur de suivre l'état de son véhicule, planifier les entretiens, recevoir des rappels intelligents et consulter l'historique complet.

### 2. Parcours principal

1.   Étape 1 : Accéder au module Entretien

2.   Étape 2 : Consulter le résumé de santé du véhicule 3.   Étape 3 : Voir les prochains entretiens

4.   Étape 4 : Ajouter un entretien manuel 5.   Étape 5 : Importer une facture

6.   Étape 6 : Mettre à jour le kilométrage

7.   Étape 7 : Consulter les recommandations IA 8.   Étape 8 : Recevoir les rappels

9.   Étape 9 : Marquer un entretien comme complété 10. Étape 10 : Consulter l'historique

### 3. Écrans

		Résumé de santé

		Calendrier des entretiens 	Historique

		Détail d'un entretien 	Ajout d'un entretien 	Import de documents 	Alertes

		Recommandations IA

		Statistiques d'entretien

**4.** **Flux** **détaillés** Écran

Résumé Calendrier Historique Ajout Documents Alertes

IA

Statistiques

Actions principales

Consulter les indicateurs de santé du véhicule Voir les échéances par date et kilométrage Filtrer et rechercher les interventions

Créer une intervention manuelle Téléverser facture, photo ou garantie Reporter ou confirmer un rappel

Obtenir des conseils avant un long voyage Consulter les coûts et tendances

### 5. Cas particuliers

		Kilométrage inférieur au précédent 	Facture illisible

		Document trop volumineux 	Entretien en retard

		Entretien inconnu du constructeur 	Aucune connexion Internet

### 6. Règles UX

11. Les entretiens critiques sont toujours visibles en priorité.

12. Le kilométrage est proposé automatiquement selon les derniers déplacements. 13. Les documents sont accessibles en moins de deux interactions.

14. L'utilisateur peut rechercher rapidement un entretien passé.

15. Les recommandations IA expliquent pourquoi un entretien est conseillé. 16. Les rappels peuvent être reportés avec justification.

### 7. Critères d'acceptation

		CA-MNT-001 : critère d'acceptation réservé. 	CA-MNT-002 : critère d'acceptation réservé. 	CA-MNT-003 : critère d'acceptation réservé. 	CA-MNT-004 : critère d'acceptation réservé. 	CA-MNT-005 : critère d'acceptation réservé. 	CA-MNT-006 : critère d'acceptation réservé. 	CA-MNT-007 : critère d'acceptation réservé. 	CA-MNT-008 : critère d'acceptation réservé. 	CA-MNT-009 : critère d'acceptation réservé. 	CA-MNT-010 : critère d'acceptation réservé. 	CA-MNT-011 : critère d'acceptation réservé. 	CA-MNT-012 : critère d'acceptation réservé. 	CA-MNT-013 : critère d'acceptation réservé. 	CA-MNT-014 : critère d'acceptation réservé. 	CA-MNT-015 : critère d'acceptation réservé.

## Document 5 - Partie 8 Assistant IA

Spécification des parcours UX liés à l'assistant intelligent, aux recommandations et à la mémoire utilisateur.

### 1. Objectif

Faire de l'assistant IA le copilote principal de l'utilisateur avant, pendant et après chaque voyage.

### 2. Parcours principal

1.   Étape 1 : Ouverture de l'assistant IA

2.   Étape 2 : Sélection automatique du contexte (voyage, véhicule, famille) 3.   Étape 3 : Question libre de l'utilisateur

4.   Étape 4 : Analyse du contexte

5.   Étape 5 : Génération de la réponse

6.   Étape 6 : Présentation des recommandations 7.   Étape 7 : Actions proposées

8.   Étape 8 : Mémorisation des préférences 9.   Étape 9 : Retour d'information utilisateur

### 3. Écrans

		Accueil IA

		Conversation

		Recommandations 	Historique

		Mémoire utilisateur 	Actions suggérées

		Explication des recommandations 	Paramètres IA

**4.** **Flux** **détaillés** Écran

Accueil Conversation Historique Recommandations Mémoire

Actions

Paramètres

Actions principales

Voir les recommandations du jour Discuter avec l'assistant

Reprendre une ancienne conversation Accepter, ignorer ou reporter Consulter et supprimer les préférences apprises

Créer un voyage, modifier un itinéraire, ajouter une dépense

Choisir le fournisseur IA et le niveau de

proactivité

	**5.** **Cas** **particuliers** 	IA indisponible

		Limite API atteinte

		Réponse incomplète

		Aucune connexion Internet

		Conflit entre plusieurs recommandations 	Contexte insuffisant

### 6. Règles UX

10. L'IA doit toujours expliquer ses recommandations.

11. L'utilisateur peut accepter ou ignorer chaque suggestion. 12. L'IA ne modifie jamais les données sans confirmation. 13. Le contexte est conservé automatiquement.

14. L'utilisateur peut effacer sa mémoire IA.

15. Les recommandations importantes sont priorisées.

### 7. Critères d'acceptation

		CA-IA-001 : critère d'acceptation réservé. 	CA-IA-002 : critère d'acceptation réservé. 	CA-IA-003 : critère d'acceptation réservé. 	CA-IA-004 : critère d'acceptation réservé. 	CA-IA-005 : critère d'acceptation réservé. 	CA-IA-006 : critère d'acceptation réservé. 	CA-IA-007 : critère d'acceptation réservé. 	CA-IA-008 : critère d'acceptation réservé. 	CA-IA-009 : critère d'acceptation réservé. 	CA-IA-010 : critère d'acceptation réservé. 	CA-IA-011 : critère d'acceptation réservé. 	CA-IA-012 : critère d'acceptation réservé. 	CA-IA-013 : critère d'acceptation réservé. 	CA-IA-014 : critère d'acceptation réservé. 	CA-IA-015 : critère d'acceptation réservé.

## Document 5 - Partie 9 Finances

Spécification des parcours UX liés au budget, aux dépenses, aux reçus, aux économies et aux abonnements.

### 1. Objectif

Permettre à l'utilisateur de suivre en temps réel les coûts de son voyage, de comparer les estimations aux dépenses réelles et de gérer son abonnement.

### 2. Parcours principal

1.   Étape 1 : Ouverture du module Finances 2.   Étape 2 : Consultation du budget global 3.   Étape 3 : Ajout d'une dépense

4.   Étape 4 : Numérisation d'un reçu

5.   Étape 5 : Classification automatique 6.   Étape 6 : Mise à jour des statistiques

7.   Étape 7 : Consultation des économies réalisées 8.   Étape 8 : Gestion de l'abonnement

9.   Étape 9 : Export du rapport financier

### 3. Écrans

		Tableau de bord financier 	Liste des dépenses

		Ajout d'une dépense 	Lecture OCR d'un reçu

		Répartition par catégorie 	Historique des voyages

		Abonnement

		Rapports et exportations

**4.** **Flux** **détaillés** Écran

Budget Dépenses Reçus Statistiques Économies Abonnement

Export

Actions principales

Consulter le budget prévu, réel et restant Ajouter, modifier ou supprimer une dépense Photographier ou importer un reçu Visualiser les graphiques et catégories Comparer le coût estimé et réel du voyage Changer de forfait, consulter les paiements Exporter en PDF, Excel ou CSV

	**5.** **Cas** **particuliers** 	Budget dépassé 	Devise différente

		OCR incapable de lire un reçu 	Paiement Stripe refusé

		Remboursement d'une dépense 	Mode hors ligne

### 6. Règles UX

10. Le budget restant est recalculé instantanément.

11. Les reçus sont analysés automatiquement lorsqu'ils sont lisibles. 12. Les dépenses peuvent être créées en moins de 30 secondes.

13. Les catégories sont suggérées par l'IA.

14. Les graphiques sont mis à jour en temps réel.

15. Le changement de forfait ne fait jamais perdre les données.

### 7. Critères d'acceptation

		CA-FIN-001 : critère d'acceptation réservé. 	CA-FIN-002 : critère d'acceptation réservé. 	CA-FIN-003 : critère d'acceptation réservé. 	CA-FIN-004 : critère d'acceptation réservé. 	CA-FIN-005 : critère d'acceptation réservé. 	CA-FIN-006 : critère d'acceptation réservé. 	CA-FIN-007 : critère d'acceptation réservé. 	CA-FIN-008 : critère d'acceptation réservé. 	CA-FIN-009 : critère d'acceptation réservé. 	CA-FIN-010 : critère d'acceptation réservé. 	CA-FIN-011 : critère d'acceptation réservé. 	CA-FIN-012 : critère d'acceptation réservé. 	CA-FIN-013 : critère d'acceptation réservé. 	CA-FIN-014 : critère d'acceptation réservé. 	CA-FIN-015 : critère d'acceptation réservé.

## Document 5 - Partie 10 Administration

Spécification des parcours UX destinés aux administrateurs de la plateforme.

### 1. Objectif

Permettre aux administrateurs de superviser les utilisateurs, les abonnements, le contenu, les intégrations, les statistiques et l'état général de la plateforme.

### 2. Parcours principal

1.   Étape 1 : Connexion administrateur

2.   Étape 2 : Ouverture du tableau de bord 3.   Étape 3 : Consultation des indicateurs 4.   Étape 4 : Recherche d'un utilisateur

5.   Étape 5 : Consultation des voyages 6.   Étape 6 : Gestion des abonnements 7.   Étape 7 : Consultation des journaux 8.   Étape 8 : Gestion du contenu

9.   Étape 9 : Configuration des paramètres 10. Étape 10 : Déconnexion

### 3. Écrans

		Dashboard administrateur 	Utilisateurs

		Abonnements 	Statistiques

		Journaux d'audit 	Signalements

		Gestion du contenu 	Paramètres système 	Intégrations API

		Surveillance des services

**4.** **Flux** **détaillés** Écran

Dashboard Utilisateurs Abonnements Statistiques Audit Contenu

API

Actions principales Visualiser les indicateurs clés

Créer, suspendre, réactiver, consulter Consulter les paiements et changer un forfait Analyser l'utilisation de la plateforme Rechercher les actions système

Gérer les catégories, activités et données Vérifier les clés et quotas

	Paramètres	Modifier les paramètres globaux

### 5. Cas particuliers

		Utilisateur suspendu 	Échec d'un paiement 	API indisponible

		Quota IA dépassé

		Erreur critique système 	Maintenance planifiée

### 6. Règles UX

11. Les actions critiques nécessitent une confirmation.

12. Toutes les modifications administratives sont journalisées. 13. Les alertes critiques sont affichées en priorité.

14. Les recherches sont disponibles sur toutes les listes.

15. Les actions destructives sont protégées contre les erreurs.

### 7. Critères d'acceptation

		CA-ADM-001 : critère d'acceptation réservé. 	CA-ADM-002 : critère d'acceptation réservé. 	CA-ADM-003 : critère d'acceptation réservé. 	CA-ADM-004 : critère d'acceptation réservé. 	CA-ADM-005 : critère d'acceptation réservé. 	CA-ADM-006 : critère d'acceptation réservé. 	CA-ADM-007 : critère d'acceptation réservé. 	CA-ADM-008 : critère d'acceptation réservé. 	CA-ADM-009 : critère d'acceptation réservé. 	CA-ADM-010 : critère d'acceptation réservé. 	CA-ADM-011 : critère d'acceptation réservé. 	CA-ADM-012 : critère d'acceptation réservé. 	CA-ADM-013 : critère d'acceptation réservé. 	CA-ADM-014 : critère d'acceptation réservé. 	CA-ADM-015 : critère d'acceptation réservé.

## Document 5 - Partie 11

### Cas particuliers et gestion des erreurs

Spécification des parcours UX pour les situations exceptionnelles, les erreurs et les modes dégradés.

### 1. Objectif

Garantir une expérience utilisateur cohérente même lorsqu'une erreur survient ou qu'un service externe est indisponible.

### 2. Parcours principaux

1.   Étape 1 : Détection automatique d'une anomalie 2.   Étape 2 : Identification de la cause

3.   Étape 3 : Affichage d'un message clair

4.   Étape 4 : Proposition d'une action corrective 5.   Étape 5 : Exécution de l'action

6.   Étape 6 : Validation de la récupération 7.   Étape 7 : Reprise normale du parcours

### 3. Scénarios couverts

		Absence de connexion Internet 	GPS désactivé

		Permission de localisation refusée 	API cartographique indisponible

		Service IA indisponible 	Quota API dépassé

    Erreur Stripe     Erreur SMTP

		Échec de sauvegarde

		Conflit de synchronisation 	Serveur en maintenance 	Session expirée

**4.** **Flux** **détaillés** Situation

Hors ligne GPS désactivé

IA indisponible Paiement refusé Erreur API

Session expirée

Comportement attendu Passage en mode dégradé Message explicatif Masquer les fonctions IA Conserver les données Afficher les dernières données en cache

Retour à la connexion

Action proposée

Réessayer automatiquement Ouvrir les paramètres Réessayer plus tard

Mettre à jour la carte Actualiser

Reconnecter l'utilisateur

### 5. Règles UX

8.   Ne jamais afficher un message technique brut. 9.   Toujours proposer une solution ou une action. 10. Conserver les données saisies lorsque possible.

11. Prioriser les fonctionnalités essentielles en mode dégradé.

12. Afficher un indicateur lorsque des données proviennent du cache. 13. Journaliser toutes les erreurs critiques.

### 6. Critères d'acceptation

		CA-ERR-001 : critère d'acceptation réservé. 	CA-ERR-002 : critère d'acceptation réservé. 	CA-ERR-003 : critère d'acceptation réservé. 	CA-ERR-004 : critère d'acceptation réservé. 	CA-ERR-005 : critère d'acceptation réservé. 	CA-ERR-006 : critère d'acceptation réservé. 	CA-ERR-007 : critère d'acceptation réservé. 	CA-ERR-008 : critère d'acceptation réservé. 	CA-ERR-009 : critère d'acceptation réservé. 	CA-ERR-010 : critère d'acceptation réservé. 	CA-ERR-011 : critère d'acceptation réservé. 	CA-ERR-012 : critère d'acceptation réservé. 	CA-ERR-013 : critère d'acceptation réservé. 	CA-ERR-014 : critère d'acceptation réservé. 	CA-ERR-015 : critère d'acceptation réservé.

## Document 5 - Partie 12

### Annexes, diagrammes UX et parcours complets

Spécification des éléments de référence utilisés pour documenter l'ensemble des parcours utilisateurs de la plateforme.

### 1. Objectif

Centraliser les diagrammes de navigation, les conventions UX, les parcours transversaux et les références servant à maintenir une expérience utilisateur cohérente.

### 2. Diagrammes à produire

		Carte complète de navigation de l'application 	Diagrammes de flux pour chaque module

		Arborescence des menus

		Diagrammes des parcours administrateurs 	Diagrammes des parcours IA

		Diagrammes des états d'un voyage 	Diagrammes des notifications

		Diagrammes des intégrations externes

**3.** **Parcours** **transversaux** Parcours

Première utilisation

Préparation d'un voyage Voyage actif

Retour de voyage Entretien Renouvellement

Déclencheur Nouvel utilisateur

Création d'un voyage Départ du voyage Fin du voyage Échéance atteinte

Expiration abonnement

Résultat attendu Application entièrement configurée

Itinéraire optimisé Assistance contextuelle Résumé et statistiques Entretien planifié Paiement confirmé

### 4. Standards UX

1.   Navigation uniforme dans tous les modules.

2.   Maximum de trois interactions pour atteindre une action fréquente. 3.   Actions principales toujours visibles.

4.   Terminologie identique dans toute l'application. 5.   Composants réutilisables.

6.   Accessibilité WCAG 2.2 AA.

7.   Support complet mobile, tablette et ordinateur.

	**5.** **États** **globaux** **de** **l'application** 	Chargement

		Succès

		Erreur

		Mode hors ligne 	Synchronisation 	Maintenance

		Aucune donnée 	Accès refusé

	**6.** **Checklist** **UX** **avant** **mise** **en** **production** 	Tous les parcours sont documentés.

    Aucun écran orphelin.     Navigation cohérente.

		Messages d'erreur validés. 	Tests mobiles réalisés.

		Tests d'accessibilité réussis. 	Performances UX validées. 	Documentation mise à jour.

### 7. Critères d'acceptation

		CA-UX-001 : critère d'acceptation réservé. 	CA-UX-002 : critère d'acceptation réservé. 	CA-UX-003 : critère d'acceptation réservé. 	CA-UX-004 : critère d'acceptation réservé. 	CA-UX-005 : critère d'acceptation réservé. 	CA-UX-006 : critère d'acceptation réservé. 	CA-UX-007 : critère d'acceptation réservé. 	CA-UX-008 : critère d'acceptation réservé. 	CA-UX-009 : critère d'acceptation réservé. 	CA-UX-010 : critère d'acceptation réservé. 	CA-UX-011 : critère d'acceptation réservé. 	CA-UX-012 : critère d'acceptation réservé. 	CA-UX-013 : critère d'acceptation réservé. 	CA-UX-014 : critère d'acceptation réservé. 	CA-UX-015 : critère d'acceptation réservé.
