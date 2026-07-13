# Document 7 — Architecture frontend générale

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

## Document 7 - Partie 1 Architecture Frontend Générale

### Objectif

Définir l'architecture générale du frontend du SaaS afin d'obtenir une base cohérente, évolutive et facilement maintenable. Cette architecture servira de référence pour toutes les fonctionnalités développées par Cursor.

### Pile technologique

Composant

Framework

Langage

UI

CSS

Composants

Icônes

Validation

État serveur

État client

Formulaires

Cartographie

Choix retenu

Next.js 16 (App Router)

TypeScript

React

Tailwind CSS

shadcn/ui

Lucide React

Zod

TanStack Query

Zustand

React Hook Form

Google Maps + abstraction

### Structure des dossiers

app/, components/, features/, hooks/, lib/, services/, stores/, types/, styles/, public/.

### Principes d'architecture

Architecture modulaire par fonctionnalité. Les composants sont réutilisables. Toute logique métier reste côté services/API.

### Gestion des états

Zustand pour l'état global (session, véhicule actif, voyage actif). TanStack Query pour les données provenant des API.

### Navigation

Navigation via App Router avec layouts imbriqués, routes protégées et chargement progressif.

### Performance

Code splitting, lazy loading, Server Components lorsque pertinent, optimisation des images et cache intelligent.

### Responsive

Approche mobile-first avec prise en charge téléphone, tablette, ordinateur et écrans ultralarges.

### Critères d'acceptation

• Structure des dossiers uniforme. • Aucun composant monolithique. • Réutilisation maximale des composants. • Respect strict de TypeScript. • Compatible avec les autres documents d'architecture.

## Document 7 - Partie 2 Design System

### Objectif

Définir l'ensemble des règles visuelles afin d'assurer une interface cohérente, moderne et réutilisable sur l'ensemble du SaaS.

Élément

Palette

Typographie

Rayon des cartes

Espacement

Ombres

Icônes

Mode sombre

Animations

Accessibilité

Standard retenu

Vert principal, gris neutres, accents bleu et orange pour états

Inter

16 px

Grille de 8 px

Légères, cohérentes

Lucide React

Support complet

Framer Motion (légères)

Contrastes WCAG 2.2 AA

### Couleurs fonctionnelles

Succès (vert), Information (bleu), Avertissement (orange), Erreur (rouge). Chaque couleur possède une variante claire, normale et foncée.

### Composants

Tous les composants utilisent les mêmes espacements, rayons, états hover, focus, disabled et loading.

### Grille

Largeur maximale de contenu de 1440 px. Mise en page mobile-first avec points de rupture standards.

### Thèmes

Les thèmes clair et sombre utilisent les mêmes variables CSS afin de simplifier la maintenance.

### Tokens

Toutes les couleurs, espacements, tailles de police, ombres et rayons sont définis sous forme de design tokens.

### Critères d'acceptation

• Aucun style codé en dur.

• Utilisation exclusive des variables du Design System. • Tous les composants sont compatibles clair/sombre. • Respect des règles d'accessibilité.

## Document 7 - Partie 3 Composants UI

### Objectif

Définir tous les composants visuels réutilisables afin de garantir une interface homogène et facilement maintenable.

Composant

Button

Input

Select

Card

Modal

Toast

Badge

Table

Tabs

Skeleton

Description

Actions principales

Saisie utilisateur

Listes déroulantes

Conteneur principal

Fenêtre contextuelle

Notification temporaire

Indicateur

Affichage tabulaire

Navigation secondaire

Chargement

États

Default, Hover, Focus, Disabled, Loading

Normal, Error, Disabled

Vide, Sélectionné, Recherche

Standard, Compact, Highlight

Ouverte, Fermée

Info, Succès, Erreur, Avertissement

Couleurs selon le statut

Tri, Filtre, Pagination

Actif, Inactif

Animation légère

### Convention de nommage

Chaque composant possède un nom explicite (PrimaryButton, VehicleCard, TripTimeline, FuelPriceCard, etc.).

### Réutilisation

Les composants ne contiennent aucune logique métier. Ils reçoivent leurs données via des props fortement typées.

### Accessibilité

