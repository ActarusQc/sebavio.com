/**
 * Contenu public de /calculateur-cout-carburant-voyage.
 * Angle : estimation du coût/consommation — distinct des arrêts de ravitaillement.
 */

export const FUEL_COST_PAGE = {
  meta: {
    title: "Calculateur de coût de carburant pour un voyage | Sebavia",
    description:
      "Estimez le coût du carburant de votre voyage selon la distance, la consommation, le véhicule, l’aller-retour et les étapes du trajet.",
  },
  hero: {
    eyebrow: "Budget essence et carburant",
    title: "Calculateur de coût de carburant pour votre voyage",
    body: "Sebavia estime la consommation et le budget de carburant à partir de votre trajet et de votre véhicule, puis met à jour le résultat lorsque le voyage change.",
    primaryCta: { href: "/register", label: "Estimer mon voyage" },
    secondaryCta: {
      href: "/fonctionnalites#carburant",
      label: "Voir les fonctions carburant",
    },
    roadTripLink: {
      href: "/planificateur-road-trip-quebec",
      label: "Planifier un road trip au Québec",
    },
  },
  factors: {
    title: "Ce qui influence le coût du carburant",
    lead: "Plusieurs éléments se croisent pour former une estimation utile — pas seulement une distance et un prix au litre.",
    items: [
      {
        title: "Distance du voyage",
        body: "La distance totale peut inclure l’aller, le retour, les étapes, les activités et les détours ajoutés au parcours.",
      },
      {
        title: "Consommation du véhicule",
        body: "Sebavia utilise des litres aux 100 kilomètres. Un véhicule consommant davantage de litres aux 100 kilomètres nécessite plus de carburant pour la même distance.",
      },
      {
        title: "Prix du carburant",
        body: "Le prix par litre peut varier selon le moment, la région, le type de carburant et la station. L’estimation n’est pas un prix garanti.",
      },
      {
        title: "Contenu initial du réservoir",
        body: "Le carburant déjà présent au départ peut être distingué des achats à faire pendant le trajet.",
      },
      {
        title: "Type de trajet",
        body: "Aller seulement, aller-retour ou circuit avec plusieurs étapes : chaque structure change la distance et le budget.",
      },
    ],
  },
  formula: {
    title: "La formule de base",
    lead: "Pour comprendre l’ordre de grandeur, la formule générale est simple :",
    liters: "Litres estimés = distance (km) × consommation (L/100 km) ÷ 100",
    cost: "Coût estimé = litres nécessaires × prix estimé par litre",
    note: "Sebavia va plus loin en tenant compte, selon le voyage configuré, des étapes, du retour, des activités, du véhicule, du carburant initial, des achats nécessaires en route et des mises à jour du parcours.",
  },
  example: {
    label: "Exemple de calcul",
    disclaimer:
      "Valeurs fictives utilisées à des fins d’illustration. Le prix réel du carburant varie.",
    distanceKm: 600,
    consumption: 8,
    pricePerLiter: "1,70",
    liters: 48,
    cost: "81,60",
    steps: [
      "600 km × 8 L/100 km ÷ 100 = 48 litres",
      "48 L × 1,70 $/L = 81,60 $",
    ],
  },
  variance: {
    title: "Pourquoi le coût réel peut changer",
    lead: "Sebavia produit une estimation à partir des données du voyage et du véhicule. Les conditions réelles de conduite peuvent modifier la consommation.",
    considered: {
      title: "Ce que Sebavia prend en compte",
      items: [
        "Distance du parcours (étapes et activités incluses)",
        "Consommation et type de carburant du véhicule",
        "Aller-retour, selon votre configuration",
        "Niveau ou plein initial",
        "Prix estimé par litre",
        "Achats nécessaires pendant le trajet",
      ],
    },
    realWorld: {
      title: "Ce qui peut encore faire varier le résultat",
      items: [
        "Circulation, vitesse et conduite urbaine",
        "Température, vent, charge ou remorque",
        "Pneus, climatisation ou chauffage",
        "Consommation réelle différente de la valeur déclarée",
        "Changement du prix à la pompe",
      ],
    },
  },
  initialTank: {
    title: "Le plein initial n’est pas toujours un achat du voyage",
    lead: "Si votre réservoir contient déjà du carburant, la quantité consommée pendant le voyage et le montant acheté en route ne sont pas nécessairement identiques.",
    items: [
      {
        term: "Carburant initial",
        definition:
          "Niveau au départ : plein, pourcentage ou litres personnalisés, selon ce que vous indiquez.",
      },
      {
        term: "Volume total",
        definition:
          "Litres estimés consommés sur l’ensemble du parcours configuré.",
      },
      {
        term: "Coût estimé",
        definition:
          "Valeur estimée du carburant consommé sur le parcours. Selon le niveau initial, ce montant peut différer des achats effectués en route.",
      },
      {
        term: "Prix essence",
        definition:
          "Prix estimé par litre utilisé pour le calcul — variable et non garanti.",
      },
    ],
  },
  tripTypes: {
    title: "Aller simple, aller-retour et circuit",
    items: [
      {
        title: "Aller simple",
        body: "La distance jusqu’à la destination, avec les étapes et activités déjà ajoutées.",
      },
      {
        title: "Aller-retour",
        body: "Ajoute le trajet de retour. Le retour peut être préparé distinctement selon votre parcours.",
      },
      {
        title: "Circuit",
        body: "Plusieurs étapes et activités augmentent la distance totale et, donc, le budget carburant.",
      },
    ],
    note: "Lorsque vous modifiez le parcours, Sebavia peut recalculer l’estimation.",
  },
  vehicle: {
    title: "Votre véhicule fait une différence",
    lead: "L’estimation s’appuie sur les données du véhicule utilisées dans Sebavia.",
    items: [
      "Consommation en litres aux 100 kilomètres",
      "Type de carburant",
      "Capacité du réservoir",
      "Véhicule enregistré ou configuration choisie pour le voyage",
    ],
    note: "Vérifiez les données de votre véhicule et ajustez-les au besoin selon votre consommation réelle. Sebavia ne possède pas les spécifications exactes de tous les véhicules.",
  },
  updates: {
    title: "Mise à jour lorsque le voyage change",
    lead: "Le budget carburant n’est pas figé : il suit le parcours que vous construisez.",
    items: [
      "Ajout d’une activité, d’une étape ou d’un détour",
      "Modification de la destination",
      "Préparation du retour",
      "Changement de véhicule ou de consommation",
      "Ajustement du niveau initial de carburant",
    ],
    roadTripLink: {
      href: "/planificateur-road-trip-quebec",
      label: "Voir comment organiser un road trip complet",
    },
  },
  comparison: {
    title: "Plus qu’une multiplication",
    manual: {
      title: "Calcul manuel",
      items: [
        "Une distance",
        "Une consommation",
        "Un prix",
        "Un résultat isolé",
      ],
    },
    sebavia: {
      title: "Sebavia",
      items: [
        "Trajet complet avec étapes et activités",
        "Aller-retour selon votre configuration",
        "Véhicule et carburant initial",
        "Achats nécessaires et estimation mise à jour",
        "Voyage sauvegardé dans votre espace",
      ],
    },
  },
  costLabels: {
    title: "Coût total ou argent à prévoir",
    lead: "Dans l’estimation carburant, les libellés aident à distinguer ce qui est consommé et ce qui peut être acheté.",
    items: [
      {
        term: "Volume total",
        definition: "Les litres estimés consommés pour le parcours.",
      },
      {
        term: "Coût estimé",
        definition:
          "Valeur estimée du carburant consommé sur le parcours (libellé principal de l’estimation). Ce n’est pas un prix à la pompe garanti, et ce montant peut différer des seuls achats en route.",
      },
      {
        term: "Carburant initial",
        definition:
          "Ce qui est déjà dans le réservoir au départ — distinct des achats en route.",
      },
      {
        term: "Prix essence",
        definition: "Prix estimé par litre utilisé pour le calcul.",
      },
    ],
  },
  stopsSummary: {
    title: "Coût et arrêts : deux questions différentes",
    lead: "Le coût répond surtout à « combien de carburant sera consommé? ». L’autonomie répond à « quand faudra-t-il en acheter? ».",
    items: [
      "Capacité du réservoir et consommation",
      "Distance et niveau initial",
      "Achats possibles pendant le trajet",
    ],
    note: "Les arrêts suggérés doivent être confirmés : stations, prix et disponibilités peuvent changer.",
    stopsLink: {
      href: "/planifier-arrets-carburant",
      label: "Découvrez comment planifier vos arrêts de ravitaillement",
    },
  },
  tips: {
    title: "Conseils pour une estimation plus réaliste",
    items: [
      "Utiliser une consommation proche de la réalité",
      "Vérifier le type de carburant",
      "Inclure l’aller-retour lorsque pertinent",
      "Ajouter les activités et détours prévus",
      "Indiquer correctement le carburant initial",
      "Revérifier les prix avant le départ",
      "Conserver une marge budgétaire",
    ],
  },
  useCases: [
    {
      title: "Escapade de fin de semaine",
      body: "Aller-retour, quelques activités et véhicule personnel : obtenez un budget essence estimé avant de partir.",
    },
    {
      title: "Long road trip",
      body: "Plusieurs étapes et achats possibles : recalculez après chaque modification du parcours.",
    },
    {
      title: "Voyage familial",
      body: "Pauses et activités ajoutées au trajet : prévoyez une marge budgétaire, car la consommation réelle peut varier.",
    },
    {
      title: "Changer de véhicule",
      body: "Sélectionnez un autre véhicule ou ajustez la consommation, puis relancez l’estimation pour comparer l’ordre de grandeur.",
    },
  ],
  plans: {
    title: "Quel forfait pour le calcul complet?",
    lead: "Découverte offre un aperçu limité. Le Pass 30 jours permet de préparer un voyage complet pendant sa durée. Sebavia Plus fournit l’accès selon le catalogue actif. Les détails officiels sont sur la page Tarifs.",
    cta: { href: "/pricing", label: "Comparer les forfaits" },
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "Comment calculer le coût du carburant pour un voyage?",
        a: "Multipliez la distance en kilomètres par la consommation en L/100 km, divisez par 100 pour obtenir les litres, puis multipliez par le prix estimé par litre. Sebavia applique cette logique au trajet complet, avec véhicule et options du voyage.",
      },
      {
        q: "Sebavia tient-il compte du trajet aller-retour?",
        a: "Oui. Vous pouvez inclure l’aller-retour dans l’estimation. Le retour fait partie du parcours configuré et peut être distinct selon vos étapes.",
      },
      {
        q: "Le carburant déjà présent dans le réservoir est-il pris en compte?",
        a: "Oui. Vous pouvez indiquer un plein, un pourcentage ou des litres au départ. La quantité consommée et les achats en route ne sont pas nécessairement identiques.",
      },
      {
        q: "Les activités et détours modifient-ils l’estimation?",
        a: "Oui. Lorsqu’ils allongent la distance du parcours, Sebavia peut recalculer la consommation et le coût estimé.",
      },
      {
        q: "Le prix du carburant est-il garanti?",
        a: "Non. Le prix par litre est une estimation qui peut varier selon le moment, la région et la station. Revérifiez avant de partir.",
      },
      {
        q: "Puis-je utiliser les données de mon propre véhicule?",
        a: "Oui. Enregistrez ou sélectionnez votre véhicule, puis vérifiez consommation, type de carburant et capacité du réservoir.",
      },
      {
        q: "Pourquoi le coût réel peut-il être différent?",
        a: "La conduite, la météo, la charge, la vitesse et le prix à la pompe peuvent différer des valeurs utilisées pour l’estimation.",
      },
      {
        q: "Quel forfait donne accès au calcul complet?",
        a: "Le calcul complet s’inscrit dans la préparation du voyage selon le forfait. Consultez la page Tarifs pour les inclusions officielles de Découverte, Pass 30 jours et Sebavia Plus.",
      },
    ],
    moreHref: "/faq",
    moreLabel: "Voir la FAQ générale",
  },
  finalCta: {
    title: "Estimez le carburant de votre prochain voyage",
    body: "Créez votre voyage, sélectionnez votre véhicule et obtenez une estimation intégrée au parcours — mise à jour lorsque vous ajustez le trajet.",
    primary: { href: "/register", label: "Calculer mon voyage" },
    secondary: { href: "/pricing", label: "Comparer les forfaits" },
    roadTripLink: {
      href: "/planificateur-road-trip-quebec",
      label: "Planifier un road trip au Québec",
    },
  },
} as const;
