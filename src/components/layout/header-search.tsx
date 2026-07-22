import { Search } from "lucide-react";
import { Input } from "@/components/ui";

/**
 * Coquille UI de recherche globale — non fonctionnelle.
 */
export function HeaderSearch() {
  return (
    <div className="relative">
      <Search
        className="text-client-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        placeholder="Rechercher — à venir"
        aria-label="Rechercher — à venir"
        disabled
        readOnly
        className="border-client-border bg-client-bg-secondary/80 text-client-text-muted h-10 rounded-full pl-9 dark:border-white/10"
      />
    </div>
  );
}
