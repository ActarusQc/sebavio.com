# Document 1 — Vision produit

> Décision d'architecture ferme : le projet Sebavio n'utilise PAS Docker ni aucune conteneurisation. Déploiement direct : Node.js 22 LTS + PM2 + Nginx sur Ubuntu (VPS Contabo).

---

**VISION PRODUIT  |  COMPAGNON DE VOYAGE INTELLIGENT  |  v1.0**

| **DOCUMENT 1** |
| --- |

**Vision produit**

Compagnon de voyage intelligent pour véhicules et camping-cars

*Un SaaS qui planifie, optimise, accompagne et personnalise chaque voyage*

| **Propriétaire du produit** | Daniel |
| --- | --- |
| **Version** | 1.0 |
| **Date** | 13 juillet 2026 |
| **Statut** | Vision initiale consolidée |

*Ce document définit ce que le produit doit devenir. Il ne constitue pas la feuille de route technique ni les prompts Cursor.*

# Contrôle du document

| **Élément** | **Description** |
| --- | --- |
| But | Consolider la vision, la proposition de valeur, les publics cibles, l'expérience souhaitée et l'ensemble des capacités fonctionnelles du SaaS. |
| Utilisation | Document de référence pour les décisions produit, le cahier des charges détaillé, la feuille de route et les futurs prompts destinés à Cursor. |
| Portée | Produit grand public pour les voyageurs en voiture et les propriétaires de camping-cars, avec une expérience adaptée au véhicule, au profil de voyage et au contexte du trajet. |
| Hors portée | Les étapes de développement, les commandes serveur, les choix définitifs d'hébergement et les prompts d'implémentation seront traités dans un document distinct. |
| Principe de gouvernance | Toute fonctionnalité future devra être reliée à un identifiant d'exigence de ce document ou ajoutée explicitement lors d'une révision. |

| **Décision centrale** Le produit ne sera pas un simple générateur d'itinéraires. Il sera conçu comme un compagnon de voyage intelligent, personnel et proactif, capable de comprendre le véhicule, les voyageurs, le budget, les préférences, la météo et les conditions du déplacement. |
| --- |

# Table des matières

1. Résumé exécutif

2. Vision, mission et promesse

3. Positionnement et différenciation

4. Publics cibles et personas

5. Problèmes à résoudre

6. Principes directeurs du produit

7. Vue d'ensemble de l'expérience

8. Profil utilisateur et style de voyage

9. Gestion des véhicules et base de données

10. Entretien et carnet numérique

11. Planification d'itinéraires et optimisation du carburant

12. Découverte d'activités et guide touristique intelligent

13. Assistant proactif avant et pendant le voyage

14. Budget, dépenses et économies

15. Copilote conversationnel et vocal

16. Assistance en cas d'imprévu

17. Journal et souvenirs de voyage

18. Fonctions communautaires

19. Expérience propre aux camping-cars

20. Intégrations, données et intelligence artificielle

21. Comptes, abonnement et administration

22. Sécurité, vie privée et qualité

23. Versions produit proposées

24. Modèle économique et indicateurs de succès

25. Limites et questions à trancher

Annexe A. Registre des exigences produit

# 1. Résumé exécutif

Le produit envisagé est une plateforme SaaS grand public destinée à simplifier et enrichir les voyages routiers. Elle s'adresse autant aux personnes qui voyagent en automobile qu'aux propriétaires de camping-cars. À partir du véhicule utilisé, de l'itinéraire, du profil des voyageurs, de leurs préférences et des données contextuelles disponibles, l'application produit une expérience personnalisée avant, pendant et après le voyage.

Sa différence fondamentale repose sur la combinaison de quatre dimensions rarement réunies dans une seule solution : la connaissance détaillée du véhicule, l'optimisation économique du trajet, la découverte personnalisée d'activités et un accompagnement proactif par intelligence artificielle. L'utilisateur ne consulte donc pas seulement une carte : il reçoit des recommandations adaptées à sa famille, à son budget, à son véhicule et à sa manière de voyager.

Le produit doit être pensé pour générer de la valeur de façon récurrente, même lorsque l'utilisateur ne se trouve pas en vacances. Les rappels d'entretien, le carnet numérique du véhicule, les alertes préventives, les idées de sorties, la préparation des prochains voyages et l'historique personnel créent des raisons de revenir régulièrement et soutiennent un modèle d'abonnement.

| **Promesse en une phrase** Planifier le bon voyage, avec le bon véhicule, au meilleur coût, tout en découvrant des expériences qui correspondent réellement aux personnes qui voyagent. |
| --- |

# 2. Vision, mission et promesse

## 2.1 Vision

Devenir le compagnon numérique de référence pour les voyages routiers personnels en Amérique du Nord, en réunissant dans une expérience simple les données du véhicule, l'itinéraire, les coûts, les découvertes locales et l'assistance intelligente.

## 2.2 Mission

Aider chaque voyageur à prendre de meilleures décisions avant et pendant un déplacement : où passer, où s'arrêter, où faire le plein, quoi faire sur place, quoi prévoir pour le véhicule et comment respecter son budget.

## 2.3 Valeur créée

Économiser de l'argent grâce à de meilleures décisions de trajet, de ravitaillement et de planification.

Gagner du temps en regroupant les informations dispersées dans plusieurs applications et sites.

Réduire le stress grâce aux rappels, aux vérifications pré-départ et aux alertes contextuelles.

Améliorer l'expérience du voyage avec des activités réellement adaptées aux voyageurs.

Préserver la valeur du véhicule grâce à un suivi d'entretien structuré et documenté.

Créer un produit personnel qui devient plus pertinent à mesure qu'il apprend les habitudes de l'utilisateur.

# 3. Positionnement et différenciation

Le marché comporte déjà des cartes, des planificateurs d'itinéraires, des applications de camping, des sites de prix de l'essence, des guides touristiques et des carnets d'entretien. Le produit doit donc éviter de reproduire séparément ces services. Sa force sera de les orchestrer autour d'un profil unique et d'une logique personnalisée.

