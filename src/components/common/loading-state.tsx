import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type LoadingStateProps = {
  /** Nombre de lignes skeleton. */
  lines?: number;
  className?: string;
  /** Libellé accessible pour les lecteurs d’écran. */
  label?: string;
};

/**
 * État de chargement via Skeleton (Document 7).
 */
export function LoadingState({
  lines = 3,
  className,
  label = "Chargement…",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("flex flex-col gap-3", className)}
    >
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4 w-full", index === lines - 1 && "w-2/3")}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
