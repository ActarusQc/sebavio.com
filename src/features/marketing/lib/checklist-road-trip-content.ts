/**
 * Contenu informatif du guide /guides/checklist-road-trip-quebec.
 * Intention : quoi préparer avant un road trip au Québec — distinct du planificateur commercial.
 */

export const CHECKLIST_GUIDE = {
  meta: {
    title:
      "Checklist road trip Québec : quoi préparer avant de partir | Sebavia",
    description:
      "Checklist pratique pour un road trip au Québec : véhicule, documents, itinéraire, carburant, météo, bagages et dernières vérifications avant le départ.",
  },
  hero: {
    eyebrow: "Guide · Préparation",
    title: "Checklist road trip au Québec",
    body: "Une liste claire pour préparer un voyage en voiture au Québec : ce qu’il est utile de vérifier, d’anticiper et d’emporter — sans prétendre tout couvrir.",
    primaryCta: {
      href: "#checklist",
      label: "Voir la checklist",
    },
    secondaryCta: {
      href: "/planificateur-road-trip-quebec",
      label: "Outil de planification Sebavia",
    },
  },
  intro: {
    title: "À qui s’adresse cette checklist?",
    paragraphs: [
      "Vous planifiez une escapade de fin de semaine, un circuit de plusieurs jours ou un premier long trajet au Québec. Cette page vous aide à structurer la préparation avant le départ — pas à choisir un logiciel.",
      "Les points ci-dessous sont des rappels pratiques. Adaptez-les à votre véhicule, à la saison, à la durée du voyage et aux personnes qui vous accompagnent. En cas de doute sur l’état du véhicule ou sur une obligation, consultez un professionnel ou une source officielle.",
    ],
  },
  toc: [
    { id: "cadre", label: "Cadre du voyage" },
    { id: "vehicule", label: "Véhicule et documents" },
    { id: "itineraire", label: "Itinéraire et étapes" },
    { id: "carburant", label: "Carburant et autonomie" },
    { id: "meteo", label: "Météo et conditions" },
    { id: "bagages", label: "Bagages et essentiels" },
    { id: "hebergement", label: "Hébergement et réservations" },
    { id: "depart", label: "Jour du départ" },
    { id: "sebavia", label: "Où Sebavia peut aider" },
    { id: "limites", label: "Limites de ce guide" },
  ],
  sections: [
    {
      id: "cadre",
      title: "1. Cadre du voyage",
      lead: "Avant de remplir le coffre, clarifiez le cadre : cela évite les oublis et les journées trop chargées.",
      items: [
        "Dates de départ et de retour (et marge si le retour peut glisser)",
        "Nombre de personnes et besoins particuliers (enfants, mobilité, animaux)",
        "Type de voyage : court séjour, circuit, spontané ou avec étapes fixes",
        "Budget approximatif (hébergement, repas, activités, carburant)",
        "Rythme souhaité : journées longues au volant ou pauses fréquentes",
      ],
      tip: "Notez une durée maximale de conduite par jour qui vous convient vraiment — pas seulement celle qui « rentre » sur la carte. En famille, le rythme et les pauses comptent autant que la distance.",
      productLinks: [
        {
          href: "/guides/road-trip-solo-quebec",
          label: "Organiser un road trip solo",
        },
        {
          href: "/guides/road-trip-couple-quebec",
          label: "Organiser une escapade en couple",
        },
        {
          href: "/guides/road-trip-famille-quebec",
          label: "Organiser un road trip en famille",
        },
      ],
      productLink: null,
    },
    {
      id: "vehicule",
      title: "2. Véhicule et documents",
      lead: "Un road trip repose d’abord sur un véhicule en état et sur les papiers utiles. Cette liste est un rappel général, pas un diagnostic.",
      items: [
        "Niveau de carburant ou de charge (selon le type de véhicule)",
        "Pression et état général des pneus (contrôle visuel simple)",
        "Liquides visibles (lave-glace, etc.) si vous savez les vérifier",
        "Feux, essuie-glaces et avertisseur sonore",
        "Permis de conduire valide et documents du véhicule",
        "Assurance et numéro utile en cas d’imprévu",
        "Chargeur de téléphone et câbles adaptés",
        "Trousse de base selon votre pratique (gilet, triangles, etc.)",
      ],
      tip: "Si quelque chose vous semble anormal (bruit, voyant, usure), faites vérifier le véhicule avant un long trajet plutôt que d’improviser sur la route.",
      productLink: {
        href: "/fonctionnalites",
        label: "Voir comment Sebavia regroupe véhicule et voyage",
      },
    },
    {
      id: "itineraire",
      title: "3. Itinéraire et étapes",
      lead: "Un bon parcours n’est pas seulement le chemin le plus court : c’est aussi le rythme, les pauses et les activités réalistes.",
      items: [
        "Point de départ et destination principale",
        "Étapes intermédiaires et temps de conduite estimés",
        "Pauses prévues (repas, points de vue, aires)",
        "Activités dont vous voulez confirmer les horaires",
        "Plan B si une activité ou une route est fermée",
        "Partage de l’itinéraire avec les personnes qui voyagent avec vous",
      ],
      tip: "Au Québec, les distances et les services varient beaucoup selon les régions. Prévoir une marge évite de transformer chaque journée en course contre la montre.",
      productLink: {
        href: "/planificateur-road-trip-quebec",
        label: "Découvrir le planificateur Sebavia",
      },
    },
    {
      id: "carburant",
      title: "4. Carburant et autonomie",
      lead: "Anticipez le budget essence et les arrêts, surtout sur les trajets plus longs ou moins desservis.",
      items: [
        "Consommation approximative de votre véhicule",
        "Estimation du coût de carburant pour le trajet",
        "Autonomie et stratégie d’arrêts (sans compter sur la dernière goutte)",
        "Marge de sécurité selon la région et la saison",
        "Moyen de paiement accepté aux stations que vous visez",
      ],
      tip: "Les prix et la disponibilité des stations évoluent. Une estimation aide à budgéter ; le niveau réel dans le réservoir reste la référence le jour J.",
      productLinks: [
        {
          href: "/calculateur-cout-carburant-voyage",
          label: "Calculateur de coût de carburant",
        },
        {
          href: "/planifier-arrets-carburant",
          label: "Planifier les arrêts de carburant",
        },
      ],
      productLink: null,
    },
    {
      id: "meteo",
      title: "5. Météo et conditions",
      lead: "La météo influence vêtements, activités extérieures et parfois le rythme du trajet. Les prévisions évoluent : revérifiez près du départ.",
      items: [
        "Tendance météo sur les dates du voyage",
        "Écart possible entre départ, étapes et arrivée",
        "Vêtements et équipement adaptés à la saison",
        "Activités extérieures à confirmer selon la météo",
        "Conditions routières via les sources officielles lorsque pertinent",
      ],
      tip: "Sebavia peut afficher des prévisions liées au voyage ; pour les alertes et l’état des routes, privilégiez les sources officielles.",
      productLink: {
        href: "/meteo-voyage",
        label: "Comment Sebavia présente la météo du voyage",
      },
    },
    {
      id: "bagages",
      title: "6. Bagages et essentiels",
      lead: "Adaptez cette liste à la durée et à la saison. L’objectif n’est pas d’emporter « tout », mais de ne pas oublier l’essentiel.",
      items: [
        "Vêtements selon la météo et le nombre de jours",
        "Chaussures confortables pour la marche",
        "Trousse de toilette et médicaments personnels",
        "Lunettes de soleil, crème solaire ou protection selon la saison",
        "Bouteilles d’eau et collations pour la route",
        "Sacs réutilisables et sacs pour le linge",
        "Divertissement pour les longues étapes (enfants ou passagers)",
        "Copies ou photos des réservations importantes",
      ],
      tip: "Faites une passe « ce qui reste à la maison » la veille : chargeurs, clés, médicaments, cartes physiques si vous en utilisez encore.",
      productLink: null,
    },
    {
      id: "hebergement",
      title: "7. Hébergement et réservations",
      lead: "Selon votre style de voyage, certaines nuits se réservent à l’avance — surtout en haute saison ou dans les régions très fréquentées.",
      items: [
        "Nuits confirmées ou zones où vous chercherez sur place",
        "Coordonnées et horaires d’arrivée des hébergements",
        "Politique d’annulation si vos dates sont flexibles",
        "Activités ou restaurants à réserver si nécessaire",
        "Budget repas (épicerie, restaurants, pique-niques)",
      ],
      tip: "Gardez une copie accessible hors ligne des confirmations importantes — le réseau cellulaire n’est pas uniforme partout.",
      productLink: {
        href: "/assistant-voyage-ia",
        label: "Planifier aussi avec l’assistant voyage",
      },
    },
    {
      id: "depart",
      title: "8. Jour du départ",
      lead: "Une courte liste le matin du départ évite le stress de dernière minute.",
      items: [
        "Verrouiller la maison / laisser les consignes nécessaires",
        "Vérifier une dernière fois le niveau de carburant",
        "Consulter la météo du jour et les conditions routières si besoin",
        "Confirmer la première étape et l’heure d’arrivée prévue",
        "Charger les téléphones et préparer le GPS ou l’itinéraire",
        "Emporter portefeuille, permis, clés et téléphone",
        "Informer une personne de confiance de votre plan général si utile",
      ],
      tip: "Partez avec une marge sur la première journée : les imprévus arrivent surtout au début, quand on veut « rattraper » le retard.",
      productLink: null,
    },
  ],
  sebavia: {
    id: "sebavia",
    title: "Où Sebavia peut aider",
    lead: "Cette checklist reste utile sans compte. Si vous voulez centraliser le parcours dans un outil, voici les pages utiles — sans refaire ici le détail de chaque fonction.",
    links: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur de road trip",
        body: "Structurer destination, étapes, activités et rythme.",
      },
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Coût de carburant",
        body: "Estimer la part essence du budget voyage.",
      },
      {
        href: "/planifier-arrets-carburant",
        label: "Arrêts de carburant",
        body: "Réfléchir à l’autonomie et aux arrêts possibles.",
      },
      {
        href: "/meteo-voyage",
        label: "Météo du voyage",
        body: "Consulter des prévisions liées aux dates et lieux.",
      },
      {
        href: "/assistant-voyage-ia",
        label: "Assistant voyage",
        body: "Démarrer ou ajuster un parcours en conversation.",
      },
      {
        href: "/fonctionnalites",
        label: "Toutes les fonctionnalités",
        body: "Vue d’ensemble du catalogue Sebavia.",
      },
    ],
  },
  limits: {
    id: "limites",
    title: "Limites de ce guide",
    paragraphs: [
      "Cette checklist ne remplace pas un manuel du véhicule, un diagnostic mécanique, un avis juridique ou les consignes de sécurité routière.",
      "Elle ne couvre pas toutes les situations (voyage en hiver extrême, véhicules spécialisés, contraintes médicales, traversées particulières, etc.).",
      "Les informations liées à la météo, aux routes, aux prix du carburant et aux horaires peuvent changer : validez-les près du départ auprès des sources appropriées.",
    ],
  },
  printNote:
    "Astuce : utilisez la fonction d’impression de votre navigateur pour emporter une version papier de cette checklist.",
  finalCta: {
    title: "Passer de la liste au parcours",
    body: "Quand la préparation est claire, créez un compte pour rassembler itinéraire, estimation de carburant et météo dans Sebavia.",
    primary: { href: "/register", label: "Créer un compte" },
    secondary: { href: "/guides", label: "Retour aux guides" },
  },
} as const;
