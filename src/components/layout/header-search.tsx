import { Search } from "lucide-react";
import { Input } from "@/components/ui";

/**
 * Coquille UI de recherche globale — non fonctionnelle.
 */
export function HeaderSearch() {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40"
        aria-hidden
      />
      <Input
        type="search"
        placeholder="Rechercher — à venir"
        aria-label="Rechercher — à venir"
        disabled
        readOnly
        className="h-10 rounded-full border-white/12 bg-white/5 pl-9 text-white/70 placeholder:text-white/35 disabled:opacity-70"
      />
    </div>
  );
}