| **Produit classique** | **Limite habituelle** | **Différence recherchée** |
| --- | --- | --- |
| Application cartographique | Connaît la route, mais peu le véhicule et la famille. | Le trajet tient compte du véhicule, de la consommation, des contraintes et des préférences. |
| Site de prix de carburant | Montre des prix, mais ne planifie pas les pleins. | Le produit recommande quand et où faire le plein selon l'autonomie et le coût réel du détour. |
| Guide touristique | Liste beaucoup de lieux sans connaître le contexte. | Les suggestions sont filtrées selon l'âge des enfants, le budget, la météo, le temps disponible et les goûts. |
| Carnet d'entretien | Fonctionne en silo et demande beaucoup de saisie. | Le calendrier est préparé à partir du modèle, de l'année, du kilométrage et de l'usage. |
| Assistant IA généraliste | Ne possède pas les données fiables et structurées du voyage. | L'IA travaille sur des données vérifiées provenant des API, fabricants et profils utilisateurs. |

| **Positionnement souhaité** Une plateforme chaleureuse, pratique et accessible, centrée sur le plaisir de voyager. La technologie doit rester en arrière-plan : l'utilisateur doit sentir qu'il est accompagné, et non qu'il configure un système complexe. |
| --- |

# 4. Publics cibles et personas

Le produit vise un grand public suffisamment large pour soutenir une croissance organique, tout en offrant une personnalisation profonde. Les camping-caristes forment le premier noyau à forte valeur récurrente; les voyageurs en automobile élargissent ensuite le marché.

| **Persona** | **Besoins dominants** |
| --- | --- |
| P1 — Propriétaire de camping-car régulier | Effectue plusieurs sorties par année. Veut planifier ses haltes, réduire ses coûts, respecter les contraintes du véhicule et suivre son entretien. |
| P2 — Famille en voyage routier | Voyage avec de jeunes enfants. Cherche des pauses, activités, restaurants et hébergements adaptés à l'âge, au budget et à la météo. |
| P3 — Couple de voyageurs expérimentés | Dispose de plus de temps, aime découvrir des routes panoramiques et souhaite conserver un historique détaillé de ses voyages et de son véhicule. |
| P4 — Voyageur occasionnel en automobile | Part une ou deux fois par année, mais veut préparer efficacement un déplacement important et est sensible aux économies de carburant. |
| P5 — Foyer possédant plusieurs véhicules | Souhaite enregistrer une voiture, un VUS et un camping-car, puis choisir le véhicule approprié pour chaque voyage. |
| P6 — Nouvel acheteur de camping-car | Connaît mal les dimensions, l'entretien, l'autonomie et les bonnes pratiques. Recherche un accompagnement simple et rassurant. |

# 5. Problèmes à résoudre

Les informations nécessaires à un voyage sont dispersées entre cartes, météo, sites touristiques, prix de carburant, manuels et forums.

Les itinéraires génériques ne tiennent pas suffisamment compte des caractéristiques réelles du véhicule.

Le coût de carburant est difficile à estimer correctement et les meilleurs arrêts de ravitaillement ne sont pas évidents.

Les voyageurs reçoivent trop de suggestions génériques et peu de recommandations vraiment adaptées à leur groupe.

Les propriétaires de camping-cars doivent gérer un entretien complexe lié au kilométrage, au temps, aux saisons et aux équipements habitables.

Les imprévus — panne, météo, fermeture, accident ou changement d'horaire — obligent à refaire la planification dans l'urgence.

Les utilisateurs oublient des réservations, documents, inspections ou préparatifs importants avant le départ.

Les dépenses réelles dépassent souvent les estimations parce que le budget n'est pas suivi de manière intégrée.

L'historique des entretiens, trajets, factures et souvenirs demeure fragmenté ou se perd.

Les applications existantes apprennent peu des choix acceptés ou refusés au fil des voyages.

# 6. Principes directeurs du produit

| **Principe** | **Application au produit** |
| --- | --- |
| Personnalisation utile | Chaque recommandation doit pouvoir expliquer pourquoi elle convient à l'utilisateur. |
| Données avant génération | L'IA ne doit pas inventer les spécifications, prix, horaires ou règles routières. Elle interprète des données structurées et datées. |
| Calculs déterministes | Les coûts, distances, autonomies, échéances et contraintes sont calculés par le système, non improvisés par un modèle génératif. |
| Progressivité | Le premier usage doit être simple; les fonctions avancées apparaissent lorsque le profil s'enrichit. |
| Valeur récurrente | L'application doit rester utile entre les voyages grâce à l'entretien, aux idées de sorties, à la préparation et à l'historique. |
| Confiance et transparence | Afficher la source, la date, le niveau de confiance et les hypothèses lorsque l'information peut varier. |
| Mobile d'abord | Les interactions essentielles doivent être confortables sur téléphone, particulièrement en déplacement. |
| Sécurité routière | Les fonctions en conduite doivent être vocales et minimiser la manipulation de l'écran. |
| Adaptation locale | Prendre en charge le français et l'anglais, les unités canadiennes et américaines et les monnaies CAD/USD. |

# 7. Vue d'ensemble de l'expérience

Le parcours idéal se déroule comme une continuité, et non comme une suite d'outils indépendants.

| **Moment** | **Expérience attendue** |
| --- | --- |
| Entre les voyages | Le véhicule demeure suivi; l'application propose des entretiens, idées de sorties et préparatifs à venir. |
| Création du voyage | L'utilisateur choisit le véhicule, les voyageurs, la destination, les dates, le budget et le style de trajet. |
| Optimisation | Le système calcule route, carburant, arrêts, contraintes, météo, activités et coût prévisionnel. |
| Validation | L'utilisateur compare des scénarios — rapide, économique, panoramique, familial — puis ajuste les propositions. |
| Avant le départ | Une liste personnalisée vérifie entretien, documents, réservations, météo, autonomie et préparation. |
| Pendant le trajet | Le copilote surveille les changements et propose des ajustements sans surcharger l'utilisateur. |
| Sur place | Le guide répond à des demandes contextuelles : quoi faire maintenant, à proximité, avec ce groupe et cette météo. |
| Après le voyage | Le système consolide dépenses, kilomètres, entretiens, lieux visités et souvenirs. |

# 8. Profil utilisateur et style de voyage

La personnalisation doit partir d'un profil évolutif. L'utilisateur peut répondre à un questionnaire initial, puis l'application affine progressivement ce profil en observant les choix, sans exiger une configuration longue.