Tous les composants supportent la navigation clavier, les attributs ARIA, les états focus visibles et les contrastes WCAG 2.2 AA.

### Responsive

Chaque composant est conçu pour fonctionner sur mobile, tablette et ordinateur sans duplication.

### Animations

Les transitions sont discrètes (150 à 250 ms) afin d'améliorer la perception sans ralentir l'interface.

### Critères d'acceptation

• Aucun composant dupliqué.

• Tous les composants documentés dans Storybook (ou équivalent). • Props typées en TypeScript.

• Tests unitaires pour les composants critiques. • Compatibilité thème clair et sombre.

## Document 7 - Partie 4 Layout Principal

### Objectif

Définir la structure commune utilisée par toutes les pages de l'application afin d'offrir une navigation cohérente, rapide et intuitive.

Zone

Header

Sidebar

Breadcrumb

Contenu

Panneau IA

Footer

Description

Logo, recherche, notifications, profil

Navigation principale

Position dans l'application

Module actif

Assistant contextuel

Version, support, liens

Comportement

Toujours visible

Réductible

Automatique

Responsive

Affichable/Masquable

Minimal

### Navigation principale

Le menu comprend : Tableau de bord, Voyages, Véhicules, Entretien, Finances, Assistant IA, Notifications et Paramètres. Les administrateurs disposent d'entrées supplémentaires.

### Responsive

Sur mobile, la barre latérale devient un menu latéral coulissant. Le header reste fixe et les actions principales demeurent accessibles.

### Gestion des états

Chaque page prévoit des états de chargement (Skeleton), vide (Empty State), erreur et succès afin d'assurer une expérience cohérente.

### Performance

Les layouts utilisent les fonctionnalités du App Router de Next.js afin d'éviter les rechargements inutiles et de préserver l'état des composants.

### Accessibilité

Toutes les zones de navigation sont accessibles au clavier, disposent de repères ARIA et respectent les recommandations WCAG 2.2 AA.

### Critères d'acceptation

• Navigation cohérente dans tous les modules.

• Temps de chargement réduit grâce aux layouts imbriqués. • Responsive complet.

• Compatible avec le thème clair et sombre.

• Assistant IA accessible depuis n'importe quel écran.

## Document 7 - Partie 5 Authentification et Onboarding

### Objectif

Définir l'ensemble des écrans, composants et comportements liés à la connexion, l'inscription et à la première utilisation de l'application.

Écran

Accueil

Connexion

Inscription

Validation

Onboarding

Fin

Composants principaux

Logo, CTA, présentation

Email, mot de passe, OAuth

Informations personnelles

Confirmation du courriel

Langue, devise, pays

Résumé

Actions

Connexion / Créer un compte

Se connecter

Créer le compte

Continuer

Configurer le profil

Accéder au tableau de bord

### Expérience utilisateur

Le parcours doit permettre à un nouvel utilisateur d'accéder au tableau de bord en moins de cinq minutes. Les formulaires sont courts, validés en temps réel et entièrement compatibles mobile.

### Authentification

Support du courriel/mot de passe ainsi que des fournisseurs OAuth. Les sessions sont restaurées automatiquement lorsque possible.

### Onboarding

Configuration du profil, du premier véhicule, des préférences de voyage et des paramètres régionaux avant l'accès complet à l'application.

### Gestion des erreurs

Messages explicites, conservation des données saisies et possibilité de reprendre le processus sans recommencer.

### Sécurité

Protection CSRF, limitation des tentatives de connexion, validation côté client et serveur, gestion sécurisée des jetons.

### Critères d'acceptation

• Temps de connexion inférieur à quelques secondes. • Validation en temps réel.

• Compatible clavier et lecteurs d'écran.

• Responsive complet.

• Thèmes clair et sombre pris en charge.

## Document 7 - Partie 6 Tableau de bord

### Objectif

Définir l'architecture visuelle et fonctionnelle du tableau de bord principal afin d'offrir une vue d'ensemble intelligente et personnalisée dès l'ouverture de l'application.

Zone

En-tête

Résumé voyage

Assistant IA

Entretien

Finances

Carburant

Activités

Notifications

Contenu

Bienvenue, véhicule actif, météo

Prochain voyage ou voyage actif

Recommandations contextuelles

