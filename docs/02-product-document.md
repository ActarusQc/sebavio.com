# Document 2 — Product Document

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

02 — Product Requirements Document (PRD)

**PRODUCT REQUIREMENTS DOCUMENT**

**Compagnon de voyage intelligent**

*Voitures, véhicules récréatifs et voyages personnalisés*

| **Document** | 02 - Product Requirements Document (PRD) |
| --- | --- |
| **Version** | 1.0 |
| **Statut** | Document de référence initial |
| **Langue** | Français |
| **Date** | 13 juillet 2026 |

# Gestion du document

## But du PRD

Ce document transforme la vision produit en exigences fonctionnelles, règles métier et critères d'acceptation. Il sert de référence commune pour la conception UX, l'architecture, la base de données, les API, la planification des sprints et les prompts destinés à Cursor.

## Portée

Application Web responsive, puis applications mobiles et intégrations embarquées.

Utilisateurs grand public voyageant en voiture ou en véhicule récréatif.

Planification avant le départ, assistance pendant le déplacement et suivi après le voyage.

Personnalisation par véhicule, profil de voyage, famille, budget, météo, historique et préférences.

Architecture IA multi-fournisseurs avec séparation stricte entre données fiables, calculs déterministes et génération de langage naturel.

## Conventions

MVP : version minimale commercialisable.

V1 : produit initial complet et fiable.

V1.5 : enrichissements favorisant la rétention.

V2+ : fonctionnalités avancées, proactives et internationales.

Priorités : Must, Should, Could, Won't now.

## Sources de vérité

Le document Vision produit explique le pourquoi et la direction générale.

Le présent PRD décrit ce que le produit doit accomplir.

L'Architecture décrira comment il sera construit.

Le schéma de données décrira précisément les entités et relations.

La Roadmap découpera les exigences en étapes de livraison et prompts Cursor.

# Résumé exécutif

Le produit est un compagnon de voyage intelligent qui combine profil utilisateur, véhicules, itinéraires, prix du carburant, météo, activités, entretien, budget et intelligence artificielle.

Il ne cherche pas à remplacer Google Maps ou les autres services spécialisés. Il orchestre leurs données pour produire des recommandations personnalisées, explicables et immédiatement utiles.

Le produit doit donner une raison de revenir toute l'année, particulièrement aux propriétaires de véhicules récréatifs, grâce à l'entretien, au carnet du véhicule, aux alertes, aux dépenses, aux documents et à la préparation des voyages.

# Proposition de valeur

Pour les automobilistes : planifier un déplacement ou des vacances en tenant compte du coût réel, des préférences et des activités pertinentes.

Pour les propriétaires de VR : ajouter l'entretien, les dimensions, les capacités, les campings, les services spécialisés et l'historique du véhicule.

Pour les familles : recommander des arrêts et activités compatibles avec l'âge des enfants, la durée disponible, la météo, le budget et l'itinéraire.

# Principes de portée

Les calculs de distance, consommation, coût, autonomie et échéances d'entretien doivent être déterministes et auditables.

L'IA reformule, classe, personnalise et explique; elle ne crée pas de faits ni de prix inexistants.

Chaque recommandation doit afficher sa source ou son niveau de confiance lorsque l'information peut changer.

La confidentialité des données de localisation et des informations familiales est une exigence de base, non une option.

# Personas principaux

## P-01 Famille automobile

Deux adultes et un ou plusieurs enfants. Cherche des vacances simples, des pauses adaptées, un contrôle du budget et des activités pertinentes.

Objectif principal clairement mesurable.

Préférences modifiables et non figées.

Contrôle sur les données utilisées pour personnaliser l'expérience.

## P-02 Couple explorateur

Voyage régulièrement pour des escapades. Préfère les découvertes locales, la gastronomie, les paysages et les itinéraires flexibles.

Objectif principal clairement mesurable.

Préférences modifiables et non figées.

Contrôle sur les données utilisées pour personnaliser l'expérience.

## P-03 Propriétaire de VR occasionnel

Utilise son véhicule quelques semaines par année, mais doit l'entretenir, l'hiverniser, le préparer et suivre les coûts toute l'année.

Objectif principal clairement mesurable.

Préférences modifiables et non figées.

Contrôle sur les données utilisées pour personnaliser l'expérience.

## P-04 Voyageur VR fréquent

Effectue plusieurs déplacements annuels. A besoin de planification selon les dimensions, l'autonomie, les campings, l'eau, les vidanges et les coûts.

Objectif principal clairement mesurable.

Préférences modifiables et non figées.

Contrôle sur les données utilisées pour personnaliser l'expérience.

## P-05 Voyageur solo

Souhaite un copilote, des suggestions sécuritaires, des étapes raisonnables et un journal de voyage.

Objectif principal clairement mesurable.

Préférences modifiables et non figées.

Contrôle sur les données utilisées pour personnaliser l'expérience.

## P-06 Administrateur de plateforme

Gère les données de référence, les fournisseurs, la qualité, les signalements, les abonnements et la sécurité.

Objectif principal clairement mesurable.

Préférences modifiables et non figées.

Contrôle sur les données utilisées pour personnaliser l'expérience.

# Parcours utilisateurs de référence

## J-01 Première utilisation

Créer un compte

Choisir la langue, le pays et les unités

Ajouter un véhicule ou ignorer temporairement

Définir le style de voyage

Créer un premier trajet

Recevoir une estimation et des recommandations

Enregistrer ou démarrer le voyage

## J-02 Préparation d'un voyage en VR

Sélectionner le VR

Saisir le kilométrage et le niveau de carburant

Entrer départ, destination et dates

Ajouter contraintes de hauteur, longueur et autonomie

Consulter carburant, météo, campings et activités

Voir les entretiens recommandés avant départ

Finaliser le plan

## J-03 Voyage familial

Indiquer les voyageurs et âges

Choisir préférences et budget

Obtenir des pauses adaptées

Accepter, remplacer ou ignorer une activité

Recevoir une adaptation selon météo et horaire

## J-04 Après le voyage

Confirmer kilométrage et consommation réels

Ajouter dépenses et documents

Évaluer les recommandations

Générer un résumé ou carnet

Mettre à jour l'entretien et les préférences

# 1. Comptes, authentification et accès

## Objectif

Permettre une inscription sécurisée, une gestion autonome du compte et une expérience cohérente sur plusieurs appareils.

## Utilisateurs concernés

Voyageurs

Administrateurs

## Règles métier

Une adresse courriel ne peut être associée qu'à un compte actif.

Les sessions sensibles doivent pouvoir être révoquées.

