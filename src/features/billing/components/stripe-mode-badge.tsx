import { cn } from "@/lib/utils";
import { STRIPE_MODE_LABELS } from "@/features/billing/constants";
import type { StripeMode } from "@/features/billing/types";

type Props = {
  mode: StripeMode | string;
  className?: string;
};

export function StripeModeBadge({ mode, className }: Props) {
  const normalized = mode === "live" ? "live" : "test";
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        normalized === "live"
          ? "border-destructive/30 bg-destructive/15 text-destructive"
          : "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-200",
        className,
      )}
    >
      {STRIPE_MODE_LABELS[normalized] ?? normalized}
    </span>
  );
}