Échéances et alertes

Budget et dépenses

Prix près de l'utilisateur

Suggestions personnalisées

Alertes importantes

Comportement

Toujours visible

Carte principale

Actualisation dynamique

Mise à jour automatique

Graphiques interactifs

Temps réel

Basées sur le contexte

Priorité décroissante

### Disposition générale

Le tableau de bord est composé de cartes indépendantes pouvant être réorganisées par l'utilisateur. Les informations prioritaires apparaissent toujours en haut.

### Personnalisation

Chaque utilisateur peut masquer, déplacer ou redimensionner les widgets selon ses besoins. Les préférences sont synchronisées entre les appareils.

### Mises à jour

Les données provenant des API sont rafraîchies automatiquement selon leur fréquence de validité. Les mises à jour sont non bloquantes.

### Performance

Chargement progressif avec Skeleton Loaders, Server Components lorsque possible et récupération parallèle des données.

### Responsive

Le tableau de bord s'adapte automatiquement aux téléphones, tablettes et grands écrans sans perte de fonctionnalités.

### Critères d'acceptation

• Widgets entièrement réutilisables. • Personnalisation persistante.

• Temps de chargement optimisé. • Navigation accessible au clavier.

• Compatible avec les thèmes clair et sombre.

## Document 7 - Partie 7 Gestion des véhicules

### Objectif

Définir l'architecture visuelle et les interactions du module de gestion des véhicules afin que l'utilisateur puisse administrer aussi bien une voiture qu'un VR.

Écran

Liste

Création

Fiche véhicule

Documents

Entretien

Statistiques

Contenu

Cartes des véhicules

Assistant en plusieurs étapes

Spécifications, documents

Factures, assurances, manuels

Calendrier, rappels

Consommation, coûts

Interaction

Recherche, filtre, tri

Validation en temps réel

Modification rapide

Glisser-déposer

Vue chronologique

Graphiques

### Ajout d'un véhicule

L'utilisateur choisit le type (voiture ou VR), le constructeur, le modèle et l'année. Les caractéristiques techniques sont récupérées automatiquement depuis le catalogue.

### Consultation

Chaque véhicule possède une fiche complète regroupant les spécifications, les documents, les entretiens, les statistiques et les voyages associés.

### Expérience utilisateur

Les opérations courantes (modifier le kilométrage, ajouter une facture, téléverser un document) sont accessibles en un minimum d'interactions.

### Responsive

Les fiches utilisent une disposition en cartes sur mobile et une présentation multi-colonnes sur ordinateur.

### Performance

Les photos et documents sont chargés à la demande. Les graphiques utilisent un rendu différé afin de préserver la fluidité.

### Critères d'acceptation

• Navigation rapide entre plusieurs véhicules. • Compatible voitures et VR.

• Recherche instantanée.

• Téléversement de documents intuitif.

• Interface cohérente avec le Design System.

## Document 7 - Partie 8 Gestion des voyages

### Objectif

Définir l'architecture des écrans permettant de créer, modifier, consulter et suivre les voyages, en offrant une expérience fluide, intuitive et fortement assistée par l'IA.

Écran

Liste des voyages

Création

Fiche voyage

Étapes

Participants

Résumé

Contenu principal

Voyages passés, actifs et planifiés

Assistant étape par étape

Carte, budget, météo, activités

Arrêts, nuitées, points d'intérêt

Famille, amis, animaux

Coûts, distance, temps

Interactions

Recherche, filtres, tri

Validation en temps réel

Modification instantanée

Glisser-déposer

Ajout / retrait

Export PDF et partage

### Création d'un voyage

L'utilisateur sélectionne un véhicule, définit les participants, les dates, le point de départ, la destination et son budget. L'assistant IA propose automatiquement un itinéraire optimisé.

### Organisation des étapes

Chaque arrêt peut être réorganisé par glisser-déposer. Les temps de trajet, coûts estimés et horaires sont recalculés instantanément.

### Suggestions intelligentes

Le système recommande des campings, stations-service, activités, restaurants, panoramas et événements selon le profil du groupe, la météo et le budget.

### Gestion en temps réel

