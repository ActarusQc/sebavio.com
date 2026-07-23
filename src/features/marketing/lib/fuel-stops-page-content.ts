/**
 * Contenu public de /planifier-arrets-carburant.
 * Angle : autonomie et arrêts de ravitaillement (distinct du coût total).
 */

export const FUEL_STOPS_PAGE = {
  meta: {
    title: "Planifier ses arrêts de carburant en voyage | Sebavia",
    description:
      "Prévoyez vos arrêts d’essence selon le trajet, le véhicule, le réservoir et l’autonomie estimée avec le planificateur Sebavia.",
  },
  hero: {
    eyebrow: "Ravitaillement et autonomie",
    title: "Planifiez vos arrêts de carburant pendant le voyage",
    body: "Sebavia s’appuie sur le trajet, le véhicule, le niveau initial et l’autonomie estimée pour aider à prévoir les moments où un ravitaillement pourrait être nécessaire.",
    primaryCta: { href: "/register", label: "Planifier mon voyage" },
    secondaryCta: {
      href: "/calculateur-cout-carburant-voyage",
      label: "Calculer mon coût de carburant",
    },
    featuresLink: {
      href: "/fonctionnalites#carburant",
      label: "Voir les fonctions carburant",
    },
  },
  distinction: {
    title: "Coût et autonomie : deux questions différentes",
    cost: {
      title: "Coût du carburant",
      items: [
        "Combien de litres seront probablement consommés",
        "Quel budget approximatif prévoir",
      ],
    },
    autonomy: {
      title: "Autonomie et arrêts",
      items: [
        "Jusqu’où le véhicule peut probablement se rendre",
        "Si un achat sera probablement nécessaire",
        "À quel moment du parcours prévoir cet achat",
        "Quelles stations-service peuvent être envisagées",
      ],
    },
    costLink: {
      href: "/calculateur-cout-carburant-voyage",
      label: "Voir comment le coût du carburant est estimé",
    },
  },
  autonomyFactors: {
    title: "Ce qui détermine l’autonomie",
    lead: "L’autonomie estimée combine les données du véhicule et du parcours — sans remplacer les conditions réelles de conduite.",
    items: [
      {
        title: "Capacité du réservoir",
        body: "La quantité maximale de carburant que le véhicule peut contenir.",
      },
      {
        title: "Niveau initial",
        body: "Plein, pourcentage ou litres personnalisés au départ, selon ce que vous indiquez.",
      },
      {
        title: "Consommation",
        body: "Les litres aux 100 kilomètres influencent la distance possible avec le carburant disponible.",
      },
      {
        title: "Parcours",
        body: "Distance totale, activités, étapes, détours et retour peuvent modifier les besoins de ravitaillement.",
      },
    ],
    realWorld:
      "Température, vitesse, vent, charge ou circulation peuvent faire varier l’autonomie réelle. Sebavia ne modélise pas automatiquement tous ces facteurs.",
  },
  process: {
    title: "Comment Sebavia prévoit un besoin de ravitaillement",
    steps: [
      "Sebavia utilise les données du véhicule (consommation, réservoir, type de carburant).",
      "Le système tient compte du carburant disponible au départ.",
      "La distance du parcours est évaluée, y compris étapes et retour selon la configuration.",
      "L’autonomie estimée est comparée aux portions du voyage.",
      "Un ou plusieurs arrêts de ravitaillement peuvent être proposés lorsque c’est utile.",
      "Vous confirmez les stations-service avant de partir.",
    ],
    note: "Prévoyez une marge raisonnable et confirmez les stations avant de partir, particulièrement dans les secteurs où les services sont plus espacés.",
  },
  initialLevel: {
    title: "Le carburant au départ change le premier arrêt",
    lead: "Le moment du premier arrêt de ravitaillement dépend du niveau initial du réservoir.",
    cases: [
      {
        title: "Départ avec le plein",
        body: "Un premier arrêt peut être nécessaire plus loin dans le trajet.",
      },
      {
        title: "Départ avec un réservoir partiel",
        body: "Un ravitaillement peut être nécessaire plus tôt.",
      },
      {
        title: "Plein effectué avant le départ",
        body: "La valeur du carburant consommé et les achats en route peuvent rester distincts dans l’estimation.",
      },
    ],
    costLink: {
      href: "/calculateur-cout-carburant-voyage#plein-initial",
      label: "Comprendre le plein initial et le coût estimé",
    },
  },
  detours: {
    title: "Les étapes et détours modifient les arrêts",
    lead: "Ajouter du contenu au voyage peut modifier la distance, l’autonomie restante, le moment du prochain achat et les stations envisageables.",
    examples: [
      "Ajouter une activité hors de la route principale",
      "Ajouter une nuitée ou une étape",
      "Modifier la destination",
      "Changer le trajet de retour",
    ],
    note: "Lorsque le parcours change, Sebavia peut recalculer les besoins de ravitaillement.",
    roadTripLink: {
      href: "/planificateur-road-trip-quebec",
      label: "Voir comment organiser un road trip complet",
    },
  },
  position: {
    title: "Une station sur la route, pas derrière vous",
    lead: "Sebavia cherche à proposer des options cohérentes avec la progression du parcours.",
    items: [
      "Station-service située devant sur le trajet, lorsque possible",
      "Distance raisonnable du parcours",
      "Détour limité",
      "Type de carburant pertinent",
      "Emplacement compatible avec l’autonomie estimée",
    ],
    note: "Les suggestions restent des propositions à confirmer : elles ne sont pas garanties parfaitement placées.",
  },
  priceVsPractical: {
    title: "Prix moins élevé ou arrêt plus pratique",
    lead: "L’objectif est d’intégrer le ravitaillement au voyage de façon pratique, et non de poursuivre uniquement le prix le plus bas.",
    items: [
      "Autonomie disponible",
      "Distance jusqu’à la station-service",
      "Détour et temps supplémentaire",
      "Type de carburant",
      "Prix estimé (non garanti)",
      "Disponibilité à confirmer",
      "Marge restante",
    ],
  },
  verify: {
    title: "Vérifiez toujours la station",
    lead: "Plusieurs informations peuvent changer avant votre arrivée.",
    items: [
      "Heures d’ouverture",
      "Fermeture temporaire",
      "Disponibilité du carburant",
      "Type de carburant",
      "Prix",
      "Accès à la station",
      "Travaux ou conditions saisonnières",
    ],
    note: "Confirmez les renseignements avant le départ ou à l’approche de l’arrêt. Sebavia n’est pas une source officielle.",
    termsLink: {
      href: "/conditions-utilisation",
      label: "Conditions d’utilisation",
    },
  },
  remote: {
    title: "Voyages dans les secteurs moins desservis",
    lead: "Sur de longs trajets entre régions, les services peuvent être plus espacés. Une vigilance supplémentaire est utile.",
    items: [
      "Vérifier les stations disponibles sur le parcours",
      "Prévoir une marge supplémentaire",
      "Éviter de dépendre d’une seule option",
      "Confirmer les heures",
      "Tenir compte du retour",
      "Ne pas ignorer un arrêt raisonnable",
    ],
  },
  example: {
    label: "Exemple conceptuel",
    disclaimer:
      "Illustration générique — aucune station réelle, aucun prix actuel, aucune recommandation garantie.",
    steps: [
      { label: "Départ", detail: "Niveau initial fictif" },
      { label: "Autonomie estimée", detail: "Portion de trajet conceptuelle" },
      { label: "Arrêt suggéré", detail: "Station-service fictive" },
      { label: "Marge restante", detail: "Marge raisonnable à conserver" },
      { label: "Destination", detail: "Poursuite du parcours" },
    ],
  },
  checklist: {
    title: "Avant chaque départ",
    items: [
      "Vérifier le niveau réel du réservoir",
      "Confirmer la consommation configurée",
      "Inclure le retour lorsque pertinent",
      "Ajouter les détours prévus",
      "Confirmer les stations-service",
      "Vérifier les heures d’ouverture",
      "Prévoir une solution de rechange",
      "Conserver une marge raisonnable",
      "Revérifier les conditions routières et météorologiques",
    ],
  },
  useCases: [
    {
      title: "Escapade avec un réservoir partiel",
      body: "Estimez si un arrêt de ravitaillement peut être requis plus tôt selon le niveau initial.",
    },
    {
      title: "Long road trip",
      body: "Plusieurs portions du parcours peuvent nécessiter différents arrêts carburant sur l’aller et le retour.",
    },
    {
      title: "Circuit de plusieurs jours",
      body: "Étapes, activités et trajets de retour peuvent modifier le moment et le nombre d’arrêts utiles.",
    },
    {
      title: "Changement de véhicule",
      body: "Une autre consommation ou un autre réservoir produit une autonomie différente : relancez l’estimation après le changement.",
    },
  ],
  plans: {
    title: "Quel forfait pour planifier vos arrêts?",
    lead: "Découverte offre un aperçu limité. Le Pass 30 jours permet de préparer un voyage complet pendant sa durée. Sebavia Plus fournit l’accès selon le catalogue actif. Les détails officiels sont sur la page Tarifs.",
    cta: { href: "/pricing", label: "Comparer les forfaits" },
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "Comment savoir si je dois prévoir un arrêt d’essence?",
        a: "Sebavia compare l’autonomie estimée du véhicule aux portions du parcours. Si un ravitaillement est utile, un ou plusieurs arrêts carburant peuvent être proposés. Confirmez toujours avant de partir.",
      },
      {
        q: "Comment l’autonomie d’un véhicule est-elle estimée?",
        a: "À partir de la capacité du réservoir, du niveau initial et de la consommation en litres aux 100 kilomètres, appliqués à la distance du trajet configuré.",
      },
      {
        q: "Le carburant présent au départ est-il pris en compte?",
        a: "Oui. Vous pouvez indiquer un plein, un pourcentage ou des litres. Le niveau initial influence le moment du premier arrêt suggéré.",
      },
      {
        q: "Sebavia peut-il proposer plusieurs arrêts de ravitaillement?",
        a: "Oui, selon la longueur du parcours, le niveau initial et le retour. Le nombre d’arrêts dépend de votre voyage configuré.",
      },
      {
        q: "Les activités et détours changent-ils les arrêts?",
        a: "Oui. Lorsqu’ils allongent ou modifient le parcours, Sebavia peut recalculer l’autonomie restante et les arrêts utiles.",
      },
      {
        q: "Les stations proposées sont-elles garanties ouvertes?",
        a: "Non. Les heures, fermetures, prix et disponibilités peuvent changer. Vérifiez toujours avant de compter sur une station-service.",
      },
      {
        q: "Sebavia trouve-t-il toujours la station la moins chère?",
        a: "Non. L’objectif est d’intégrer un arrêt pratique au parcours. Un prix estimé peut être indiqué, mais ce n’est ni une garantie ni le seul critère.",
      },
      {
        q: "Quel forfait donne accès à la planification complète?",
        a: "La planification complète s’inscrit dans la préparation du voyage selon le forfait. Consultez la page Tarifs pour Découverte, Pass 30 jours et Sebavia Plus.",
      },
    ],
    moreHref: "/faq",
    moreLabel: "Voir la FAQ générale",
  },
  finalCta: {
    title: "Prévoyez vos arrêts avant de prendre la route",
    body: "Créez votre voyage, sélectionnez votre véhicule et obtenez une estimation des besoins de ravitaillement intégrée au parcours.",
    primary: { href: "/register", label: "Planifier mon voyage" },
    secondary: { href: "/pricing", label: "Comparer les forfaits" },
    costLink: {
      href: "/calculateur-cout-carburant-voyage",
      label: "Estimer aussi le coût du carburant",
    },
  },
} as const;
