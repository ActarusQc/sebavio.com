import { StatusBadge } from "@/components/common";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  WEBHOOK_STATUS_LABELS,
} from "@/features/billing/constants";

type Kind = "subscription" | "payment" | "invoice" | "webhook";

function variantFor(
  kind: Kind,
  status: string,
): "success" | "warning" | "error" | "neutral" | "info" {
  if (kind === "subscription") {
    if (status === "active" || status === "trialing") return "success";
    if (status === "past_due" || status === "unpaid" || status === "paused")
      return "warning";
    if (status === "canceled" || status === "incomplete_expired")
      return "error";
    return "neutral";
  }
  if (kind === "payment") {
    if (status === "succeeded") return "success";
    if (status === "processing") return "info";
    if (status === "partially_refunded") return "warning";
    if (status === "refunded" || status === "canceled") return "neutral";
    if (status === "failed") return "error";
    return "warning";
  }
  if (kind === "invoice") {
    if (status === "paid") return "success";
    if (status === "open") return "info";
    if (status === "void" || status === "uncollectible") return "error";
    return "neutral";
  }
  if (status === "processed") return "success";
  if (status === "processing" || status === "received") return "info";
  if (status === "failed") return "error";
  if (status === "ignored") return "neutral";
  return "warning";
}

function labelFor(kind: Kind, status: string): string {
  if (kind === "subscription")
    return SUBSCRIPTION_STATUS_LABELS[status] ?? status;
  if (kind === "payment") return PAYMENT_STATUS_LABELS[status] ?? status;
  if (kind === "invoice") return INVOICE_STATUS_LABELS[status] ?? status;
  return WEBHOOK_STATUS_LABELS[status] ?? status;
}

type Props = {
  kind: Kind;
  status: string | null | undefined;
};

export function BillingStatusBadge({ kind, status }: Props) {
  const value = status ?? "—";
  return (
    <StatusBadge status={variantFor(kind, value)}>
      {labelFor(kind, value)}
    </StatusBadge>
  );
}