## 8.1 Informations du profil

Composition habituelle du groupe : adultes, enfants et tranches d'âge.

Animaux de compagnie et contraintes associées.

Budget et niveau de confort souhaité.

Préférences : plein air, culture, gastronomie, attractions, routes panoramiques, détente, activités gratuites, etc.

Tolérance aux détours, à la conduite quotidienne et aux départs matinaux ou tardifs.

Besoins d'accessibilité ou contraintes particulières.

Types d'hébergement et de restauration préférés.

Langues parlées et préférences de communication.

Éléments à éviter : foule, longues marches, routes étroites, activités coûteuses, etc.

## 8.2 Apprentissage progressif

Chaque proposition peut être acceptée, refusée, enregistrée ou notée. Ces signaux enrichissent le profil. Le système doit permettre à l'utilisateur de voir et corriger ce que l'application croit savoir, afin d'éviter une personnalisation opaque ou irréversible.

## 8.3 Mode « Surprends-moi »

Le produit pourra générer une mini-journée ou une escapade complète selon le temps disponible, le véhicule, la météo, le budget et le profil. Cette fonction doit être inspirante tout en restant vérifiable et modifiable.

# 9. Gestion des véhicules et base de données

Le véhicule est un objet central de l'expérience. L'application doit permettre d'enregistrer plusieurs véhicules, puis d'en sélectionner un pour chaque trajet. L'interface et les fonctions disponibles s'adaptent automatiquement au type de véhicule.

## 9.1 Types de véhicules

Automobile, VUS, camionnette et fourgonnette.

Camping-car de classe A, B ou C.

Caravane et caravane à sellette avec véhicule tracteur associé.

Véhicules à essence et diesel dès le départ; hybrides et électriques selon la disponibilité des données et la version du produit.

## 9.2 Données structurées du véhicule

| **Groupe de données** | **Exemples** |
| --- | --- |
| Identification | Fabricant, gamme, modèle, version, année, catégorie, pays/marché, photo et surnom. |
| Propulsion | Type de carburant, capacité du réservoir, consommation officielle et consommation réelle moyenne. |
| Dimensions | Longueur, largeur, hauteur, empattement, poids et capacités de charge ou de remorquage lorsque pertinentes. |
| Autonomie | Autonomie calculée, réserve minimale souhaitée et particularités de ravitaillement. |
| Camping-car | Réservoirs d'eau propre, eaux grises et eaux noires, propane, batterie auxiliaire, génératrice, branchement électrique et nombre de places. |
| Entretien | Kilométrage actuel, date de mise en service, calendrier recommandé, historique et composants remplacés. |
| Documents | Manuel, factures, garanties, assurances et photos facultatives. |

## 9.3 Constitution et mise à jour de la base

La base de véhicules pourra être enrichie par des agents automatisés, mais aucune donnée critique ne doit être publiée uniquement parce qu'une IA l'a générée. Le processus recherché comprend la découverte des modèles populaires, l'extraction à partir de sources officielles, la normalisation, la détection des doublons, la validation et la conservation de la provenance.

Prioriser les modèles populaires et récents en Amérique du Nord pour le lancement.

Conserver la source, la date de consultation et la version de chaque donnée.

Attribuer un niveau de confiance et signaler les valeurs estimées.

Permettre aux utilisateurs de proposer une correction, sans modification automatique de la donnée de référence.

Prévoir l'ajout annuel de nouveaux modèles et variantes.

Autoriser la saisie manuelle lorsqu'un véhicule n'existe pas encore dans le catalogue.

| **Atout stratégique** La base de connaissances véhicule — spécifications, entretien, contraintes, problèmes connus et accessoires populaires — peut devenir un avantage difficile à reproduire si elle est fiable, versionnée et constamment enrichie. |
| --- |

# 10. Entretien et carnet numérique

L'entretien est la principale source de valeur récurrente entre les voyages, particulièrement pour les camping-cars. Le système doit combiner les recommandations du fabricant, le kilométrage, le temps écoulé, les saisons, les équipements et l'historique réel.

## 10.1 Calendrier personnalisé

Échéances fondées sur le kilométrage, le temps ou le premier des deux critères atteint.

Tâches saisonnières : hivernisation, remise en service, inspections avant stockage et préparation du printemps.

Tâches propres à l'habitacle du camping-car : toiture, joints, plomberie, réservoirs, propane, batteries et génératrice.

Alertes calculées selon un voyage à venir : entretien recommandé avant un trajet de longue distance.

Possibilité de distinguer entretien obligatoire, recommandé, préventif et communautaire.

## 10.2 Carnet d'entretien

Enregistrer la date, le kilométrage, le fournisseur, le coût, les pièces, les notes et les photos de factures.

Joindre une intervention à une recommandation du calendrier.

Afficher l'historique chronologique et les prochains travaux.

Produire un dossier partageable lors de la revente du véhicule.

Permettre des rappels et la confirmation d'une tâche terminée.

Distinguer les données du châssis, du moteur, de la remorque et de l'espace habitable.

## 10.3 Connaissances communautaires

À terme, le calendrier pourra signaler les problèmes fréquemment rapportés pour un modèle ou un composant, avec prudence et sans présenter une expérience communautaire comme une consigne officielle. Les recommandations du fabricant demeurent clairement séparées des tendances observées.

# 11. Planification d'itinéraires et optimisation du carburant

Cette fonction constitue la fonctionnalité phare du produit. L'utilisateur indique un point de départ, une ou plusieurs destinations, les dates, le véhicule, le niveau de carburant actuel et ses préférences. Le système génère plusieurs scénarios comparables et calcule les coûts.

## 11.1 Options d'itinéraire

Le plus rapide.

Le plus économique.

Le plus panoramique.

Le plus adapté à une famille ou à des pauses fréquentes.

Le plus sécuritaire ou confortable pour un camping-car.

Un compromis personnalisable entre temps, coût et intérêt du trajet.

## 11.2 Calcul du carburant

Utiliser la distance, la consommation officielle ou réelle, le type de carburant, la capacité du réservoir et la réserve minimale.

Estimer le coût total en fonction des prix disponibles le long du trajet.