Les comptes supprimés suivent une période de rétention configurable.

Les fonctions payantes sont contrôlées par droits et non uniquement par l'interface.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| AUTH-001 | Fonctionnelle | Inscription par courriel et mot de passe. | Must | MVP |
| AUTH-002 | Fonctionnelle | Connexion et déconnexion sécurisées. | Must | MVP |
| AUTH-003 | Fonctionnelle | Vérification du courriel. | Must | MVP |
| AUTH-004 | Fonctionnelle | Réinitialisation du mot de passe. | Must | MVP |
| AUTH-005 | Fonctionnelle | Connexion Google et Apple. | Should | V1 |
| AUTH-006 | Fonctionnelle | Gestion des sessions et appareils. | Should | V1 |
| AUTH-007 | Fonctionnelle | Suppression et export du compte. | Must | V1 |
| AUTH-008 | Fonctionnelle | Authentification multifacteur optionnelle. | Could | V1.5 |
| AUTH-009 | Fonctionnelle | Gestion des rôles administratifs. | Must | MVP |
| AUTH-010 | Fonctionnelle | Journal des événements de sécurité. | Must | V1 |

**Critères d'acceptation**

Un nouvel utilisateur peut créer et vérifier son compte.

Un mot de passe oublié peut être réinitialisé sans intervention du support.

Un utilisateur supprimé ne peut plus accéder à ses données.

Les privilèges administratifs sont vérifiés côté serveur.

## Dépendances et intégrations

Fournisseur d'authentification

Service de courriel transactionnel

## Risques et mesures de réduction

Prise de contrôle de compte : MFA, alertes et révocation de session.

## Évolutions prévues

Partage familial du compte.

Connexion par passkey.

# 2. Profil du voyageur et préférences

## Objectif

Construire un profil explicite et évolutif afin de personnaliser les itinéraires, activités, budgets et recommandations.

## Utilisateurs concernés

Tous les voyageurs

## Règles métier

Les préférences doivent être modifiables à tout moment.

Une préférence implicite apprise par l'IA ne remplace jamais une préférence explicitement déclarée.

Les données sensibles sont facultatives et assorties d'une explication d'usage.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| PROF-001 | Fonctionnelle | Prénom, langue, pays, devise et fuseau horaire. | Must | MVP |
| PROF-002 | Fonctionnelle | Unités métriques ou impériales. | Must | MVP |
| PROF-003 | Fonctionnelle | Style de voyage : rapide, économique, panoramique, flexible. | Must | MVP |
| PROF-004 | Fonctionnelle | Centres d'intérêt et activités évitées. | Must | V1 |
| PROF-005 | Fonctionnelle | Budget habituel et sensibilité au prix. | Should | V1 |
| PROF-006 | Fonctionnelle | Tolérance maximale de conduite quotidienne. | Should | V1 |
| PROF-007 | Fonctionnelle | Préférences alimentaires et d'accessibilité. | Should | V1 |
| PROF-008 | Fonctionnelle | Préférences de notifications. | Must | V1 |
| PROF-009 | Fonctionnelle | Historique des recommandations acceptées ou refusées. | Should | V1.5 |
| PROF-010 | Fonctionnelle | Profil de voyage exportable et réinitialisable. | Must | V1 |

**Critères d'acceptation**

Les préférences sont appliquées aux nouvelles recommandations.

L'utilisateur peut expliquer qu'une recommandation ne lui convient pas.

La réinitialisation des apprentissages n'efface pas le compte.

## Évolutions prévues

Profils de voyage multiples par utilisateur.

Import de préférences depuis partenaires.

# 3. Voyageurs, famille et animaux

## Objectif

Adapter les activités, pauses, hébergements et contraintes aux personnes et animaux participant à un voyage.

## Utilisateurs concernés

Familles

Couples

Voyageurs avec animaux

## Règles métier

Les membres ne nécessitent pas tous un compte.

L'âge peut être enregistré sous forme de tranche pour réduire la collecte.

Le voyage détermine quels membres participent.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| FAM-001 | Fonctionnelle | Ajouter des adultes, enfants et animaux au foyer. | Must | V1 |
| FAM-002 | Fonctionnelle | Enregistrer tranche d'âge et besoins pertinents. | Must | V1 |
| FAM-003 | Fonctionnelle | Associer les participants à un voyage. | Must | V1 |
| FAM-004 | Fonctionnelle | Filtrer les activités selon l'âge. | Must | V1 |
| FAM-005 | Fonctionnelle | Identifier les lieux acceptant les animaux. | Should | V1 |
| FAM-006 | Fonctionnelle | Définir les besoins d'accessibilité. | Should | V1 |
| FAM-007 | Fonctionnelle | Configurer la fréquence des pauses. | Should | V1 |
| FAM-008 | Fonctionnelle | Protéger les données des mineurs. | Must | V1 |
| FAM-009 | Fonctionnelle | Supprimer un membre sans perdre les voyages historiques. | Must | V1 |
| FAM-010 | Fonctionnelle | Ajouter un deuxième adulte collaborateur. | Could | V1.5 |

**Critères d'acceptation**

Une activité incompatible avec l'âge n'est pas recommandée comme choix principal.

Les informations des enfants ne sont jamais publiques.

Le profil du voyage peut fonctionner sans saisir de nom réel.

# 4. Garage virtuel et gestion des véhicules

## Objectif

Permettre d'enregistrer plusieurs voitures et véhicules récréatifs puis d'adapter l'ensemble du produit au véhicule sélectionné.

## Utilisateurs concernés

Automobilistes

Propriétaires de VR

## Règles métier

Chaque voyage doit référencer un véhicule ou un profil générique.

Les valeurs utilisateur priment sur les valeurs estimées de catalogue.

Les unités sont normalisées en base et converties à l'affichage.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| VEH-001 | Fonctionnelle | Ajouter, modifier, archiver et supprimer un véhicule. | Must | MVP |
| VEH-002 | Fonctionnelle | Choisir type : automobile ou véhicule récréatif. | Must | MVP |
| VEH-003 | Fonctionnelle | Sélectionner marque, modèle, année et version. | Must | MVP |
| VEH-004 | Fonctionnelle | Saisie manuelle si le modèle est absent. | Must | MVP |
| VEH-005 | Fonctionnelle | Kilométrage, carburant, autonomie et consommation. | Must | MVP |
| VEH-006 | Fonctionnelle | Dimensions, poids et capacités des VR. | Must | V1 |
| VEH-007 | Fonctionnelle | Plusieurs véhicules par compte. | Must | V1 |
| VEH-008 | Fonctionnelle | Photo et surnom du véhicule. | Should | V1 |
| VEH-009 | Fonctionnelle | VIN optionnel et chiffré. | Could | V1.5 |
| VEH-010 | Fonctionnelle | Consommation réelle apprise par trajet. | Should | V1.5 |
| VEH-011 | Fonctionnelle | Documents du véhicule. | Should | V1 |
| VEH-012 | Fonctionnelle | Historique des propriétaires et statut vendu. | Could | V2 |

