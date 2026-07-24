import { cn } from "@/lib/utils";

/**
 * Table des matières éditoriale.
 * Numérotation uniquement via `<ol>` (pas de préfixe manuel dans les libellés
 * ni de span « 1. ») — évite la double numérotation pour les crawlers sans CSS
 * et pour les lecteurs d’écran.
 */
export function EditorialToc({
  items,
  className,
}: {
  items: ReadonlyArray<{ id: string; label: string }>;
  className?: string;
}) {
  return (
    <nav
      aria-label="Table des matières"
      className={cn(
        "rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] p-5",
        className,
      )}
    >
      <p className="font-heading text-sm font-semibold text-[#082b46]">
        Sur cette page
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 marker:text-[#60758a]">
        {items.map((item) => (
          <li key={item.id} className="pl-1">
            <a
              href={`#${item.id}`}
              className="text-sm text-[#3b6f9c] underline-offset-2 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
