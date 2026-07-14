/**
 * Libellés WMO Weather interpretation codes (Open-Meteo).
 * @see https://open-meteo.com/en/docs
 */
export function wmoWeatherSummary(code: number): string {
  if (code === 0) return "Ciel dégagé";
  if (code === 1) return "Plutôt dégagé";
  if (code === 2) return "Partiellement nuageux";
  if (code === 3) return "Couvert";
  if (code === 45 || code === 48) return "Brouillard";
  if (code >= 51 && code <= 57) return "Bruine";
  if (code >= 61 && code <= 67) return "Pluie";
  if (code >= 71 && code <= 77) return "Neige";
  if (code >= 80 && code <= 82) return "Averses";
  if (code === 85 || code === 86) return "Averses de neige";
  if (code >= 95 && code <= 99) return "Orage";
  return "Conditions variables";
}