Durant le voyage, l'utilisateur peut modifier son itinéraire, ajouter des étapes, enregistrer des dépenses ou consulter les recommandations de l'IA sans interrompre la navigation.

### Responsive

La carte interactive occupe l'espace principal sur ordinateur alors qu'elle passe en plein écran sur mobile. Les panneaux d'information deviennent des feuilles coulissantes.

### Critères d'acceptation

• Création d'un voyage en moins de 5 minutes.

• Optimisation instantanée après chaque modification. • Synchronisation multi-appareils.

• Compatible hors ligne pour les données déjà téléchargées. • Respect intégral du Design System.

## Document 7 - Partie 9 Carte interactive

### Objectif

Définir l'interface cartographique centrale de l'application. La carte constitue le cœur de l'expérience utilisateur en regroupant navigation, itinéraire, carburant, campings, activités et recommandations de l'IA.

Couche

Itinéraire

Carburant

Campings

Activités

Météo

Trafic

Position

Description

Trajet principal et étapes

Stations avec prix

Campings compatibles

Points d'intérêt

Conditions le long du trajet

État du réseau routier

Localisation utilisateur

Interaction

Zoom, déplacement, recalcul

Filtres, comparaison

Fiche détaillée

Suggestions IA

Superposition

Temps réel

Suivi GPS

### Navigation

La carte reste visible durant toute la planification et le voyage. Les panneaux d'information se superposent sans masquer le trajet principal.

### Interactions

L'utilisateur peut déplacer les étapes par glisser-déposer, ajouter un arrêt directement sur la carte, mesurer une distance ou afficher plusieurs itinéraires alternatifs.

### Assistant IA

L'IA met en évidence les meilleurs endroits où faire le plein, les activités adaptées au profil du groupe, les campings recommandés et les détours présentant un bon rapport qualité/prix.

### Performances

Chargement progressif des couches cartographiques, regroupement (clustering) des marqueurs, mise en cache locale des cartes récemment consultées et rafraîchissement intelligent.

### Responsive

Sur mobile, la carte occupe le plein écran avec des panneaux coulissants. Sur ordinateur, les panneaux latéraux restent visibles sans réduire la lisibilité.

### Critères d'acceptation

• Déplacement fluide de la carte.

• Recalcul instantané des itinéraires.

• Affichage simultané de plusieurs couches.

• Compatible hors ligne avec les données téléchargées. • Intégration complète avec les recommandations IA.

## Document 7 - Partie 10 Entretien des véhicules

### Objectif

Définir l'expérience utilisateur complète du module d'entretien afin d'assurer un suivi préventif intelligent des voitures et des véhicules récréatifs.

Vue

Résumé

Calendrier

Historique

Documents

Recommandations IA

Statistiques

Contenu

État de santé du véhicule

Entretiens à venir

Toutes les interventions

Factures, garanties, manuels

Conseils personnalisés

Coûts et tendances

Interaction

Indicateurs visuels

Vue chronologique

Recherche et filtres

Glisser-déposer

Actions rapides

Graphiques interactifs

### Tableau de santé

Une vue synthétique présente les éléments critiques, les entretiens à prévoir, le kilométrage actuel et le niveau de confiance des recommandations IA.

### Ajout d'entretien

L'ajout d'une intervention s'effectue via un assistant simple avec import de facture, saisie manuelle ou lecture OCR des reçus.

### Entretien intelligent

Les recommandations sont calculées à partir des spécifications constructeur, du kilométrage, de l'âge du véhicule, des habitudes de conduite et des voyages planifiés.

### Expérience utilisateur

Les actions les plus fréquentes (mise à jour du kilométrage, ajout d'une facture, marquage d'un entretien comme terminé) sont accessibles en un ou deux clics.

### Responsive

Les graphiques se transforment en cartes empilées sur mobile tandis que les tableaux deviennent des listes adaptées aux écrans tactiles.

### Critères d'acceptation

• Vue globale claire.

• Historique consultable rapidement. • Import de documents intuitif.

• Alertes visibles sans être intrusives. • Respect du Design System.

## Document 7 - Partie 11 Assistant IA

### Objectif

Définir l'expérience utilisateur complète de l'assistant IA afin qu'il devienne le copilote principal du voyageur avant, pendant et après chaque déplacement.

