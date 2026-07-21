import Link from "next/link";
import { cn } from "@/lib/utils";

type MarketingCtaButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: "default" | "lg";
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
};

/**
 * CTA landing — dégradé bleu→violet (maquette) ou contours pour fonds sombres.
 */
export function MarketingCtaButton({
  href,
  children,
  className,
  size = "default",
  variant = "primary",
  onClick,
}: MarketingCtaButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "font-heading focus-visible:ring-ring inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] text-sm font-semibold transition-[filter,transform,background-color,border-color] focus-visible:ring-2 focus-visible:outline-none",
        size === "default" && "h-10 px-5",
        size === "lg" && "h-12 px-7 text-base",
        variant === "primary" &&
          "from-sebavio-gradient-from to-sebavio-gradient-to bg-gradient-to-r text-white shadow-md hover:brightness-110",
        variant === "secondary" &&
          "border border-white/35 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10",
        variant === "ghost" &&
          "text-white/90 underline-offset-4 hover:text-white hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}
