/**
 * Préférences restaurant — une préférence = une occasion de repas (requestId).
 * Jamais de réutilisation globale depuis l’historique.
 */

import type { MealType } from "@/features/ai/lib/meal-timing";

export const RESTAURANT_STYLE_OPTIONS = [
  {
    id: "fast",
    label: "Restauration rapide",
    description: "Arrêt court et service rapide",
  },
  {
    id: "family",
    label: "Familial et décontracté",
    description: "Repas assis, menu varié",
  },
  {
    id: "romantic",
    label: "Romantique",
    description: "Ambiance calme et agréable pour un repas à deux",
  },
  {
    id: "fine",
    label: "Haut de gamme",
    description: "Expérience plus longue, réservation souvent recommandée",
  },
  {
    id: "local",
    label: "Cuisine locale",
    description: "Produits régionaux et spécialités du secteur",
  },
  {
    id: "cafe",
    label: "Café ou repas léger",
    description: "Pause courte, sandwich ou café",
  },
  {
    id: "any",
    label: "Aucune préférence",
    description: "Meilleurs choix disponibles près du trajet",
  },
] as const;

export type RestaurantStyleId = (typeof RESTAURANT_STYLE_OPTIONS)[number]["id"];

const STYLE_PATTERNS: Array<{ id: RestaurantStyleId; re: RegExp }> = [
  {
    id: "fast",
    re: /\b(rapide|casse[- ]?croute|casse[- ]?croûte|fast[- ]?food|restauration rapide|snack|drive)\b/i,
  },
  {
    id: "romantic",
    re: /\b(romantiqu|intime|a deux|à deux|couple)\b/i,
  },
  {
    id: "family",
    re: /\b(familial|famille|decontracte|décontracté|brasserie|bistro|confortable)\b/i,
  },
  {
    id: "fine",
    re: /\b(haut de gamme|gastronom|fine dining|michelin|luxueux|étoilé|etoile)\b/i,
  },
  {
    id: "local",
    re: /\b(local|locale|regionnal|régional|terroir|produits du (pays|coin))\b/i,
  },
  {
    id: "cafe",
    re: /\b(cafe|café|repas leger|repas léger|sandwich|brunch leger)\b/i,
  },
  {
    id: "any",
    re: /\b(aucune preference|aucune préférence|peu importe|n.importe|importe|pas de preference|pas de préférence)\b/i,
  },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/** Style exprimé dans le message courant uniquement — jamais l’historique. */
export function detectRestaurantStyle(
  message: string,
): RestaurantStyleId | null {
  const msg = normalize(message);
  for (const { id, re } of STYLE_PATTERNS) {
    if (re.test(msg)) return id;
  }
  for (const opt of RESTAURANT_STYLE_OPTIONS) {
    if (msg.includes(normalize(opt.label))) return opt.id;
  }
  return null;
}

/**
 * @deprecated Ne plus utiliser pour décider le style courant.
 * Conservé pour tests / diagnostic.
 */
export function detectRestaurantStyleFromHistory(
  messages: Array<{ role: string; content: string }>,
): RestaurantStyleId | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== "user") continue;
    const style = detectRestaurantStyle(m.content);
    if (style) return style;
  }
  return null;
}

export function isRestaurantMealRequest(message: string): boolean {
  const msg = normalize(message);
  return /\b(restaurant|resto|manger|diner|diner|dejeuner|dejeuner|souper|repas|casse[- ]?croute|casse[- ]?croûte|gastronom|cuisine|cafe|café|brunch|table)\b/.test(
    msg,
  );
}

/** Suivi de la même recherche (« voir plus », etc.). */
export function isRestaurantSearchFollowUp(message: string): boolean {
  const msg = normalize(message);
  return /\b(voir plus|d.autres|autres options|autre option|encore d.autres|plus d.options|elargir|élargir|autre rayon|change.*rayon)\b/.test(
    msg,
  );
}

/** Demande explicite de conserver le même style pour un autre repas. */
export function isSameStyleRequest(message: string): boolean {
  const msg = normalize(message);
  return /\b(meme style|même style|meme type|même type|comme (le|la|au) (precedent|précédent|dernier)|du meme genre|du même genre)\b/.test(
    msg,
  );
}

/** Changement de style dans la même demande. */
export function isStyleChangeWithinRequest(message: string): boolean {
  const msg = normalize(message);
  return (
    /\b(finalement|plutot|plutôt|plutot|montre[- ]moi plutot|cherche quelque chose de)\b/.test(
      msg,
    ) && detectRestaurantStyle(message) != null
  );
}

export function defaultMealDurationMinutes(style: RestaurantStyleId): number {
  switch (style) {
    case "fast":
    case "cafe":
      return 30;
    case "family":
      return 60;
    case "local":
      return 75;
    case "romantic":
      return 90;
    case "fine":
      return 120;
    case "any":
      return 60;
  }
}

export function restaurantStyleLabel(style: RestaurantStyleId): string {
  return RESTAURANT_STYLE_OPTIONS.find((o) => o.id === style)?.label ?? style;
}

const ORDER_LUNCH: RestaurantStyleId[] = [
  "fast",
  "family",
  "local",
  "cafe",
  "fine",
  "romantic",
  "any",
];

const ORDER_DINNER: RestaurantStyleId[] = [
  "family",
  "local",
  "romantic",
  "fine",
  "fast",
  "cafe",
  "any",
];

const ORDER_BREAKFAST: RestaurantStyleId[] = [
  "cafe",
  "fast",
  "family",
  "local",
  "any",
  "fine",
  "romantic",
];

function orderedOptions(mealType: MealType) {
  const order =
    mealType === "dinner"
      ? ORDER_DINNER
      : mealType === "breakfast"
        ? ORDER_BREAKFAST
        : ORDER_LUNCH;
  const byId = new Map(RESTAURANT_STYLE_OPTIONS.map((o) => [o.id, o]));
  return order
    .map((id) => byId.get(id))
    .filter((o): o is (typeof RESTAURANT_STYLE_OPTIONS)[number] => o != null);
}

export function clarificationQuestionForMeal(mealType: MealType): string {
  switch (mealType) {
    case "breakfast":
      return "Quel type d’endroit préférez-vous pour déjeuner ?";
    case "lunch":
      return "Quel type de restaurant recherchez-vous pour ce dîner ?";
    case "dinner":
      return "Quelle ambiance recherchez-vous pour ce souper ?";
  }
}

export function buildRestaurantStyleClarification(
  mealType: MealType = "lunch",
) {
  return {
    required: true as const,
    type: "restaurant_style" as const,
    question: clarificationQuestionForMeal(mealType),
    options: orderedOptions(mealType).map((o) => ({
      id: o.id,
      label: o.label,
      description: o.description,
    })),
  };
}

export function buildSameStyleConfirmClarification(previousLabel: string) {
  return {
    required: true as const,
    type: "restaurant_style" as const,
    question: `Souhaitez-vous conserver le style « ${previousLabel} » pour ce repas ?`,
    options: [
      {
        id: "keep_previous_style",
        label: "Oui, conserver ce style",
        description: previousLabel,
      },
      {
        id: "choose_other_style",
        label: "Choisir un autre style",
        description: "Afficher toutes les options",
      },
    ],
  };
}