Vue

Accueil IA

Chat

Actions

Mémoire

Suggestions

Contexte

Contenu

Résumé et recommandations

Historique des échanges

Créer un voyage, modifier un itinéraire

Préférences apprises

Activités, carburant, météo

Voyage, véhicule, famille

Interaction

Conversation rapide

Messages en continu

Validation utilisateur

Consultation / suppression

Acceptation / rejet

Mise à jour automatique

### Conversation contextuelle

L'assistant connaît automatiquement le voyage actif, le véhicule sélectionné, les préférences de la famille, le budget, la météo et les étapes prévues afin d'éviter de demander des informations déjà disponibles.

### Actions intelligentes

Au-delà des réponses textuelles, l'IA peut proposer des actions concrètes : optimiser un itinéraire, ajouter une activité, déplacer un arrêt, trouver une station-service moins chère ou planifier un entretien.

### Transparence

Chaque recommandation indique brièvement pourquoi elle est proposée (prix, météo, préférences, distance, sécurité, etc.).

### Expérience utilisateur

Le panneau IA est accessible depuis tous les écrans sans quitter le contexte actuel. Les réponses importantes peuvent être épinglées ou enregistrées dans le voyage.

### Performance

Les réponses sont diffusées en streaming lorsque possible. Les calculs complexes sont exécutés en arrière-plan avec indicateurs de progression.

### Critères d'acceptation

• IA disponible depuis chaque module. • Réponses contextualisées.

• Suggestions actionnables en un clic. • Mémoire utilisateur contrôlable.

• Compatible avec plusieurs fournisseurs IA (OpenAI, Claude, Gemini, Ollama).

## Document 7 - Partie 12 Finances

### Objectif

Définir l'interface utilisateur du module financier permettant de suivre les dépenses, les budgets, les économies réalisées et les abonnements de façon simple et visuelle.

Écran

Vue d'ensemble

Dépenses

Reçus

Graphiques

Abonnement

Rapports

Contenu

Budget, dépenses, économies

Liste et filtres

OCR et pièces jointes

Répartition par catégorie

Forfait actuel

Exports PDF/Excel

Interactions

Navigation rapide

Ajout, modification, suppression

Import par photo ou fichier

Zoom et filtres

Changer de plan

Téléchargement

### Budget en temps réel

Le budget est recalculé instantanément après chaque dépense. Les écarts entre les coûts estimés et réels sont mis en évidence.

### Gestion des dépenses

Les dépenses peuvent être ajoutées manuellement, importées par OCR ou créées automatiquement à partir de certains services connectés.

### Visualisations

Des graphiques permettent d'analyser les coûts par catégorie, par voyage, par véhicule et par période afin d'identifier les principaux postes de dépenses.

### Abonnements

L'utilisateur consulte son forfait, ses paiements, son historique de facturation et peut changer d'offre sans quitter l'application.

### Responsive

Les tableaux deviennent des cartes sur mobile et les graphiques sont optimisés pour les petits écrans.

### Critères d'acceptation

• Calculs instantanés.

• Import de reçus intuitif. • Graphiques interactifs.

• Compatible multi-devises.

• Respect complet du Design System.

## Document 7 - Partie 13 Notifications

### Objectif

Définir l'expérience utilisateur du système de notifications afin que les informations importantes soient visibles au bon moment sans devenir intrusives.

Catégorie

Voyages

Entretien

Carburant

Météo

Assistant IA

Système

Marketing

Exemples

Départ imminent, changement d'itinéraire

Vidange, inspection, pneus

Prix avantageux à proximité

Orage, neige, vents

Nouvelles recommandations

Maintenance, sécurité

Nouveautés, promotions

Priorité

Élevée

Élevée

Moyenne

Élevée

Moyenne

Critique

Faible

### Centre de notifications

Toutes les notifications sont regroupées dans un panneau unique avec filtres, recherche, catégories et historique.

### Canaux de diffusion

Les messages peuvent être affichés dans l'application, envoyés par notification push ou par courriel selon les préférences de l'utilisateur.

### Personnalisation

Chaque catégorie peut être activée ou désactivée individuellement. Les alertes critiques restent prioritaires.

### Actions rapides

