"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@/components/ui";
import { retryWebhookAction } from "@/features/billing/actions";
import type { BillingActionResult } from "@/features/billing/types";
import type { WebhookListItem } from "@/features/billing/types";
import { BillingStatusBadge } from "@/features/billing/components/billing-status-badge";
import { StripeModeBadge } from "@/features/billing/components/stripe-mode-badge";
import { CopyableStripeId } from "@/features/billing/components/copyable-stripe-id";

const initial: BillingActionResult | undefined = undefined;

type Props = {
  items: WebhookListItem[];
  canRetry: boolean;
};

export function WebhooksTable({ items, canRetry }: Props) {
  const [state, formAction, pending] = useActionState(
    retryWebhookAction,
    initial,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Aucun événement webhook.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Mode</TableHead>
          <TableHead>Objet</TableHead>
          <TableHead>Tentatives</TableHead>
          <TableHead>Reçu</TableHead>
          <TableHead>Erreur</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-xs">{row.type}</TableCell>
            <TableCell>
              <BillingStatusBadge kind="webhook" status={row.status} />
            </TableCell>
            <TableCell>
              <StripeModeBadge mode={row.stripeMode} />
            </TableCell>
            <TableCell>
              {row.objectId ? <CopyableStripeId value={row.objectId} /> : "—"}
            </TableCell>
            <TableCell className="text-sm tabular-nums">
              {row.attemptCount}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(row.receivedAt).toLocaleString("fr-CA")}
            </TableCell>
            <TableCell className="text-destructive max-w-[12rem] truncate text-xs">
              {row.lastErrorSafe ?? "—"}
            </TableCell>
            <TableCell>
              {canRetry &&
              (row.status === "failed" || row.status === "ignored") ? (
                <form
                  action={formAction}
                  className="flex min-w-[12rem] flex-col gap-1"
                  onSubmit={() => setActiveId(row.id)}
                >
                  <input type="hidden" name="webhookEventId" value={row.id} />
                  <input
                    type="hidden"
                    name="idempotencyKey"
                    value={crypto.randomUUID()}
                  />
                  <Label className="sr-only" htmlFor={`reason-${row.id}`}>
                    Motif
                  </Label>
                  <Textarea
                    id={`reason-${row.id}`}
                    name="reason"
                    required
                    minLength={3}
                    rows={1}
                    placeholder="Motif…"
                    className="min-h-8 text-xs"
                  />
                  <label className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <Input
                      type="checkbox"
                      name="syncObject"
                      value="true"
                      className="size-3"
                    />
                    Sync objet
                  </label>
                  <Button
                    type="submit"
                    size="xs"
                    variant="outline"
                    disabled={pending && activeId === row.id}
                  >
                    Relancer
                  </Button>
                </form>
              ) : (
                <CopyableStripeId value={row.stripeEventId} label="evt" />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
