"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { createRefundAction } from "@/features/billing/actions";
import type { BillingActionResult } from "@/features/billing/types";
import {
  REFUND_STRIPE_REASON_LABELS,
  REFUND_STRIPE_REASONS,
} from "@/features/billing/constants";
import {
  amountMajorFromCents,
  formatMoneyCents,
} from "@/features/billing/lib/format";
import { refundLiveConfirmationPhrase } from "@/features/billing/lib/live-confirmation";
import type { PaymentListItem } from "@/features/billing/types";
import { StripeModeBadge } from "@/features/billing/components/stripe-mode-badge";

const initial: BillingActionResult | undefined = undefined;

type Props = {
  payment: PaymentListItem;
  isLive: boolean;
};

function RefundDialogBody({ payment, isLive }: Props) {
  const [full, setFull] = useState(true);
  const [amountCents, setAmountCents] = useState(
    String(payment.refundableAmount),
  );
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const formId = useId();

  const [state, formAction, pending] = useActionState(
    createRefundAction,
    initial,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  const effectiveAmount = full
    ? payment.refundableAmount
    : Number.parseInt(amountCents, 10) || 0;
  const confirmationPhrase = refundLiveConfirmationPhrase(
    amountMajorFromCents(effectiveAmount),
    payment.currency,
  );

  if (state?.ok) {
    return (
      <p className="text-sm text-green-700 dark:text-green-400">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="paymentId" value={payment.id} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="full" value={full ? "true" : "false"} />

      <div className="flex items-center gap-2 text-sm">
        <StripeModeBadge mode={payment.stripeMode} />
        <span className="text-muted-foreground text-xs">
          Remboursable :{" "}
          {formatMoneyCents(payment.refundableAmount, payment.currency)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Type</Label>
        <select
          className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
          value={full ? "full" : "partial"}
          onChange={(e) => setFull(e.target.value === "full")}
        >
          <option value="full">Total</option>
          <option value="partial">Partiel</option>
        </select>
      </div>

      {!full ? (
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${formId}-amount`}>Montant (cents)</Label>
          <Input
            id={`${formId}-amount`}
            name="amountCents"
            type="number"
            min={1}
            max={payment.refundableAmount}
            value={amountCents}
            onChange={(e) => setAmountCents(e.target.value)}
            required
          />
        </div>
      ) : (
        <input
          type="hidden"
          name="amountCents"
          value={payment.refundableAmount}
        />
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${formId}-stripe-reason`}>
          Raison Stripe (optionnel)
        </Label>
        <select
          id={`${formId}-stripe-reason`}
          name="stripeReason"
          className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
          defaultValue=""
        >
          <option value="">—</option>
          {REFUND_STRIPE_REASONS.map((r) => (
            <option key={r} value={r}>
              {REFUND_STRIPE_REASON_LABELS[r] ?? r}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`${formId}-reason`}>
          Justification interne (obligatoire)
        </Label>
        <Textarea
          id={`${formId}-reason`}
          name="reason"
          required
          minLength={3}
          rows={2}
        />
      </div>

      {isLive ? (
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${formId}-confirm`}>
            Confirmation Live — tapez{" "}
            <code className="text-xs">{confirmationPhrase}</code>
          </Label>
          <Input
            id={`${formId}-confirm`}
            name="confirmation"
            autoComplete="off"
            required
          />
        </div>
      ) : (
        <input type="hidden" name="confirmation" value="" />
      )}

      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Traitement…" : "Confirmer le remboursement"}
      </Button>
    </form>
  );
}

export function RefundDialog({ payment, isLive }: Props) {
  const [open, setOpen] = useState(false);
  const [epoch, setEpoch] = useState(0);

  if (payment.refundableAmount <= 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setEpoch((e) => e + 1);
      }}
    >
      <DialogTrigger
        render={<Button type="button" variant="destructive" size="sm" />}
      >
        Rembourser
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remboursement</DialogTitle>
          <DialogDescription>
            {payment.userEmail} — reçu{" "}
            {formatMoneyCents(payment.amountReceived, payment.currency)}
          </DialogDescription>
        </DialogHeader>

        <RefundDialogBody key={epoch} payment={payment} isLive={isLive} />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