**Critères d'acceptation**

Le véhicule sélectionné influence immédiatement les coûts et contraintes.

Un modèle absent peut être utilisé sans bloquer le voyage.

Les données de catalogue sont clairement distinguées des données saisies.

## Dépendances et intégrations

Catalogue de véhicules

Stockage de documents

## Risques et mesures de réduction

Spécifications inexactes : provenance, date et validation communautaire.

## Évolutions prévues

Décodage VIN

Import télématique avec consentement

# 5. Catalogue de véhicules et données techniques

## Objectif

Maintenir une base structurée de marques, modèles, versions, années et spécifications provenant de sources fiables.

## Utilisateurs concernés

Administrateurs

Moteurs de calcul

Utilisateurs

## Règles métier

Chaque donnée comporte source, date de collecte et niveau de confiance.

Aucune donnée générée par IA n'est publiée sans validation.

Une spécification peut varier selon version et marché.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| CAT-001 | Fonctionnelle | Référentiel des fabricants, modèles, années et versions. | Must | MVP |
| CAT-002 | Fonctionnelle | Spécifications automobiles minimales. | Must | MVP |
| CAT-003 | Fonctionnelle | Spécifications VR : dimensions, poids, réservoirs, énergie. | Must | V1 |
| CAT-004 | Fonctionnelle | Import automatisé depuis sources autorisées. | Should | V1 |
| CAT-005 | Fonctionnelle | File de validation administrative. | Must | V1 |
| CAT-006 | Fonctionnelle | Détection de doublons et conflits. | Must | V1 |
| CAT-007 | Fonctionnelle | Historique des modifications. | Must | V1 |
| CAT-008 | Fonctionnelle | Signalement d'erreur par utilisateur. | Should | V1 |
| CAT-009 | Fonctionnelle | Niveau de confiance par champ. | Should | V1.5 |
| CAT-010 | Fonctionnelle | Mise à jour annuelle des gammes. | Must | V1 |

**Critères d'acceptation**

Une donnée sans source ne peut pas être marquée vérifiée.

L'administrateur peut comparer ancienne et nouvelle valeur.

Une correction ne modifie pas rétroactivement un voyage historique sans recalcul explicite.

# 6. Entretien et carnet numérique

## Objectif

Transformer les recommandations constructeur et l'usage réel en calendrier d'entretien compréhensible et utile toute l'année.

## Utilisateurs concernés

Propriétaires de voitures

Propriétaires de VR

## Règles métier

Une tâche peut dépendre du temps, du kilométrage, des heures moteur ou d'une saison.

Les recommandations de sécurité doivent distinguer information générale et conseil professionnel.

Les tâches propres au châssis et à la cellule du VR sont séparées.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| MNT-001 | Fonctionnelle | Générer un calendrier selon véhicule et kilométrage. | Must | V1 |
| MNT-002 | Fonctionnelle | Saisir les entretiens réalisés. | Must | V1 |
| MNT-003 | Fonctionnelle | Joindre facture, photo et note. | Should | V1 |
| MNT-004 | Fonctionnelle | Rappels par date et kilométrage. | Must | V1 |
| MNT-005 | Fonctionnelle | Entretien saisonnier VR : hivernisation et remise en service. | Must | V1 |
| MNT-006 | Fonctionnelle | Recommandation avant un long voyage. | Should | V1.5 |
| MNT-007 | Fonctionnelle | Tâches personnalisées. | Must | V1 |
| MNT-008 | Fonctionnelle | Statut à faire, planifié, terminé, ignoré. | Must | V1 |
| MNT-009 | Fonctionnelle | Export du carnet pour revente. | Should | V1.5 |
| MNT-010 | Fonctionnelle | Alertes de rappels constructeur lorsque disponibles. | Could | V2 |
| MNT-011 | Fonctionnelle | Suivi des garanties. | Should | V1.5 |
| MNT-012 | Fonctionnelle | Historique immuable avec corrections tracées. | Must | V1 |

**Critères d'acceptation**

Les tâches dues sont clairement visibles.

Une intervention terminée recalcule la prochaine échéance.

L'utilisateur peut corriger une saisie sans perdre l'historique.

## Dépendances et intégrations

Documentation constructeur

Notifications

Stockage

## Risques et mesures de réduction

Responsabilité : afficher sources, limites et recommandations de consultation professionnelle.

## Évolutions prévues

Reconnaissance OCR des factures

Réseau de garages partenaires

# 7. Création et gestion des voyages

## Objectif

Permettre de créer, enregistrer, dupliquer et modifier un voyage complet avec étapes, dates, participants, véhicule et préférences.

## Utilisateurs concernés

Tous les voyageurs

## Règles métier

Un voyage peut être brouillon, planifié, en cours, terminé ou archivé.

Les changements d'itinéraire doivent conserver l'historique utile.

Un voyage peut contenir des étapes et des journées.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| TRIP-001 | Fonctionnelle | Départ, destination, dates et heures. | Must | MVP |
| TRIP-002 | Fonctionnelle | Sélection du véhicule et des participants. | Must | MVP |
| TRIP-003 | Fonctionnelle | Voyage aller simple, aller-retour ou multi-étapes. | Must | V1 |
| TRIP-004 | Fonctionnelle | Préférences propres au voyage. | Must | V1 |
| TRIP-005 | Fonctionnelle | Brouillon et sauvegarde automatique. | Must | MVP |
| TRIP-006 | Fonctionnelle | Dupliquer un voyage. | Should | V1 |
| TRIP-007 | Fonctionnelle | Partager une vue en lecture seule. | Should | V1.5 |
| TRIP-008 | Fonctionnelle | Collaborer à plusieurs. | Could | V2 |
| TRIP-009 | Fonctionnelle | Importer des réservations. | Could | V1.5 |
| TRIP-010 | Fonctionnelle | Archiver et restaurer. | Must | V1 |
| TRIP-011 | Fonctionnelle | Mode hors ligne pour le plan essentiel. | Should | V2 |

**Critères d'acceptation**

Un voyage brouillon survit à une fermeture de session.

