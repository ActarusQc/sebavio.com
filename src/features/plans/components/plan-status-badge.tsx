import { StatusBadge } from "@/components/common";

const PLAN_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  hidden: "Masqué",
  archived: "Archivé",
  pending_reconciliation: "Réconciliation",
};

function variantFor(
  status: string,
): "success" | "warning" | "error" | "neutral" | "info" {
  if (status === "active") return "success";
  if (status === "hidden") return "neutral";
  if (status === "archived") return "error";
  if (status === "pending_reconciliation") return "warning";
  return "info";
}

type Props = {
  status: string;
};

export function PlanStatusBadge({ status }: Props) {
  return (
    <StatusBadge status={variantFor(status)}>
      {PLAN_STATUS_LABELS[status] ?? status}
    </StatusBadge>
  );
}
