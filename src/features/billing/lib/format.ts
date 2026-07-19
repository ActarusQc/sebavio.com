import type { StripeMode } from "@/features/billing/types";
import {
  BILLING_INTERVAL_LABELS,
  PAYMENT_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/features/billing/constants";

export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export function formatUserName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string | null {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || null;
}

export function asStripeMode(value: string): StripeMode {
  return value === "live" ? "live" : "test";
}

export function formatMoneyCents(
  amountCents: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amountCents == null) return "—";
  const major = (amountCents / 100).toFixed(2);
  const cur = (currency ?? "cad").toUpperCase();
  return `${major} ${cur}`;
}

export function amountMajorFromCents(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

export function subscriptionStatusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABELS[status] ?? status;
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function billingIntervalLabel(interval: string | null): string {
  if (!interval) return "—";
  return BILLING_INTERVAL_LABELS[interval] ?? interval;
}

export function isSafeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function displayStatusForPayment(row: {
  status: string;
  amount: number;
  amountRefunded: number;
}): string {
  if (row.amountRefunded > 0 && row.amountRefunded >= row.amount) {
    return "refunded";
  }
  if (row.amountRefunded > 0) {
    return "partially_refunded";
  }
  return row.status;
}