Le changement de véhicule déclenche un recalcul explicite.

Les étapes restent ordonnées et modifiables.

# 8. Moteur d'itinéraire et contraintes routières

## Objectif

Calculer des routes adaptées au véhicule et au style de voyage, sans reproduire un moteur cartographique complet.

## Utilisateurs concernés

Automobilistes

Propriétaires de VR

## Règles métier

Le fournisseur cartographique reste la source de géométrie et trafic.

Les contraintes VR doivent pouvoir exclure routes incompatibles.

Toute déviation économique doit afficher temps et distance supplémentaires.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| ROUTE-001 | Fonctionnelle | Itinéraire rapide, économique et panoramique. | Must | MVP |
| ROUTE-002 | Fonctionnelle | Alternatives de route. | Must | MVP |
| ROUTE-003 | Fonctionnelle | Étapes et arrêts intermédiaires. | Must | V1 |
| ROUTE-004 | Fonctionnelle | Contraintes de hauteur, longueur, poids et propane. | Must | V1 |
| ROUTE-005 | Fonctionnelle | Éviter péages, traversiers ou autoroutes. | Should | V1 |
| ROUTE-006 | Fonctionnelle | Trafic et incidents lorsqu'autorisés. | Should | V1 |
| ROUTE-007 | Fonctionnelle | Temps de conduite quotidien maximal. | Should | V1 |
| ROUTE-008 | Fonctionnelle | Recalcul après changement de paramètres. | Must | MVP |
| ROUTE-009 | Fonctionnelle | Comparaison coût, temps, distance et fatigue. | Should | V1.5 |
| ROUTE-010 | Fonctionnelle | Score d'itinéraire explicable. | Could | V1.5 |

**Critères d'acceptation**

Une route incompatible avec une contrainte critique ne doit pas être proposée comme sûre.

Chaque alternative affiche les compromis.

Le fournisseur et l'heure du calcul sont conservés.

## Dépendances et intégrations

Couverture des données VR variable : avertissements et confirmation conducteur.

## Évolutions prévues

Google Maps Platform ou équivalent

Données de circulation

Contraintes routières spécialisées VR

# 9. Carburant, autonomie et optimisation des pleins

## Objectif

Estimer le coût de carburant et recommander des arrêts de ravitaillement économiquement pertinents selon l'autonomie réelle.

## Utilisateurs concernés

Automobilistes

Propriétaires de VR

## Règles métier

Le prix affiché comporte lieu, date et source.

Une économie ne doit pas recommander un détour dont le coût dépasse le gain.

Une réserve de sécurité configurable est conservée.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| FUEL-001 | Fonctionnelle | Calcul du volume requis et du coût estimé. | Must | MVP |
| FUEL-002 | Fonctionnelle | Prix moyen par région. | Must | MVP |
| FUEL-003 | Fonctionnelle | Prix par station lorsque disponible. | Should | V1 |
| FUEL-004 | Fonctionnelle | Niveau de carburant initial. | Must | V1 |
| FUEL-005 | Fonctionnelle | Capacité du réservoir et réserve. | Must | V1 |
| FUEL-006 | Fonctionnelle | Plan optimal des pleins. | Must | V1 |
| FUEL-007 | Fonctionnelle | Comparaison des détours et économies nettes. | Should | V1 |
| FUEL-008 | Fonctionnelle | Carburants multiples : essence, diesel et autres. | Must | V1 |
| FUEL-009 | Fonctionnelle | Consommation ajustée par historique. | Should | V1.5 |
| FUEL-010 | Fonctionnelle | Coût réel après voyage. | Should | V1 |
| FUEL-011 | Fonctionnelle | Alertes de prix périmé. | Must | V1 |

**Critères d'acceptation**

Le calcul peut être reproduit avec les mêmes entrées.

La date du prix est visible.

L'utilisateur peut remplacer le prix ou la consommation.

## Dépendances et intégrations

Fournisseur de prix de carburant

Moteur de route

## Risques et mesures de réduction

Données incomplètes : afficher fourchette et degré de fraîcheur.

## Évolutions prévues

Véhicules électriques et recharge

Prix prédictifs

# 10. Activités, lieux et guide local

## Objectif

Proposer ce qu'il est pertinent de faire à destination ou le long du trajet selon le contexte réel de l'utilisateur.

## Utilisateurs concernés

Familles

Couples

Voyageurs solo

Voyageurs avec animaux

## Règles métier

Une suggestion doit respecter la durée disponible et les heures d'ouverture connues.

Les activités commanditées doivent être identifiées.

Les résultats doivent éviter la répétition et favoriser la diversité.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| POI-001 | Fonctionnelle | Rechercher quoi faire dans une ville ou région. | Must | V1 |
| POI-002 | Fonctionnelle | Suggestions le long du trajet. | Must | V1 |
| POI-003 | Fonctionnelle | Filtres par âge, budget, météo, durée et intérêt. | Must | V1 |
| POI-004 | Fonctionnelle | Lieux gratuits ou peu coûteux. | Should | V1 |
| POI-005 | Fonctionnelle | Temps de détour et stationnement estimés. | Should | V1 |
| POI-006 | Fonctionnelle | Heures d'ouverture et statut actuel. | Must | V1 |
| POI-007 | Fonctionnelle | Option "Surprends-moi". | Should | V1.5 |
| POI-008 | Fonctionnelle | Remplacer une suggestion par une alternative. | Must | V1 |
| POI-009 | Fonctionnelle | Explication personnalisée de la recommandation. | Must | V1 |
| POI-010 | Fonctionnelle | Évaluations et signaux de popularité. | Should | V1 |
| POI-011 | Fonctionnelle | Favoris et listes. | Should | V1 |

**Critères d'acceptation**

Une activité fermée ne doit pas être recommandée comme disponible.

Chaque suggestion indique pourquoi elle correspond au profil.

L'utilisateur peut masquer définitivement un type d'activité.

## Dépendances et intégrations

Google Places ou équivalent

Météo

Profil familial

## Risques et mesures de réduction

Informations périmées : date de vérification et lien source.

## Évolutions prévues

Billetterie et réservation

Partenariats locaux

# 11. Campings et services pour véhicules récréatifs

## Objectif

Ajouter aux voyages en VR les campings, stationnements autorisés, vidanges, eau, propane, recharge et services adaptés.

## Utilisateurs concernés

Propriétaires de VR

## Règles métier

Les dimensions du véhicule doivent être prises en compte.

Le statut légal d'un stationnement doit être distingué d'un simple signalement communautaire.

