/** Libellés FR de secours si `lang=fr` absente ou incomplète. */
const BY_CODE: Record<number, string> = {
  200: "Orage avec pluie faible",
  201: "Orage avec pluie",
  202: "Orage avec pluie forte",
  210: "Orage léger",
  211: "Orage",
  212: "Orage violent",
  221: "Orage irrégulier",
  230: "Orage avec bruine faible",
  231: "Orage avec bruine",
  232: "Orage avec bruine forte",
  300: "Bruine légère",
  301: "Bruine",
  302: "Bruine forte",
  310: "Pluie fine légère",
  311: "Pluie fine",
  312: "Pluie fine forte",
  313: "Averses et bruine",
  314: "Fortes averses et bruine",
  321: "Averses de bruine",
  500: "Pluie légère",
  501: "Pluie modérée",
  502: "Pluie forte",
  503: "Pluie très forte",
  504: "Pluie extrême",
  511: "Pluie verglaçante",
  520: "Averses légères",
  521: "Averses",
  522: "Fortes averses",
  531: "Averses irrégulières",
  600: "Neige légère",
  601: "Neige",
  602: "Neige forte",
  611: "Neige fondue",
  612: "Averses de neige fondue légères",
  613: "Averses de neige fondue",
  615: "Pluie et neige légères",
  616: "Pluie et neige",
  620: "Averses de neige légères",
  621: "Averses de neige",
  622: "Fortes averses de neige",
  701: "Brume",
  711: "Fumée",
  721: "Brume sèche",
  731: "Tourbillons de poussière",
  741: "Brouillard",
  751: "Sable",
  761: "Poussière",
  762: "Cendres volcaniques",
  771: "Rafales",
  781: "Tornade",
  800: "Ciel dégagé",
  801: "Peu nuageux",
  802: "Partiellement nuageux",
  803: "Nuageux",
  804: "Couvert",
};

export function frenchWeatherDescription(
  code: number,
  fallback?: string | null,
): string {
  if (fallback && /[àâäéèêëïîôùûüç]/i.test(fallback)) {
    return capitalize(fallback);
  }
  return (
    BY_CODE[code] ?? (fallback ? capitalize(fallback) : "Conditions variables")
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function classifyAlertLevel(
  title: string,
  description: string,
  tags: string[],
): "information" | "vigilance" | "important" {
  const hay = `${title} ${description} ${tags.join(" ")}`.toLowerCase();
  if (
    /extreme|emergency|danger|tornado|hurricane|warning|alerte rouge|severe|violent/.test(
      hay,
    )
  ) {
    return "important";
  }
  if (/watch|advisory|vigilance|caution|warning|alerte|orages?/.test(hay)) {
    return "vigilance";
  }
  return "information";
}
