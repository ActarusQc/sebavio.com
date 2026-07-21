import { Search } from "lucide-react";
import { Input } from "@/components/ui";

/**
 * Coquille UI de recherche globale — non fonctionnelle (Partie 6).
 */
export function HeaderSearch() {
  return (
    <div className="relative">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        placeholder="Recherche — à venir"
        aria-label="Recherche — à venir"
        disabled
        readOnly
        className="border-sebavio-sand/70 bg-card/80 dark:bg-input/40 h-10 rounded-xl pl-9 dark:border-white/10"
      />
    </div>
  );
}