Les disponibilités ne sont garanties que par une intégration de réservation.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| RV-001 | Fonctionnelle | Rechercher campings compatibles avec le véhicule. | Must | V1 |
| RV-002 | Fonctionnelle | Filtres : longueur, branchements, services, animaux, prix. | Must | V1 |
| RV-003 | Fonctionnelle | Stations de vidange et points d'eau. | Must | V1 |
| RV-004 | Fonctionnelle | Propane, ateliers et concessionnaires. | Should | V1 |
| RV-005 | Fonctionnelle | Stationnements de nuit autorisés. | Should | V1 |
| RV-006 | Fonctionnelle | État des routes d'accès lorsque disponible. | Could | V1.5 |
| RV-007 | Fonctionnelle | Ajouter un lieu communautaire. | Could | V1.5 |
| RV-008 | Fonctionnelle | Signalement et modération. | Must | V1.5 |
| RV-009 | Fonctionnelle | Favoris et notes privées. | Should | V1 |
| RV-010 | Fonctionnelle | Réservations externes ou intégrées. | Could | V2 |

**Critères d'acceptation**

Le filtre de longueur exclut les emplacements incompatibles lorsque la donnée est certaine.

Les lieux communautaires sont clairement identifiés.

Un signalement critique peut masquer temporairement une fiche.

# 12. Météo et adaptation proactive

## Objectif

Intégrer les conditions et prévisions afin d'ajuster les activités, horaires, sécurité et préparation du voyage.

## Utilisateurs concernés

Tous les voyageurs

## Règles métier

La météo est toujours horodatée et géolocalisée.

Les alertes officielles ont priorité sur les recommandations de loisir.

L'IA ne reformule pas une alerte d'une manière qui réduit sa gravité.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| WX-001 | Fonctionnelle | Prévisions par étape et journée. | Must | V1 |
| WX-002 | Fonctionnelle | Alertes météo officielles. | Must | V1 |
| WX-003 | Fonctionnelle | Adapter les activités proposées. | Must | V1 |
| WX-004 | Fonctionnelle | Conseils de préparation avant départ. | Should | V1 |
| WX-005 | Fonctionnelle | Comparer scénarios de dates. | Could | V1.5 |
| WX-006 | Fonctionnelle | Météo routière et vents pour VR. | Should | V1.5 |
| WX-007 | Fonctionnelle | Notification de changement significatif. | Should | V1 |
| WX-008 | Fonctionnelle | Historique météo du voyage. | Could | V2 |

**Critères d'acceptation**

Une alerte officielle apparaît clairement avant les suggestions normales.

Une activité extérieure peut être remplacée par une option intérieure.

La source météo est visible.

# 13. Budget, dépenses et estimation du coût total

## Objectif

Donner une vision anticipée et réelle des coûts de voyage sans devenir une application bancaire.

## Utilisateurs concernés

Tous les voyageurs

## Règles métier

Les estimations et dépenses réelles sont séparées.

Les conversions de devise conservent le taux utilisé.

Les catégories sont personnalisables.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| BUD-001 | Fonctionnelle | Budget global et par catégorie. | Must | V1 |
| BUD-002 | Fonctionnelle | Estimation carburant, hébergement, activités, repas et péages. | Must | V1 |
| BUD-003 | Fonctionnelle | Ajout manuel de dépenses. | Must | V1 |
| BUD-004 | Fonctionnelle | Comparaison prévu/réel. | Must | V1 |
| BUD-005 | Fonctionnelle | Alertes de dépassement. | Should | V1 |
| BUD-006 | Fonctionnelle | Multi-devise. | Should | V1 |
| BUD-007 | Fonctionnelle | Photo de reçu. | Could | V1.5 |
| BUD-008 | Fonctionnelle | Répartition entre voyageurs. | Could | V1.5 |
| BUD-009 | Fonctionnelle | Export CSV/PDF. | Should | V1.5 |
| BUD-010 | Fonctionnelle | Résumé après voyage. | Must | V1 |

**Critères d'acceptation**

Le total est cohérent avec les catégories.

Une dépense peut être corrigée.

Le taux de change et sa date sont traçables.

# 14. Assistant IA et orchestration multi-modèles

## Objectif

Fournir une conversation contextuelle et des recommandations proactives tout en contrôlant coût, fiabilité et confidentialité.

## Utilisateurs concernés

Tous les voyageurs

Administrateurs

## Règles métier

L'application passe par une couche interne de fournisseur IA.

Les données personnelles envoyées sont minimisées.

Les calculs et faits externes proviennent d'outils, pas de la mémoire du modèle.

Toute recommandation importante doit être explicable.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| AI-001 | Fonctionnelle | Chat contextuel par voyage et véhicule. | Must | V1 |
| AI-002 | Fonctionnelle | Appels d'outils pour cartes, météo, carburant et lieux. | Must | V1 |
| AI-003 | Fonctionnelle | Mémoire contrôlée des préférences. | Must | V1 |
| AI-004 | Fonctionnelle | Réponses avec sources et fraîcheur. | Must | V1 |
| AI-005 | Fonctionnelle | Routage OpenAI, Claude ou Gemini. | Should | V1 |
| AI-006 | Fonctionnelle | Budgets et quotas par abonnement. | Must | V1 |
| AI-007 | Fonctionnelle | Historique et suppression des conversations. | Must | V1 |
| AI-008 | Fonctionnelle | Suggestions proactives configurables. | Should | V1.5 |
| AI-009 | Fonctionnelle | Détection des demandes à risque. | Must | V1 |
| AI-010 | Fonctionnelle | Évaluation de qualité et taux d'erreur. | Must | V1 |
| AI-011 | Fonctionnelle | Mode dégradé sans IA. | Must | V1 |
| AI-012 | Fonctionnelle | Cache des réponses non personnelles. | Should | V1 |

**Critères d'acceptation**

Une panne d'IA ne bloque pas l'accès aux voyages.

Une réponse factuelle affiche sa source ou indique l'incertitude.

Les données privées peuvent être supprimées.

## Dépendances et intégrations

OpenAI

Anthropic

Google

Services internes

## Risques et mesures de réduction

Hallucinations : outils structurés, validation, sources et refus d'inventer.

## Évolutions prévues

Assistant vocal

Modèles spécialisés locaux

# 15. Copilote en déplacement et commandes vocales

## Objectif

Permettre des interactions simples, sûres et mains libres pendant le trajet, sans encourager la distraction.

## Utilisateurs concernés

Conducteurs

Passagers

## Règles métier

Le conducteur ne doit pas lire ou manipuler une interface complexe en mouvement.

