import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        success: "bg-success/15 text-success",
        info: "bg-info/15 text-info",
        warning: "bg-warning/20 text-warning-foreground dark:text-warning",
        error: "bg-destructive/15 text-destructive",
        neutral: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  },
);

export type StatusBadgeProps = ComponentProps<"span"> &
  VariantProps<typeof statusBadgeVariants>;

/**
 * Badge d’état fonctionnel (succès, info, avertissement, erreur).
 */
export function StatusBadge({ className, status, ...props }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    />
  );
}

export { statusBadgeVariants };