Recommander les arrêts de ravitaillement les plus économiques qui demeurent compatibles avec l'autonomie.

Comparer l'économie d'un détour au carburant supplémentaire et au temps perdu.

Afficher les hypothèses et la date des prix utilisés.

Réajuster les estimations à partir de la consommation réelle saisie après les voyages.

Prendre en charge litres, gallons, L/100 km, km/L et MPG selon le pays et les préférences.

## 11.3 Contraintes routières du véhicule

Hauteur, longueur, largeur, poids, restrictions de ponts ou de tunnels et routes inadaptées lorsque les données existent.

Rayon de virage, routes étroites, pentes et conditions difficiles comme critères avancés.

Compatibilité des stationnements, haltes et campings avec les dimensions du véhicule.

Avertissement clair lorsque les données de restriction sont incomplètes ou non garanties.

## 11.4 Comparaison et explication

Le système doit expliquer les différences entre les scénarios : temps ajouté, coût économisé, nombre de pauses, intérêt touristique et niveau de confiance. L'utilisateur garde le contrôle et peut verrouiller une étape, supprimer une suggestion ou imposer un arrêt.

| **Exemple de valeur** « Faire le plein dans 42 km plutôt qu'à la prochaine sortie devrait réduire le coût prévu de 18 $, sans détour important et en conservant une réserve de sécurité. » |
| --- |

# 12. Découverte d'activités et guide touristique intelligent

Le produit doit pouvoir répondre autant à une planification à l'avance qu'à une question immédiate : « Je passe à Bromont, qu'est-ce qui vaut la peine? » La réponse ne doit pas être une liste générique, mais une sélection adaptée au contexte.

## 12.1 Sources de personnalisation

Lieu actuel ou étapes du trajet.

Temps réellement disponible.

Composition du groupe et âge des enfants.

Budget, météo, saison et heures d'ouverture.

Préférences et exclusions du profil.

Temps de détour et compatibilité avec le véhicule.

Popularité, qualité, accessibilité et niveau de foule lorsque les données le permettent.

## 12.2 Types de suggestions

Attractions familiales, musées, parcs, plages, randonnées et activités intérieures.

Restaurants, marchés, cafés et produits locaux.

Pauses courtes utiles aux enfants ou aux animaux.

Activités gratuites ou à faible coût.

Événements ponctuels et activités ouvertes au moment du passage.

Routes panoramiques, points de vue et arrêts photographiques.

Suggestions de remplacement lorsque la météo ou les horaires changent.

## 12.3 Questions conversationnelles

« J'ai deux heures devant moi; que devrais-je faire ici? »

« Trouve une activité intérieure pour deux enfants de moins de dix ans. »

« Qu'est-ce qui est gratuit et ouvert aujourd'hui? »

« Propose une pause agréable dans les trente prochaines minutes. »

« Crée une journée surprise sous un budget donné. »

# 13. Assistant proactif avant et pendant le voyage

L'assistant ne doit pas uniquement répondre aux demandes. Avec l'autorisation de l'utilisateur, il surveille les éléments pertinents et signale les changements qui justifient une action.

## 13.1 Avant le départ

Prévisions météo et conséquences sur l'itinéraire ou les activités.

Réservations manquantes, conflits d'horaire et échéances importantes.

Entretien à faire avant le kilométrage prévu.

Documents, assurance, immatriculation ou garantie à vérifier.

Liste de préparation adaptée au véhicule, à la durée, au groupe et à la saison.

État des batteries, pneus, réservoirs ou équipements lorsque les données sont saisies ou connectées.

## 13.2 Pendant le voyage

Accident, congestion, fermeture ou retard important sur le trajet.

Météo dangereuse ou changement qui rend une activité inadéquate.

Station de carburant plus avantageuse à portée réaliste.

Modification de l'heure d'arrivée et ajustement des réservations ou activités.

Proposition d'une pause lorsque la durée de conduite dépasse les préférences.

Rappel discret d'un arrêt obligatoire ou d'une autonomie restante faible.

## 13.3 Contrôle des notifications

L'utilisateur choisit ce qui peut déclencher une notification, la fréquence, les canaux et les périodes silencieuses. Les alertes proactives doivent être utiles, regroupées et faciles à désactiver.

# 14. Budget, dépenses et économies

Le budget de voyage relie la planification à la réalité financière. Il doit distinguer les estimations, les réservations et les dépenses réellement saisies.

Budget global et enveloppes par catégorie : carburant, hébergement, campings, repas, activités, péages et imprévus.

Estimation automatique fondée sur l'itinéraire et les choix proposés.

Comparaison de scénarios selon le coût total, pas uniquement la distance.

Saisie rapide des dépenses pendant le voyage, avec photo de reçu facultative.

Conversion CAD/USD et taux daté lorsque nécessaire.

Alerte lorsque le budget projeté risque d'être dépassé.

Résumé final : budget prévu, dépenses réelles, économies obtenues et principaux écarts.

# 15. Copilote conversationnel et vocal

Le copilote permet de dialoguer naturellement avec les données du voyage. Il doit pouvoir expliquer une proposition, modifier un itinéraire, trouver un lieu et résumer la situation. Sur la route, l'usage vocal est prioritaire pour réduire la manipulation du téléphone.

## 15.1 Capacités

Répondre aux questions sur le voyage, le véhicule, l'entretien et les lieux.

Exécuter des actions contrôlées : ajouter un arrêt, modifier un budget, enregistrer une dépense ou reporter une activité.

Conserver le contexte du voyage en cours sans mélanger les données de différents trajets.

Expliquer les sources et distinguer un fait vérifié d'une suggestion générée.

Proposer des réponses brèves en conduite et des détails complets à l'arrêt.

## 15.2 Sécurité d'usage

L'application ne doit pas encourager l'utilisateur à lire ou saisir du texte complexe pendant la conduite. Les actions sensibles exigent une confirmation simple et les informations critiques de navigation demeurent fournies par des services cartographiques appropriés.

# 16. Assistance en cas d'imprévu

En cas de panne ou de problème, l'application doit rassembler rapidement les options pertinentes selon la position, le véhicule et la nature du besoin. Elle ne remplace pas les services d'urgence ni un professionnel qualifié.