Les actions critiques nécessitent une confirmation vocale ou par passager.

Les fonctions dépendent des lois et plateformes locales.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| COP-001 | Fonctionnelle | Mode vocal simplifié. | Should | V1.5 |
| COP-002 | Fonctionnelle | Chercher carburant, repas ou pause sur la route. | Should | V1.5 |
| COP-003 | Fonctionnelle | Lire les changements importants. | Should | V1.5 |
| COP-004 | Fonctionnelle | Ajouter un arrêt par voix. | Could | V2 |
| COP-005 | Fonctionnelle | Détecter que le véhicule est en mouvement. | Must | V1.5 |
| COP-006 | Fonctionnelle | Interface passager complète. | Should | V1.5 |
| COP-007 | Fonctionnelle | Intégration CarPlay et Android Auto. | Could | V2 |
| COP-008 | Fonctionnelle | Limitation des interactions dangereuses. | Must | V1.5 |

**Critères d'acceptation**

Le mode conduite masque les actions complexes.

Une requête vocale peut être annulée.

Le système rappelle que le conducteur demeure responsable.

# 16. Notifications et agent proactif

## Objectif

Prévenir l'utilisateur au bon moment, avec un contrôle fin, sans créer de bruit ni de dépendance artificielle.

## Utilisateurs concernés

Tous les voyageurs

## Règles métier

Chaque catégorie peut être activée ou désactivée.

Les notifications urgentes et promotionnelles sont séparées.

La fréquence est limitée.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| NOTIF-001 | Fonctionnelle | Courriel, push et notifications internes. | Must | V1 |
| NOTIF-002 | Fonctionnelle | Rappels d'entretien. | Must | V1 |
| NOTIF-003 | Fonctionnelle | Alertes météo et itinéraire. | Must | V1 |
| NOTIF-004 | Fonctionnelle | Alerte de prix ou plein recommandé. | Should | V1.5 |
| NOTIF-005 | Fonctionnelle | Préparation avant départ. | Should | V1 |
| NOTIF-006 | Fonctionnelle | Résumé après voyage. | Should | V1 |
| NOTIF-007 | Fonctionnelle | Préférences par catégorie et canal. | Must | V1 |
| NOTIF-008 | Fonctionnelle | Heures silencieuses. | Must | V1 |
| NOTIF-009 | Fonctionnelle | Historique des notifications. | Should | V1 |
| NOTIF-010 | Fonctionnelle | Déduplication et limitation de fréquence. | Must | V1 |

**Critères d'acceptation**

Une notification désactivée n'est pas envoyée.

Les urgences sont clairement distinguées.

Un utilisateur peut ouvrir la notification sur le bon contexte.

# 17. Journal, souvenirs et bilan de voyage

## Objectif

Transformer les données du déplacement en historique utile et éventuellement partageable.

## Utilisateurs concernés

Tous les voyageurs

## Règles métier

La collecte automatique de localisation est opt-in.

Les photos restent privées par défaut.

Le partage public n'expose pas les adresses sensibles.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| JRN-001 | Fonctionnelle | Résumé automatique du voyage. | Should | V1.5 |
| JRN-002 | Fonctionnelle | Lieux visités et étapes. | Must | V1 |
| JRN-003 | Fonctionnelle | Photos et notes. | Should | V1.5 |
| JRN-004 | Fonctionnelle | Dépenses et statistiques. | Must | V1 |
| JRN-005 | Fonctionnelle | Consommation réelle. | Must | V1 |
| JRN-006 | Fonctionnelle | Album ou carnet exportable. | Could | V2 |
| JRN-007 | Fonctionnelle | Lien partageable privé. | Could | V2 |
| JRN-008 | Fonctionnelle | Contrôle de la précision de localisation. | Must | V1.5 |

**Critères d'acceptation**

Un utilisateur peut supprimer une photo ou un lieu.

Les données privées sont exclues du partage par défaut.

Le bilan distingue estimations et réalité.

# 18. Aide, urgence et services à proximité

## Objectif

Présenter rapidement des ressources pertinentes lors d'une panne ou d'un besoin urgent, sans remplacer les services d'urgence.

## Utilisateurs concernés

Tous les voyageurs

## Règles métier

Les numéros d'urgence officiels sont déterminés par pays.

L'application ne diagnostique pas mécaniquement un danger grave.

La position n'est partagée qu'avec consentement.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| HELP-001 | Fonctionnelle | Bouton d'aide contextuelle. | Must | V1 |
| HELP-002 | Fonctionnelle | Garages et remorquage à proximité. | Must | V1 |
| HELP-003 | Fonctionnelle | Concessionnaires compatibles avec la marque. | Should | V1 |
| HELP-004 | Fonctionnelle | Hôpitaux, cliniques et services officiels. | Must | V1 |
| HELP-005 | Fonctionnelle | Partager sa position avec un contact. | Could | V1.5 |
| HELP-006 | Fonctionnelle | Documents d'assurance accessibles hors ligne. | Should | V1.5 |
| HELP-007 | Fonctionnelle | Checklist de panne sécuritaire. | Should | V1 |
| HELP-008 | Fonctionnelle | Avertissement clair des limites. | Must | V1 |

**Critères d'acceptation**

Les services officiels sont prioritaires en urgence.

La position n'est pas partagée automatiquement.

Les coordonnées affichent date et source.

# 19. Paiements, abonnements et droits

## Objectif

Monétiser par abonnement tout en maintenant une offre claire, des limites transparentes et une gestion autonome.

## Utilisateurs concernés

Abonnés

Administrateurs

## Règles métier

Les droits sont centralisés.

Un changement de forfait ne supprime pas immédiatement les données.

Les taxes et devises suivent les règles applicables.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| BILL-001 | Fonctionnelle | Forfait gratuit ou essai. | Must | V1 |
| BILL-002 | Fonctionnelle | Abonnement mensuel et annuel. | Must | V1 |
| BILL-003 | Fonctionnelle | Paiement par fournisseur externe. | Must | V1 |
| BILL-004 | Fonctionnelle | Portail client de facturation. | Must | V1 |
| BILL-005 | Fonctionnelle | Quotas IA et fonctionnalités par forfait. | Must | V1 |
| BILL-006 | Fonctionnelle | Période de grâce et reprise de paiement. | Must | V1 |
| BILL-007 | Fonctionnelle | Codes promotionnels. | Could | V1.5 |
| BILL-008 | Fonctionnelle | Plan familial. | Could | V1.5 |
| BILL-009 | Fonctionnelle | Factures et taxes. | Must | V1 |
| BILL-010 | Fonctionnelle | Annulation autonome. | Must | V1 |

