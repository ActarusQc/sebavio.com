/**
 * Préférences restaurant + clarification (déterministe).
 */

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
    id: "any",
    re: /\b(aucune preference|aucune préférence|peu importe|n.importe|importe|pas de preference|pas de préférence)\b/i,
  },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function detectRestaurantStyle(
  message: string,
): RestaurantStyleId | null {
  const msg = normalize(message);
  for (const { id, re } of STYLE_PATTERNS) {
    if (re.test(msg)) return id;
  }
  // Correspondance aux labels de boutons
  for (const opt of RESTAURANT_STYLE_OPTIONS) {
    if (msg.includes(normalize(opt.label))) return opt.id;
  }
  return null;
}

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

export function defaultMealDurationMinutes(style: RestaurantStyleId): number {
  switch (style) {
    case "fast":
      return 30;
    case "family":
      return 60;
    case "local":
      return 75;
    case "fine":
      return 120;
    case "any":
      return 60;
  }
}

export function restaurantStyleLabel(style: RestaurantStyleId): string {
  return RESTAURANT_STYLE_OPTIONS.find((o) => o.id === style)?.label ?? style;
}

export function buildRestaurantStyleClarification() {
  return {
    required: true as const,
    type: "restaurant_style" as const,
    question: "Quel type de restaurant préférez-vous pour cet arrêt ?",
    options: RESTAURANT_STYLE_OPTIONS.map((o) => ({
      id: o.id,
      label: o.label,
      description: o.description,
    })),
  };
}