Garages, concessionnaires de la marque et services capables de prendre en charge le type de véhicule.

Remorquage compatible avec les dimensions et le poids du camping-car.

Stations-service, pneus, propane, réparation de VR et pièces.

Hôpitaux, cliniques, pharmacies ou services publics à proximité lorsque demandé.

Partage facultatif de la position et des informations du véhicule avec une personne de confiance.

Fiche d'urgence contenant les dimensions, le poids, l'assurance et les contacts choisis.

Création d'un plan de rechange : nouvelle étape, hébergement ou retour.

# 17. Journal et souvenirs de voyage

Le journal transforme les données du trajet en souvenir utile et encourage la fidélisation. Il doit être automatisable, mais entièrement contrôlé par l'utilisateur.

Carte des endroits visités et itinéraire réellement parcouru.

Photos, notes, activités, dépenses et événements marquants.

Résumé narratif généré à partir des éléments sélectionnés.

Album ou carnet partageable avec contrôle de confidentialité.

Statistiques personnelles : kilomètres, régions, économies, activités préférées et véhicules utilisés.

Possibilité de dupliquer un ancien voyage ou de le transformer en modèle.

# 18. Fonctions communautaires

Une communauté peut renforcer la qualité des connaissances et la rétention, surtout autour de modèles précis de camping-cars. Elle doit toutefois être ajoutée progressivement, avec modération et distinction claire entre données officielles et témoignages.

Groupes ou fils par fabricant, modèle ou type de véhicule.

Partage d'itinéraires, améliorations, accessoires, conseils et lieux appréciés.

Signalement de problèmes fréquents et solutions testées par les propriétaires.

Évaluation de la compatibilité réelle de campings, routes ou stationnements.

Questions-réponses entre membres avec votes et signalements.

Réputation, modération, règles de publication et mécanismes anti-abus.

Possibilité de rester entièrement privé sans participer à la communauté.

# 19. Expérience propre aux camping-cars

Lorsque le véhicule sélectionné est un camping-car ou une caravane, l'application active des capacités spécialisées. Cette adaptation est essentielle pour justifier un abonnement plus élevé et établir une communauté forte.

Recherche de campings selon les dimensions, services, branchements, animaux, dates et préférences.

Compatibilité des emplacements avec la longueur totale, les extensions et le véhicule tracteur.

Points de vidange, eau potable, propane, stationnement de nuit et services de VR.

Suivi des réservoirs et rappels de vidange ou de remplissage lorsque l'utilisateur saisit les niveaux.

Planification des besoins électriques, batteries, génératrice et branchements.

Restrictions de route, hauteur, poids et stationnement.

Préparation saisonnière, hivernisation et remise en service.

Entretien séparé du châssis et de l'espace habitable.

Conseils spécifiques au modèle, manuels et accessoires compatibles.

Calcul du coût de séjour incluant campings, propane et frais propres au VR.

# 20. Intégrations, données et intelligence artificielle

## 20.1 Familles d'intégrations

| **Domaine** | **Données ou fonctions attendues** |
| --- | --- |
| Cartographie et itinéraires | Routes, trafic, distances, durées, restrictions, géocodage et navigation. |
| Lieux et tourisme | Points d'intérêt, catégories, heures d'ouverture, coordonnées, évaluations et accessibilité. |
| Carburant et énergie | Prix par station, ville ou région; disponibilité et fraîcheur variables selon les marchés. |
| Météo | Prévisions, alertes, conditions routières et historique lorsque pertinent. |
| Fabricants et documentation | Spécifications, manuels, calendriers d'entretien, rappels et bulletins publics lorsque accessibles. |
| Campings et services VR | Disponibilité, caractéristiques, compatibilité et services spécialisés. |
| Paiements et abonnements | Gestion des forfaits, paiements récurrents, factures et essais. |
| Notifications | Courriel, notifications mobiles et éventuellement SMS selon le coût et la valeur. |
| Stockage de documents | Factures, manuels, assurances et photos avec contrôle d'accès. |

Une intégration directe avec une application grand public comme Duolingo n'est pas nécessaire pour produire des recommandations locales. Le besoin réel est de comprendre les préférences, la composition du groupe et le contexte. Des connexions à des services tiers pourront néanmoins être ajoutées lorsqu'elles apportent une donnée utile et autorisée.

## 20.2 Architecture multi-modèles IA

Le produit doit éviter une dépendance rigide à un fournisseur. Une couche interne d'orchestration doit permettre d'utiliser différents modèles — par exemple OpenAI, Anthropic ou Google — selon le coût, les capacités, la disponibilité et le type de tâche.

| **Type de tâche** | **Traitement privilégié** |
| --- | --- |
| Calcul de coût, autonomie, échéance | Code classique et règles vérifiables. |
| Recherche de lieux ou itinéraires | API spécialisées; l'IA explique et personnalise les résultats. |
| Conversation et recommandations | Modèle génératif avec contexte limité aux données nécessaires. |
| Analyse de longs manuels | Modèle adapté aux documents, avec citations internes et extraction structurée. |
| Classification et résumé | Modèle économique ou traitement local lorsque pertinent. |
| Décision critique | Règle métier ou validation humaine; jamais une réponse non vérifiée du modèle seul. |

## 20.3 Gouvernance de la donnée

Enregistrer la source, la date de collecte, le territoire couvert et les conditions d'utilisation.

Ne pas contourner les règles d'accès ou licences des sites externes.

Mettre en cache seulement ce qui est autorisé et définir une durée de fraîcheur.

Détecter les conflits entre sources et afficher l'incertitude.

Séparer les données officielles, estimées, communautaires et saisies par l'utilisateur.

Prévoir des mécanismes de correction, retrait et audit.

# 21. Comptes, abonnement et administration

## 21.1 Compte utilisateur

Création de compte, connexion sécurisée, récupération et gestion du profil.

Plusieurs véhicules par compte et plusieurs voyageurs ou profils familiaux.

Voyages enregistrés, modèles réutilisables et historique.

Paramètres d'unités, langue, monnaie, notifications et confidentialité.

Export et suppression des données personnelles.

Possibilité future de partager un véhicule ou un voyage avec un autre compte.

## 21.2 Abonnement