**Critères d'acceptation**

Un paiement réussi active les droits sans délai indu.

Une annulation empêche le renouvellement mais respecte la période payée.

Les webhooks sont idempotents.

# 20. Administration, qualité des données et modération

## Objectif

Donner aux administrateurs les outils nécessaires pour maintenir la fiabilité et gérer le produit sans accès direct à la base.

## Utilisateurs concernés

Administrateurs

Support

Modérateurs

## Règles métier

Chaque action sensible est auditée.

Les rôles suivent le moindre privilège.

Les données utilisateurs ne sont consultées que pour un motif autorisé.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| ADM-001 | Fonctionnelle | Tableau de bord opérationnel. | Must | V1 |
| ADM-002 | Fonctionnelle | Gestion des utilisateurs et abonnements. | Must | V1 |
| ADM-003 | Fonctionnelle | Gestion du catalogue véhicule. | Must | V1 |
| ADM-004 | Fonctionnelle | Validation des imports. | Must | V1 |
| ADM-005 | Fonctionnelle | Modération des lieux communautaires. | Must | V1.5 |
| ADM-006 | Fonctionnelle | Gestion des fournisseurs et clés. | Must | V1 |
| ADM-007 | Fonctionnelle | Journal d'audit. | Must | V1 |
| ADM-008 | Fonctionnelle | Gestion des incidents et messages système. | Should | V1 |
| ADM-009 | Fonctionnelle | Statistiques de qualité des données. | Should | V1 |
| ADM-010 | Fonctionnelle | Outils de support avec impersonation contrôlée. | Could | V1.5 |

**Critères d'acceptation**

Une action administrative sensible est traçable.

Un rôle support ne peut modifier les clés fournisseur.

Les exports administratifs respectent les permissions.

# 21. Recherche, favoris et organisation personnelle

## Objectif

Permettre de retrouver rapidement véhicules, voyages, lieux, activités et documents.

## Utilisateurs concernés

Tous les voyageurs

## Règles métier

La recherche respecte les permissions.

Les résultats récents ne doivent pas exposer de données supprimées.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| SRCH-001 | Fonctionnelle | Recherche globale. | Should | V1 |
| SRCH-002 | Fonctionnelle | Favoris de lieux et activités. | Must | V1 |
| SRCH-003 | Fonctionnelle | Listes personnalisées. | Should | V1.5 |
| SRCH-004 | Fonctionnelle | Filtres et tri. | Must | V1 |
| SRCH-005 | Fonctionnelle | Historique récent. | Should | V1 |
| SRCH-006 | Fonctionnelle | Recherche dans les documents par métadonnées. | Could | V1.5 |

**Critères d'acceptation**

Un favori est disponible sur tous les appareils.

La recherche ne retourne pas un élément supprimé.

# 22. Internationalisation et localisation

## Objectif

Préparer le produit au Québec, au Canada et à l'expansion internationale sans réécriture majeure.

## Utilisateurs concernés

Tous les voyageurs

Administrateurs

## Règles métier

Les contenus UI ne sont pas codés en dur.

Les unités, devises, dates et adresses sont localisées.

Les règles et avertissements peuvent varier par pays.

## Exigences fonctionnelles

| **ID** | **Type** | **Exigence** | **Priorité** | **Version** |
| --- | --- | --- | --- | --- |
| I18N-001 | Fonctionnelle | Français et anglais dès V1. | Must | V1 |
| I18N-002 | Fonctionnelle | Détection et changement de langue. | Must | V1 |
| I18N-003 | Fonctionnelle | Unités métriques et impériales. | Must | MVP |
| I18N-004 | Fonctionnelle | Multi-devise. | Should | V1 |
| I18N-005 | Fonctionnelle | Formats locaux de date, nombre et adresse. | Must | V1 |
| I18N-006 | Fonctionnelle | Contenus traduisibles en administration. | Should | V1.5 |
| I18N-007 | Fonctionnelle | Fuseaux horaires par voyage. | Must | V1 |
| I18N-008 | Fonctionnelle | Extension à d'autres langues. | Could | V2 |

**Critères d'acceptation**

Un utilisateur peut changer de langue sans perdre son contexte.

Les calculs restent identiques indépendamment de l'unité affichée.

# 23. Exigences non fonctionnelles

## 23.1 Performance

Temps de chargement initial cible inférieur à 3 secondes sur réseau mobile raisonnable.

Réponse des actions courantes inférieure à 500 ms hors fournisseur externe.

Calcul d'un itinéraire complexe avec progression visible.

Cache des données publiques et non sensibles.

## 23.2 Disponibilité et résilience

Objectif de disponibilité V1 : 99,5 %.

Dégradation élégante si IA, météo ou prix de carburant indisponible.

Reprise automatique des tâches asynchrones.

Sauvegardes chiffrées et restauration testée.

## 23.3 Sécurité

Chiffrement TLS en transit et chiffrement des données sensibles au repos.

Gestion des secrets hors code source.

Protection OWASP, limitation de débit et validation des entrées.

Journalisation sans contenu sensible inutile.

Revue des permissions et dépendances.

## 23.4 Confidentialité et conformité

Respect de la Loi 25 du Québec et principes applicables de protection des données.

Consentements explicites pour localisation, personnalisation et communications.

Export, correction et suppression des données.

Durées de conservation documentées.

Évaluation particulière pour données concernant des mineurs.

## 23.5 Accessibilité

Cible WCAG 2.2 AA pour l'application Web.

Navigation clavier et lecteurs d'écran.

Contrastes, textes redimensionnables et alternatives aux cartes.

Ne pas dépendre uniquement de la couleur.

## 23.6 Observabilité

Logs structurés, métriques et traces pour les parcours critiques.

Alertes sur erreurs, paiements, fournisseurs et tâches de données.

Corrélation par requête sans exposer le contenu privé.

Tableau de bord de coûts IA et API.

## 23.7 Maintenabilité

Architecture modulaire et contrats d'API versionnés.

Tests automatisés des calculs critiques.

Migrations de base réversibles lorsque possible.

Documentation mise à jour à chaque sprint.

# 24. Données, provenance et fraîcheur

Chaque donnée externe critique conserve fournisseur, identifiant source, date de collecte, date de validité et conditions d'utilisation.

Les données calculées conservent les paramètres et la version de l'algorithme.

Les données générées par IA sont identifiées comme telles et ne remplacent pas un fait vérifié.

Les prix, horaires, disponibilités, météo et circulation affichent leur fraîcheur.

