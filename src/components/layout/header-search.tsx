import { Input } from "@/components/ui";

/**
 * Coquille UI de recherche globale — non fonctionnelle (Partie 6).
 */
export function HeaderSearch() {
  return (
    <Input
      type="search"
      placeholder="Recherche — à venir"
      aria-label="Recherche — à venir"
      disabled
      readOnly
    />
  );
}