Les notifications permettent d'effectuer une action immédiate (ouvrir un voyage, accepter une recommandation IA, planifier un entretien, etc.) sans parcourir plusieurs écrans.

### Responsive

Le centre de notifications devient un panneau plein écran sur mobile et un panneau latéral sur ordinateur.

### Critères d'acceptation

• Notifications classées par priorité. • Recherche et filtres instantanés.

• Paramètres utilisateur complets. • Synchronisation multi-appareils. • Respect du Design System.

## Document 7 - Partie 14 Administration

### Objectif

Définir l'interface d'administration permettant de superviser l'ensemble de la plateforme, les utilisateurs, les données, les intégrations et les statistiques.

Module

Tableau de bord

Utilisateurs

Catalogue

Intégrations

Statistiques

Audit

Configuration

Fonction

Indicateurs globaux

Gestion des comptes

Constructeurs, modèles, activités

Clés API, synchronisations

Utilisation et performances

Journal des actions

Paramètres système

Accès

Administrateur

Administrateur

Administrateur

Administrateur

Administrateur

Super administrateur

Super administrateur

### Tableau de bord

L'administrateur visualise en un coup d'œil les nouveaux utilisateurs, les abonnements, les erreurs système, les intégrations et l'état des services.

### Gestion des données

Toutes les entités principales (utilisateurs, véhicules, voyages, activités, campings, modèles, etc.) disposent d'interfaces de recherche, de filtrage et d'édition.

### Surveillance

Des tableaux de bord présentent l'état des API externes, des tâches planifiées, des files d'attente, des performances et des journaux d'erreurs.

### Sécurité

Les opérations critiques nécessitent une confirmation. Toutes les actions administratives sont consignées dans le journal d'audit.

### Responsive

Même si l'administration est optimisée pour ordinateur, toutes les fonctions essentielles demeurent accessibles sur tablette.

### Critères d'acceptation

• Recherche globale performante. • Journalisation complète.

• Gestion fine des permissions.

• Interfaces cohérentes avec le Design System. • Accès sécurisé aux fonctions critiques.

## Document 7 - Partie 15 Animations et micro-interactions

### Objectif

Définir les animations, transitions et micro-interactions afin de rendre l'application fluide, agréable et moderne sans nuire aux performances.

Élément

Navigation

Boutons

Cartes

Modales

Notifications

Chargement

Glisser-déposer

Animation

Transition de page

Hover / Press

Élévation au survol

Fade + Scale

Slide-in

Skeleton Loader

Animation fluide

Durée cible

150-250 ms

100-150 ms

150 ms

200 ms

250 ms

Jusqu'à disponibilité

Temps réel

### Principes

Les animations doivent renforcer la compréhension de l'interface sans distraire l'utilisateur. Elles restent courtes, cohérentes et désactivables selon les préférences système.

### Feedback utilisateur

Chaque action importante fournit un retour visuel immédiat : bouton en chargement, validation, erreur, succès ou progression.

### Chargement

Les Skeleton Loaders remplacent les spinners lorsque cela améliore la perception des performances. Les données arrivent progressivement sans bloquer l'interface.

### Accessibilité

Les animations respectent la préférence « réduire les animations » du système d'exploitation et évitent tout effet pouvant provoquer un inconfort visuel.

### Performance

Les animations utilisent principalement les propriétés CSS transform et opacity afin de profiter de l'accélération matérielle.

### Critères d'acceptation

• Animations cohérentes dans toute l'application. • Respect des préférences d'accessibilité.

• Aucune baisse perceptible des performances.

• Feedback visuel sur toutes les actions importantes. • Conformité au Design System.

## Document 7 - Partie 16 Responsive Design

### Objectif

Définir les règles de conception responsive afin d'offrir une expérience optimale sur téléphone, tablette, ordinateur portable et grands écrans.

Format

Mobile

Tablette

Portable

Grand écran

Ultra large

Résolution cible

320–767 px

768–1023 px

1024–1439 px

1440 px et +

1920 px et +

Adaptations principales

Navigation compacte, panneaux coulissants

Deux colonnes lorsque pertinent

Disposition standard

Colonnes supplémentaires, cartes élargies

Optimisation de l'espace sans étirer le contenu