Le modèle recherché est principalement récurrent. Une formule gratuite ou d'essai peut démontrer la valeur; les capacités à forte valeur — plusieurs véhicules, entretien avancé, optimisation complète, assistant proactif, documents et journal — peuvent appartenir aux forfaits payants. Le prix exact sera validé ultérieurement.

## 21.3 Administration

Gestion des utilisateurs, forfaits, paiements, essais et remboursements autorisés.

Gestion du catalogue de véhicules et validation des données importées.

Gestion des sources, dates de synchronisation, erreurs et niveaux de confiance.

Modération des contenus communautaires et traitement des signalements.

Suivi des coûts d'API, quotas, performances et incidents.

Gestion éditoriale des catégories, recommandations mises en avant et messages importants.

Journal d'audit pour les modifications sensibles.

# 22. Sécurité, vie privée et qualité

Collecter seulement les données nécessaires et obtenir un consentement clair pour la localisation et la personnalisation.

Chiffrer les communications et protéger les secrets d'API.

Limiter l'accès aux documents, voyages, positions et véhicules au propriétaire et aux personnes autorisées.

Offrir une suppression et un export compréhensibles.

Éviter d'utiliser les conversations privées pour entraîner des modèles externes lorsque les options contractuelles permettent de l'exclure.

Appliquer des limites, journaux et alertes contre les abus et les dépenses d'API incontrôlées.

Afficher des avertissements pour les données susceptibles d'être incomplètes : restrictions routières, prix, horaires, entretien ou urgence.

Tester l'accessibilité, le français, l'anglais, les formats de date et les unités.

Prévoir un fonctionnement dégradé lorsque certaines API sont indisponibles.

Conserver une séparation stricte entre conseils généraux et recommandations qui exigent un professionnel.

# 23. Versions produit proposées

Ces versions expriment une progression fonctionnelle, non une séquence technique détaillée. La feuille de route distincte découpera chaque version en petites étapes Cursor.

| **Version** | **Portée fonctionnelle** |
| --- | --- |
| MVP — v1.0 | Compte, profils de voyage, plusieurs véhicules, catalogue initial, création d'itinéraire, calcul de carburant, comparaison de scénarios, recommandations de lieux, budget estimatif et historique de base. |
| v1.5 — Fidélisation | Calendrier d'entretien, carnet numérique, rappels, documents, consommation réelle, listes pré-départ, notifications et amélioration du profil. |
| v2.0 — Compagnon proactif | Copilote conversationnel, alertes contextuelles, ajustements en temps réel, activités dynamiques, saisie des dépenses et journal automatique. |
| v2.5 — Camping-car avancé | Compatibilité détaillée des campings et routes, eau/vidange/propane, énergie, châssis/habitacle, données par modèle et communauté spécialisée. |
| v3.0 — Écosystème | Partage familial, communauté étendue, modèles de voyages, intégrations additionnelles, recommandations prédictives et expansion géographique. |

| **Règle de lancement** Le MVP doit déjà résoudre un problème complet : sélectionner son véhicule, créer un trajet, comprendre le coût de carburant et recevoir des suggestions adaptées. Les fonctions futures enrichissent cette boucle sans rendre le premier lancement dépendant de tout le projet. |
| --- |

# 24. Modèle économique et indicateurs de succès

## 24.1 Hypothèse de monétisation

Le modèle privilégié est un abonnement mensuel ou annuel, possiblement complété par une formule gratuite limitée ou un achat ponctuel pour un voyage avancé. L'abonnement doit être justifié par les fonctions récurrentes : entretien, alertes, données du véhicule, profil évolutif, historique et accompagnement proactif.

L'objectif commercial initial évoqué est d'atteindre environ 1 000 $ de revenus mensuels récurrents. Cet objectif devra être traduit en scénarios de prix, taux de conversion, coûts d'API et nombre d'abonnés lors du plan d'affaires.

## 24.2 Indicateurs produit

Nombre de comptes ayant enregistré au moins un véhicule.

Pourcentage d'utilisateurs qui complètent un premier itinéraire.

Nombre de voyages créés, sauvegardés et réellement utilisés.

Économies estimées ou dépenses mieux prévues grâce au produit.

Taux d'activation des rappels d'entretien et tâches complétées.

Fréquence de retour entre les voyages.

Taux d'acceptation ou de refus des recommandations.

Conversion essai/gratuit vers payant et rétention mensuelle.

Coût moyen d'API par utilisateur actif et marge par forfait.

Qualité perçue des données véhicule, itinéraire et lieux.

# 25. Limites et questions à trancher

| **Sujet** | **Question** |
| --- | --- |
| Territoire de lancement | Québec seulement, Canada, ou Canada et États-Unis dès le départ? |
| Noyau initial | Prioriser exclusivement les camping-cars pour établir la valeur, ou lancer simultanément l'automobile? |
| Catalogue | Combien de marques, années et modèles doivent être validés avant le lancement? |
| Prix du carburant | Quelles sources offrent la couverture, les droits d'utilisation et la fréquence nécessaires? |
| Navigation | L'application fournit-elle uniquement une planification ou également une navigation étape par étape? |
| Abonnement | Forfait unique, niveaux, annuel, famille, paiement par voyage ou combinaison? |
| Données communautaires | À quelle version ouvrir les contributions et quel niveau de modération financer? |
| Documents fabricants | Quelles licences permettent d'indexer ou résumer les manuels? |
| Localisation en temps réel | Quelle précision conserver, pendant combien de temps et avec quel consentement? |
| Application mobile | Application Web progressive au lancement ou application mobile native plus tôt? |
| Véhicules électriques | Les intégrer dès le MVP ou après stabilisation du moteur de carburant? |
| Nom et marque | Le nom commercial, le domaine et l'identité visuelle restent à définir. |

# Annexe A — Registre des exigences produit

Les identifiants ci-dessous serviront de référence dans le cahier des charges, la feuille de route, les tests et les prompts Cursor. « MVP » signifie nécessaire au premier produit commercial cohérent; les versions suivantes indiquent une cible fonctionnelle proposée, non un engagement de calendrier.

