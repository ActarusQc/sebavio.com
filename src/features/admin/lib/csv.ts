/**
 * Neutralise l'injection de formules CSV (= + - @) puis échappe CSV.
 */
export function neutralizeCsvFormula(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

/** Cellule CSV sûre (formule + guillemets). */
export function csvCell(value: string | number | null | undefined): string {
  let text = value == null ? "" : String(value);
  text = neutralizeCsvFormula(text);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