Les données communautaires comportent statut de modération et réputation de la contribution.

Les données historiques d'un voyage ne sont pas silencieusement recalculées avec des sources nouvelles.

# 25. Intégrations externes pressenties

| **Domaine** | **Fournisseur pressenti** | **Usage** |
| --- | --- | --- |
| Cartographie et itinéraires | Google Maps Platform ou solution équivalente | Routes, géocodage, trafic, matrices de distance |
| Lieux et activités | Google Places et sources touristiques | Fiches, horaires, catégories, popularité |
| Météo | Fournisseur météo fiable et alertes officielles | Prévisions et alertes |
| Carburant | Sources gouvernementales, partenaires ou agrégateurs | Prix régionaux et stations |
| Paiement | Stripe ou équivalent | Abonnements, taxes, portail client |
| IA | OpenAI, Anthropic, Google | Conversation, classification, synthèse et outils |
| Courriel et notifications | Fournisseurs transactionnels et push | Vérification, rappels, alertes |
| Stockage | Service objet compatible | Photos, factures, documents |

# 26. Mesure du produit et analytique

## Indicateurs principaux

Activation : compte créé, véhicule ajouté et premier voyage calculé.

Rétention : retour mensuel et saisonnier, notamment hors période de voyage.

Valeur : économies estimées, entretiens complétés, recommandations acceptées.

Conversion : essai vers abonnement, mensuel vers annuel, plan familial.

Qualité : taux d'erreur des données, recommandations remplacées, signalements.

Coûts : coût IA et API par utilisateur actif et par voyage.

## Événements minimaux

signup_completed

vehicle_added

trip_created

route_calculated

fuel_plan_generated

activity_accepted

maintenance_completed

subscription_started

trip_completed

recommendation_rejected

# 27. Découpage proposé des versions

## MVP

Compte et authentification

Profil de base

Garage avec voiture ou VR

Catalogue initial limité

Création de voyage simple

Itinéraire et estimation carburant régionale

Tableau de bord et architecture bilingue

## V1

Catalogue enrichi

Entretien et carnet

Itinéraires multi-étapes

Prix par station lorsque disponible

Activités personnalisées

Campings et services VR

Météo

Budget

Assistant IA contextuel

Notifications

Abonnements

Administration

## V1.5

Proactivité avancée

Apprentissage de consommation

Score d'itinéraire

Assistant vocal limité

Partage et profils familiaux

Journal de voyage

OCR et garanties

Communauté modérée

## V2

CarPlay et Android Auto

Mode hors ligne avancé

Réservation intégrée

Véhicules électriques

Collaboration complète

Expansion internationale

Partenariats et place de marché

# 28. Hors portée initiale

Navigation GPS virage par virage développée entièrement à l'interne.

Diagnostic mécanique certifié ou remplacement d'un professionnel.

Garantie absolue de disponibilité d'un camping ou d'un prix de carburant.

Réseau social public complet.

Réservation universelle de tous les services de voyage.

Gestion bancaire ou carte de paiement propriétaire.

Conduite autonome ou contrôle direct du véhicule.

# 29. Registre initial des risques

| **ID** | **Risque** | **Impact** | **Mesure** |
| --- | --- | --- | --- |
| R-01 | Données de véhicule inexactes | Élevé | Sources, validation humaine, signalements, niveau de confiance |
| R-02 | Prix de carburant périmés | Élevé | Horodatage, fourchette, sources multiples |
| R-03 | Dépendance aux API cartographiques | Élevé | Abstraction fournisseur, quotas, cache |
| R-04 | Coûts IA incontrôlés | Élevé | Routage, quotas, cache, modèles adaptés |
| R-05 | Hallucinations de l'assistant | Élevé | Tool calling, validation, sources, réponses prudentes |
| R-06 | Faible usage hors vacances | Élevé | Entretien, documents, rappels et préparation annuelle |
| R-07 | Responsabilité liée à la route | Élevé | Avertissements, sources officielles, confirmation conducteur |
| R-08 | Complexité excessive du produit | Moyen | MVP strict, progressive disclosure, tests utilisateurs |
| R-09 | Confidentialité familiale et localisation | Élevé | Minimisation, consentement, chiffrement, rétention |
| R-10 | Difficulté à maintenir le catalogue | Moyen | Pipeline automatisé avec validation |

# 30. Définition de terminé pour une fonctionnalité

Exigences et critères d'acceptation compris et reliés à un identifiant PRD.

UX et états vides, chargement, erreur et accès refusé définis.

Validation côté client et côté serveur.

Permissions et confidentialité vérifiées.

Tests unitaires, intégration et parcours critique réussis.

Journalisation et analytique ajoutées sans fuite de données.

Traductions française et anglaise présentes.

Accessibilité et responsive vérifiés.

Documentation technique et journal de décision mis à jour.

Validation fonctionnelle réalisée avant de passer au sprint suivant.

# 31. Matrice de traçabilité simplifiée

| **Axe de vision** | **Modules PRD** | **Livrables associés** |
| --- | --- | --- |
| Vision : compagnon véhicule | VEH, CAT, MNT | Garage, catalogue, entretien |
| Vision : voyage économique | ROUTE, FUEL, BUD | Itinéraire, pleins, budget |
| Vision : voyage personnalisé | PROF, FAM, POI, WX | Profil, famille, activités, météo |
| Vision : compagnon proactif | AI, COP, NOTIF | Assistant, copilote, alertes |
| Vision : valeur annuelle VR | MNT, RV, JRN | Entretien, services, carnet |
| Vision : produit bilingue | I18N, NFR | Localisation et accessibilité |

# 32. Questions ouvertes à résoudre dans les documents suivants

Choix définitif de la pile technologique et du fournisseur d'authentification.

Fournisseurs autorisés et coûts pour cartographie, prix du carburant, météo et données VR.

Modèle exact d'abonnement et limites de l'offre gratuite.

Schéma de données complet, stratégie multi-tenant et séparation des données.

Architecture des tâches asynchrones, du cache et des mises à jour de catalogue.

Design détaillé des écrans et parcours mobiles.

Pays couvert au lancement et portée exacte du Québec/Canada.

Nom, identité de marque et domaine définitifs.

# 33. Prochaine documentation

Architecture fonctionnelle et technique.

Conception détaillée de la base de données.

Parcours UX et inventaire des écrans.

Spécification des API et intégrations.

Roadmap de développement découpée en sprints.

Prompts Cursor et cahiers de validation par sprint.

PRD v1.0 — Compagnon de voyage intelligent — Page