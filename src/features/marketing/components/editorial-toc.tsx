import { cn } from "@/lib/utils";

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
      {/* list-none : la numérotation est fournie uniquement par le span (évite le double « 1. 1. »). */}
      <ol className="mt-3 list-none space-y-2 p-0">
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-sm text-[#3b6f9c] underline-offset-2 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none"
            >
              <span className="mr-2 text-[#60758a]" aria-hidden="true">
                {index + 1}.
              </span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