## A.1 Général

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| GEN-001 | La plateforme doit offrir une expérience adaptée au type de véhicule sélectionné. | MVP |
| GEN-002 | L'interface doit être disponible en français et être préparée pour l'anglais. | MVP |
| GEN-003 | Le produit doit prendre en charge les unités canadiennes et américaines. | MVP |
| GEN-004 | Les principales fonctions doivent être utilisables confortablement sur téléphone. | MVP |
| GEN-005 | Les faits variables doivent afficher leur date, leur source ou leur niveau de confiance lorsque pertinent. | MVP |

## A.2 Comptes

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| ACC-001 | Un utilisateur doit pouvoir créer, sécuriser et récupérer son compte. | MVP |
| ACC-002 | Un utilisateur doit pouvoir modifier son profil, sa langue, ses unités, sa monnaie et ses notifications. | MVP |
| ACC-003 | Un compte doit pouvoir contenir plusieurs véhicules. | MVP |
| ACC-004 | Un compte doit pouvoir enregistrer la composition habituelle du groupe de voyageurs. | MVP |
| ACC-005 | Un utilisateur doit pouvoir exporter et supprimer ses données personnelles. | v1.5 |
| ACC-006 | Un voyage ou véhicule pourra être partagé avec d'autres comptes autorisés. | v3.0 |

## A.3 Profil et personnalisation

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| PRO-001 | Le profil doit enregistrer les intérêts, contraintes, budgets et éléments à éviter. | MVP |
| PRO-002 | Le système doit adapter ses recommandations à l'âge des enfants et à la composition du groupe. | MVP |
| PRO-003 | L'utilisateur doit pouvoir accepter, refuser, enregistrer ou noter une recommandation. | v1.5 |
| PRO-004 | L'utilisateur doit pouvoir consulter et corriger les préférences déduites par le système. | v1.5 |
| PRO-005 | Le produit doit pouvoir générer une escapade ou une journée en mode « Surprends-moi ». | v2.0 |

## A.4 Véhicules et catalogue

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| VEH-001 | L'utilisateur doit choisir une catégorie, une marque, un modèle, une version et une année. | MVP |
| VEH-002 | Un véhicule absent du catalogue doit pouvoir être ajouté manuellement. | MVP |
| VEH-003 | Le profil véhicule doit contenir carburant, capacité de réservoir et consommation. | MVP |
| VEH-004 | Le profil véhicule doit contenir les dimensions et poids utiles aux contraintes de trajet. | MVP |
| VEH-005 | Le kilométrage actuel doit pouvoir être saisi et mis à jour. | MVP |
| VEH-006 | La consommation réelle doit pouvoir remplacer ou ajuster la valeur officielle. | v1.5 |
| VEH-007 | Les camping-cars doivent disposer de champs propres à l'eau, au propane, à l'énergie et à l'habitacle. | v2.5 |
| VEH-008 | Chaque donnée du catalogue doit conserver une provenance et une date de validation. | MVP |
| VEH-009 | Les imports automatisés doivent passer par une validation avant publication. | MVP |
| VEH-010 | Les utilisateurs doivent pouvoir signaler une erreur de spécification. | v1.5 |

## A.5 Entretien

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| MNT-001 | Le système doit générer des échéances d'entretien selon kilométrage et temps. | v1.5 |
| MNT-002 | Le calendrier doit intégrer les tâches saisonnières propres aux camping-cars. | v1.5 |
| MNT-003 | Un voyage à venir doit pouvoir déclencher une recommandation d'entretien préalable. | v1.5 |
| MNT-004 | L'utilisateur doit pouvoir enregistrer une intervention, son coût, son kilométrage et ses notes. | v1.5 |
| MNT-005 | L'utilisateur doit pouvoir joindre des photos ou factures à une intervention. | v1.5 |
| MNT-006 | Le système doit produire un historique partageable pour la revente. | v2.0 |
| MNT-007 | Les conseils officiels et les tendances communautaires doivent être distingués visuellement. | v2.5 |

## A.6 Itinéraires et carburant

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| RTE-001 | L'utilisateur doit créer un voyage avec départ, destination, dates et véhicule. | MVP |
| RTE-002 | Le voyage doit accepter plusieurs étapes et arrêts imposés. | MVP |
| RTE-003 | Le produit doit comparer au moins des scénarios rapide et économique. | MVP |
| RTE-004 | Le produit doit estimer la quantité et le coût de carburant. | MVP |
| RTE-005 | Le niveau de carburant initial et une réserve minimale doivent pouvoir être saisis. | MVP |
| RTE-006 | Le système doit proposer des arrêts de ravitaillement compatibles avec l'autonomie. | MVP |
| RTE-007 | Le système doit comparer l'économie d'un prix inférieur au coût et au temps du détour. | MVP |
| RTE-008 | Les prix utilisés doivent comporter une date et une couverture géographique. | MVP |
| RTE-009 | L'utilisateur doit pouvoir verrouiller, supprimer ou déplacer une étape proposée. | MVP |
| RTE-010 | Le système doit tenir compte des dimensions et restrictions connues du véhicule. | v2.5 |
| RTE-011 | Le produit doit afficher une mise en garde lorsque les restrictions de route ne sont pas garanties. | v2.5 |
| RTE-012 | L'estimation doit apprendre de la consommation réelle après les trajets. | v1.5 |
| RTE-013 | Un itinéraire panoramique ou familial doit pouvoir être proposé. | v2.0 |

## A.7 Découverte

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| DIS-001 | Le produit doit rechercher des activités et lieux proches d'une étape ou du trajet. | MVP |
| DIS-002 | Les suggestions doivent tenir compte du groupe, du budget, du temps et des préférences. | MVP |
| DIS-003 | Les heures d'ouverture et la météo doivent être considérées lorsqu'elles sont disponibles. | MVP |
| DIS-004 | Le système doit pouvoir suggérer une pause dans une fenêtre de temps ou de distance. | v2.0 |
| DIS-005 | Le système doit proposer des activités de remplacement lors d'un changement de météo. | v2.0 |
| DIS-006 | L'utilisateur doit pouvoir demander des options gratuites ou à faible coût. | MVP |
| DIS-007 | Le système doit expliquer pourquoi une suggestion correspond au profil. | MVP |

