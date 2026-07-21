import Link from "next/link";
import { cn } from "@/lib/utils";

type MarketingCtaButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  size?: "default" | "lg" | "sm";
  variant?: "primary" | "secondary" | "ghost" | "soft";
  onClick?: () => void;
};

/** CTA landing — dégradé bleu→violet (maquette). */
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
        "font-heading focus-visible:ring-ring inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-[filter,transform,background-color,border-color,box-shadow] focus-visible:ring-2 focus-visible:outline-none",
        size === "sm" && "h-9 px-4 text-xs",
        size === "default" && "h-10 px-5",
        size === "lg" && "h-12 px-7 text-[0.95rem]",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)] hover:brightness-110",
        variant === "secondary" &&
          "border border-white/40 bg-transparent text-white hover:border-white/70 hover:bg-white/10",
        variant === "soft" &&
          "border border-[#dfe7ef] bg-white text-[#082b46] hover:border-[#3b82f6]/40 hover:bg-[#f7f9fc]",
        variant === "ghost" &&
          "text-white/90 underline-offset-4 hover:text-white hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}
