import { cn } from "@/lib/utils";

/** Illustration étoile + route (seba + via) pour la carte Assistant. */
export function SebavioAssistantIcon({
  className,
  size = 40,
  variant = "icon",
}: {
  className?: string;
  size?: number;
  /** `hero` = illustration large de la carte résumé. */
  variant?: "icon" | "hero";
}) {
  if (variant === "hero") {
    return (
      <svg
        width={72}
        height={90}
        viewBox="0 0 72 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
        aria-hidden
      >
        <path
          d="M8 72c10-4 18-18 26-28 8-10 16-16 28-12"
          stroke="var(--sebavio-teal)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="3.5 5"
          opacity="0.85"
        />
        <path
          d="M14 58c8-3 14-12 20-18"
          stroke="var(--sebavio-navy)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="2 4"
          opacity="0.35"
        />
        <path
          d="M36 10 40.6 24.2 55.5 24.6 43.6 33.6 47.6 47.5 36 39.2 24.4 47.5 28.4 33.6 16.5 24.6 31.4 24.2 36 10Z"
          fill="var(--sebavio-gold)"
          stroke="#e0a63d"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        <path
          d="M54 48 55.8 53.4 61.5 53.6 56.9 57 58.4 62.4 54 59.2 49.6 62.4 51.1 57 46.5 53.6 52.2 53.4 54 48Z"
          fill="var(--sebavio-gold)"
          opacity="0.85"
        />
        <path
          d="M18 42 19.1 45.2 22.5 45.3 19.8 47.3 20.7 50.5 18 48.6 15.3 50.5 16.2 47.3 13.5 45.3 16.9 45.2 18 42Z"
          fill="var(--sebavio-gold)"
          opacity="0.7"
        />
        <circle
          cx="58"
          cy="72"
          r="2.2"
          fill="var(--sebavio-teal)"
          opacity="0.7"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="M8 34c6-2 10-10 14-14s8-6 14-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 4"
        className="text-sebavio-teal"
        opacity="0.7"
      />
      <path
        d="M24 6.5 27.2 16.2 37.5 16.5 29.4 22.8 32.2 32.5 24 26.8 15.8 32.5 18.6 22.8 10.5 16.5 20.8 16.2 24 6.5Z"
        fill="var(--sebavio-gold)"
        stroke="var(--sebavio-gold)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