## A.8 Assistant proactif

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| ALT-001 | L'utilisateur doit pouvoir recevoir une liste de préparation personnalisée avant le départ. | v1.5 |
| ALT-002 | Le système doit signaler une météo ou un changement important affectant le voyage. | v2.0 |
| ALT-003 | Le système doit pouvoir proposer un détour en cas de congestion ou fermeture. | v2.0 |
| ALT-004 | Une station plus économique à portée doit pouvoir déclencher une suggestion. | v2.0 |
| ALT-005 | L'utilisateur doit contrôler les types, canaux et périodes des notifications. | v1.5 |
| ALT-006 | Les notifications répétitives doivent être regroupées pour éviter la surcharge. | v2.0 |

## A.9 Budget

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| BUD-001 | Un voyage doit accepter un budget global et des catégories de dépenses. | MVP |
| BUD-002 | Le système doit produire un budget estimatif à partir du trajet et des choix. | MVP |
| BUD-003 | L'utilisateur doit pouvoir enregistrer rapidement une dépense réelle. | v2.0 |
| BUD-004 | Le produit doit comparer budget prévu et dépenses réelles. | v2.0 |
| BUD-005 | Le produit doit prendre en charge CAD et USD avec un taux daté. | v1.5 |
| BUD-006 | Une alerte doit signaler un dépassement prévisionnel du budget. | v2.0 |

## A.10 Intelligence artificielle et copilote

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| AI-001 | Le copilote doit répondre à partir des données du voyage et du véhicule en cours. | v2.0 |
| AI-002 | Le copilote doit pouvoir ajouter ou modifier un arrêt après confirmation. | v2.0 |
| AI-003 | Les réponses doivent distinguer faits sourcés, calculs et suggestions. | v2.0 |
| AI-004 | L'application doit utiliser une couche d'abstraction permettant plusieurs fournisseurs IA. | MVP |
| AI-005 | Les calculs critiques ne doivent pas dépendre d'une réponse générative non vérifiée. | MVP |
| AI-006 | Le mode vocal doit privilégier des réponses brèves et des actions simples en conduite. | v2.0 |
| AI-007 | Le contexte transmis à un fournisseur IA doit être limité aux données nécessaires. | MVP |

## A.11 Imprévus

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| EMG-001 | L'application doit afficher les services pertinents proches selon le type de véhicule. | v2.0 |
| EMG-002 | Les services de remorquage proposés doivent être compatibles avec le véhicule lorsque l'information existe. | v2.5 |
| EMG-003 | L'utilisateur doit pouvoir préparer une fiche d'urgence du véhicule. | v2.0 |
| EMG-004 | La position et la fiche pourront être partagées avec un contact autorisé. | v2.0 |
| EMG-005 | L'application doit préciser qu'elle ne remplace pas les services d'urgence ou un professionnel. | v2.0 |

## A.12 Journal

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| JRN-001 | Le produit doit conserver l'historique des voyages et véhicules utilisés. | MVP |
| JRN-002 | Le journal doit pouvoir regrouper lieux, photos, notes et dépenses. | v2.0 |
| JRN-003 | Un résumé partageable doit être généré uniquement avec les éléments choisis par l'utilisateur. | v2.0 |
| JRN-004 | Un ancien voyage doit pouvoir être dupliqué comme modèle. | v1.5 |

## A.13 Communauté

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| COM-001 | La communauté doit pouvoir être organisée par marque, modèle ou type de véhicule. | v2.5 |
| COM-002 | Les membres doivent pouvoir partager itinéraires, conseils et améliorations. | v2.5 |
| COM-003 | Les contenus communautaires doivent être modérés et signalables. | v2.5 |
| COM-004 | La participation communautaire doit demeurer facultative. | v2.5 |

## A.14 Camping-cars

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| RV-001 | Les campings doivent pouvoir être filtrés selon dimensions et services. | v2.5 |
| RV-002 | Les points d'eau, vidange, propane et services VR doivent pouvoir être recherchés. | v2.5 |
| RV-003 | Le produit doit séparer l'entretien du châssis et de l'espace habitable. | v1.5 |
| RV-004 | Le coût d'un voyage en VR doit inclure les dépenses propres au camping-car. | v2.5 |

## A.15 Administration

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| ADM-001 | Un administrateur doit gérer et valider le catalogue des véhicules. | MVP |
| ADM-002 | Un administrateur doit consulter les erreurs de synchronisation et la fraîcheur des données. | MVP |
| ADM-003 | Un administrateur doit suivre l'usage et le coût des API. | MVP |
| ADM-004 | Un journal d'audit doit couvrir les changements sensibles. | v1.5 |

## A.16 Abonnement

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| SUB-001 | Le système doit gérer un essai ou une formule gratuite et au moins un abonnement payant. | MVP |
| SUB-002 | Le système doit gérer paiement récurrent, renouvellement, annulation et factures. | MVP |
| SUB-003 | Les fonctionnalités doivent pouvoir être activées selon le forfait. | MVP |

## A.17 Sécurité

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| SEC-001 | Les communications doivent être chiffrées et les secrets d'API protégés. | MVP |
| SEC-002 | La localisation doit exiger un consentement explicite et révocable. | MVP |
| SEC-003 | Les documents et voyages doivent être isolés par compte et autorisation. | MVP |
| SEC-004 | Le système doit appliquer des quotas et protections contre les abus d'API. | MVP |

## A.18 Exigences non fonctionnelles

| **ID** | **Exigence** | **Cible** |
| --- | --- | --- |
| NFR-001 | L'application doit fonctionner en mode dégradé si une source externe est indisponible. | v1.5 |
| NFR-002 | Les pages essentielles doivent viser une expérience rapide sur réseau mobile. | MVP |
| NFR-003 | L'interface doit respecter les pratiques d'accessibilité courantes. | MVP |
| NFR-004 | Les erreurs doivent être compréhensibles et proposer une action de reprise. | MVP |
| NFR-005 | Les sources et algorithmes critiques doivent être testables indépendamment du fournisseur IA. | MVP |

| **Fin du document** Cette version constitue la référence fonctionnelle initiale. Les décisions techniques, l'architecture détaillée, l'ordre des travaux et les prompts Cursor seront documentés séparément afin de conserver une distinction nette entre ce que le produit doit faire et la manière de le construire. |
| --- |

Document de référence produit  •  13 juillet 2026  •  Page