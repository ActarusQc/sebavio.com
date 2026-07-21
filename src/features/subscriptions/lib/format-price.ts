import {
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
} from "@/features/subscriptions/lib/official-plan-slugs";

/** Montant CAD en cents → affichage fr-CA (ex. « 12,99 $ »). */
export function formatCadCents(cents: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export function formatPassPrice(cents: number = PASS_PRICE_CENTS): string {
  return formatCadCents(cents);
}

export function formatPlusPrice(cents: number = PLUS_PRICE_CENTS): string {
  return `${formatCadCents(cents)} / an`;
}

/** Équivalent mensuel discret dérivé du prix annuel (arrondi supérieur au centime). */
export function formatMonthlyFromAnnual(annualCents: number): string {
  const monthlyCents = Math.ceil(annualCents / 12);
  return formatCadCents(monthlyCents);
}