### Principe Mobile First

Toutes les interfaces sont conçues d'abord pour les petits écrans puis enrichies progressivement pour les formats plus larges.

### Composants adaptatifs

Les tableaux deviennent des cartes, les panneaux latéraux deviennent des feuilles coulissantes et les menus sont simplifiés sur mobile.

### Images et médias

Les images utilisent des formats optimisés et des tailles responsives afin de réduire le temps de chargement.

### Performance

Chargement différé des composants lourds, virtualisation des longues listes et limitation des ressources sur appareils moins puissants.

### Tests

Chaque écran est validé sur les principaux navigateurs modernes et sur différentes résolutions avant la mise en production.

### Critères d'acceptation

• Aucune perte de fonctionnalité selon la taille d'écran. • Mise en page cohérente sur tous les appareils.

• Temps de chargement optimisé. • Compatible tactile et souris.

• Respect intégral du Design System.

## Document 7 - Partie 17 Accessibilité (WCAG 2.2 AA)

### Objectif

Définir les standards d'accessibilité afin que la plateforme soit utilisable par le plus grand nombre, indépendamment des capacités physiques, visuelles ou cognitives des utilisateurs.

Catégorie

Clavier

Contrastes

Lecteurs d'écran

Focus

Formulaires

Médias

Exigences

Navigation complète sans souris

WCAG 2.2 AA minimum

Libellés ARIA, structure sémantique

Toujours visible

Messages d'erreur explicites

Textes alternatifs et sous-titres

Validation

Tests clavier

Analyse automatique

NVDA / VoiceOver

Tests UX

Validation utilisateur

Audit

### Navigation

Tous les écrans sont entièrement navigables au clavier. L'ordre de tabulation est logique et cohérent dans toute l'application.

### Composants

Chaque composant du Design System intègre dès sa conception les attributs ARIA, les états de focus et les comportements attendus par les technologies d'assistance.

### Formulaires

Les champs obligatoires sont identifiés, les erreurs sont expliquées clairement et des suggestions de correction sont proposées lorsque possible.

### Préférences utilisateur

L'application respecte les préférences système telles que le mode sombre, la réduction des animations et la taille de police lorsque cela est pertinent.

### Validation

Des audits automatisés (Lighthouse, axe-core) et des tests manuels font partie du processus de mise en production.

### Critères d'acceptation

• Conformité WCAG 2.2 niveau AA. • Navigation 100 % au clavier.

• Compatibilité avec les principaux lecteurs d'écran.

• Contrastes conformes.

• Tous les composants validés avant publication.

## Document 7 - Partie 18 Standards Frontend et Annexes

### Objectif

Définir les conventions de développement frontend qui devront être respectées par l'ensemble des développeurs et des agents IA afin de garantir une base de code homogène et durable.

Catégorie

Architecture

Composants

TypeScript

Styles

Validation

État

Tests

Qualité

Documentation

Standard retenu

Découpage par fonctionnalité (feature-first)

Réutilisables, fortement typés, sans logique métier

Mode strict obligatoire

Tailwind + Design Tokens uniquement

React Hook Form + Zod

TanStack Query + Zustand

Vitest + Playwright

ESLint + Prettier + Husky

Storybook + commentaires ciblés

### Convention de nommage

Les composants utilisent PascalCase, les hooks commencent par use, les fonctions sont explicites et les fichiers suivent une convention uniforme.

### Structure des dossiers

Chaque fonctionnalité possède ses composants, hooks, services, types et tests. Les dépendances entre modules sont limitées afin de conserver un faible couplage.

### Performance

Utilisation systématique du lazy loading, du code splitting, des Server Components lorsque pertinent et de la virtualisation pour les longues listes.

### Qualité

Les Pull Requests doivent satisfaire les contrôles automatiques : lint, tests unitaires, tests d'intégration et build complet avant fusion.

### Évolutivité

L'architecture doit permettre l'ajout de nouveaux modules sans modification importante du code existant.

### Checklist avant livraison

• Aucun avertissement TypeScript. • Lint sans erreur.

• Tests automatisés réussis. • Responsive vérifié.

• Accessibilité validée.

• Documentation mise à jour.

• Conforme aux documents 1 à 7.
