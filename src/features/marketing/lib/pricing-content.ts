/**
 * Contenu marketing de la page Tarifs — textes figés (présentation).
 * Prix et capacités viennent des forfaits / entitlements en base.
 */

export const PRICING_PAGE = {
  meta: {
    title: "Tarifs Sebavio — Planifiez vos voyages simplement",
    description:
      "Découvrez les forfaits Sebavio : aperçu gratuit, Pass 30 jours ou accès annuel. Planifiez vos itinéraires, votre carburant, vos activités et échangez avec votre agent de voyage intelligent.",
  },
  hero: {
    badge: "DES FORFAITS POUR CHAQUE FAÇON DE VOYAGER",
    title: "Choisissez jusqu’où Sebavio vous accompagne",
    subtitle:
      "Découvrez la plateforme gratuitement, préparez un voyage complet avec le Pass 30 jours ou profitez de Sebavio toute l’année.",
    trust: "Des prix simples, en dollars canadiens, sans frais cachés.",
  },
  plans: {
    decouverte: {
      subtitle: "Pour explorer Sebavio avant de prendre la route.",
      priceNote: "Gratuit, sans carte de crédit",
      cta: "Découvrir gratuitement",
      limitNote:
        "La planification complète d’un voyage nécessite un accès payant.",
      detailsLabel: "Voir les détails",
    },
    pass: {
      badge: "Idéal pour un voyage",
      subtitle: "Tout Sebavio pendant 30 jours, sans abonnement.",
      priceNote: "Paiement unique · Accès complet pendant 30 jours",
      cta: "Préparer mon prochain voyage",
      renewNote: "Aucun renouvellement automatique.",
      detailsLabel: "Voir les détails",
    },
    plus: {
      badge: "Meilleure valeur",
      subtitle: "Votre compagnon de voyage pour toute l’année.",
      priceNote: "Facturation annuelle",
      cta: "Choisir Sebavio Plus",
      detailsLabel: "Voir les détails",
    },
  },
  agent: {
    title: "Bien plus qu’un planificateur de trajet",
    body: "Sebavio vous accompagne dans une véritable conversation. Demandez-lui de trouver une activité, de prévoir un arrêt pour dîner, d’évaluer la météo, de modifier votre itinéraire ou de vous guider pendant le voyage.",
    textTitle: "Conversation écrite",
    textBody:
      "Écrivez naturellement ce que vous recherchez et Sebavio tient compte de votre trajet, de votre véhicule et de vos préférences.",
    voiceTitle: "Conversation vocale",
    voiceBody:
      "Parlez directement à Sebavio et écoutez ses réponses, particulièrement pratique sur mobile et lors de vos déplacements.",
    footnote:
      "Pensé pour le Web aujourd’hui et les expériences mobiles de demain.",
    demoUser: "Trouve-nous un restaurant familial pour dîner sur le trajet.",
    demoAssistant:
      "J’ai trouvé trois options près de Trois-Pistoles, autour de midi. La première est à moins de cinq minutes de votre route.",
  },
  comparison: {
    title: "Comparez les forfaits",
    subtitle: "Les capacités reflètent les droits réellement configurés.",
  },
  chooser: {
    title: "Quel forfait vous convient?",
    scenarios: [
      {
        id: "discover",
        title: "Je veux découvrir",
        body: "Choisissez Découverte pour explorer la plateforme avant de planifier un voyage complet.",
        href: "#forfait-decouverte",
        cta: "Voir Découverte",
      },
      {
        id: "trip",
        title: "Je prépare un voyage",
        body: "Choisissez le Pass 30 jours pour organiser vos vacances et utiliser toutes les fonctions pendant votre départ.",
        href: "#forfait-pass-30-jours",
        cta: "Voir le Pass 30 jours",
      },
      {
        id: "year",
        title: "Je voyage plusieurs fois par année",
        body: "Choisissez Sebavio Plus pour conserver votre compagnon de voyage toute l’année.",
        href: "#forfait-sebavio-plus",
        cta: "Voir Sebavio Plus",
      },
    ],
  },
  trust: {
    title: "Des garanties simples",
    items: [
      "Prix affichés en dollars canadiens",
      "Paiement sécurisé avec Stripe",
      "Aucun frais caché",
      "Pass sans renouvellement automatique",
      "Accès activé automatiquement après confirmation du paiement",
      "Mode texte disponible si la voix est temporairement indisponible",
    ],
    activationNote:
      "Votre accès est activé automatiquement dès la confirmation sécurisée du paiement.",
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: "Puis-je essayer Sebavio gratuitement?",
        a: "Oui. Le forfait Découverte vous permet d’explorer l’interface, de créer votre profil et d’enregistrer un véhicule. La planification complète d’un voyage nécessite toutefois un accès payant (Pass 30 jours ou Sebavio Plus).",
      },
      {
        q: "Le Pass 30 jours est-il un abonnement?",
        a: "Non. Il s’agit d’un paiement unique. Il ne se renouvelle pas automatiquement.",
      },
      {
        q: "Quand commencent les 30 jours?",
        a: "Les 30 jours débutent au moment de la confirmation du paiement. La période d’accès est calculée à partir de cette date.",
      },
      {
        q: "Que se passe-t-il après les 30 jours?",
        a: "Votre compte revient au forfait Découverte. Vos données restent accessibles dans les limites de ce forfait; la planification complète et les fonctions avancées nécessitent un nouveau Pass ou Sebavio Plus.",
      },
      {
        q: "Sebavio Plus se renouvelle-t-il automatiquement?",
        a: "Oui. Sebavio Plus est un abonnement annuel facturé via Stripe. Il se renouvelle automatiquement à chaque échéance, sauf si vous l’annulez depuis le portail de facturation.",
      },
      {
        q: "La conversation vocale est-elle incluse?",
        a: "La conversation écrite et vocale avec l’agent Sebavio est incluse dans le Pass 30 jours et Sebavio Plus, selon les capacités configurées pour ces forfaits. Le forfait Découverte offre une découverte limitée de l’agent.",
      },
      {
        q: "Puis-je utiliser Sebavio sur mon téléphone?",
        a: "Oui. Le site Sebavio est conçu pour les appareils mobiles. Une application native n’est pas encore publiée; vous utilisez Sebavio via le navigateur de votre téléphone.",
      },
      {
        q: "Mes paiements sont-ils sécurisés?",
        a: "Oui. Les paiements sont traités par Stripe. Sebavio ne conserve pas directement les données complètes de votre carte bancaire.",
      },
    ],
  },
  finalCta: {
    title: "Votre prochaine route commence ici",
    body: "Découvrez Sebavio gratuitement ou choisissez l’accompagnement qui correspond à votre prochaine aventure.",
    primary: "Commencer gratuitement",
    secondary: "Choisir mon forfait",
  },
} as const;
