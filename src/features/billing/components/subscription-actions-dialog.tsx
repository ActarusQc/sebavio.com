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
import {
  cancelSubscriptionAction,
  resumeSubscriptionAction,
} from "@/features/billing/actions";
import type { BillingActionResult } from "@/features/billing/types";
import { cancelLiveConfirmationPhrase } from "@/features/billing/lib/live-confirmation";
import { formatMoneyCents } from "@/features/billing/lib/format";
import type { SubscriptionListItem } from "@/features/billing/types";
import { StripeModeBadge } from "@/features/billing/components/stripe-mode-badge";

const initial: BillingActionResult | undefined = undefined;

type Props = {
  subscription: SubscriptionListItem;
  canCancel: boolean;
  canResume: boolean;
  isLive: boolean;
};

function SubscriptionActionsBody({
  subscription,
  canCancel,
  canResume,
  isLive,
}: Props) {
  const [mode, setMode] = useState<"at_period_end" | "immediately">(
    "at_period_end",
  );
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const formId = useId();

  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelSubscriptionAction,
    initial,
  );
  const [resumeState, resumeAction, resumePending] = useActionState(
    resumeSubscriptionAction,
    initial,
  );

  useEffect(() => {
    const state = cancelState ?? resumeState;
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [cancelState, resumeState]);

  const confirmationPhrase = cancelLiveConfirmationPhrase(
    subscription.userEmail,
  );
  const pending = cancelPending || resumePending;
  const succeeded = Boolean(cancelState?.ok || resumeState?.ok);

  if (succeeded) {
    return (
      <p className="text-sm text-green-700 dark:text-green-400">
        {(cancelState?.ok ? cancelState.message : null) ?? resumeState?.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center gap-2">
        <StripeModeBadge mode={subscription.stripeMode} />
        {subscription.cancelAtPeriodEnd ? (
          <span className="text-warning-foreground text-xs">
            Annulation déjà planifiée
          </span>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        Fin de période :{" "}
        {subscription.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd).toLocaleString("fr-CA")
          : "—"}
      </p>

      {canCancel && !subscription.cancelAtPeriodEnd ? (
        <form
          id={formId}
          action={cancelAction}
          className="flex flex-col gap-3 border-t pt-3"
        >
          <input type="hidden" name="subscriptionId" value={subscription.id} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <input type="hidden" name="mode" value={mode} />

          <div className="flex flex-col gap-1">
            <Label>Type d&apos;annulation</Label>
            <select
              className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
              value={mode}
              onChange={(e) =>
                setMode(e.target.value as "at_period_end" | "immediately")
              }
            >
              <option value="at_period_end">Fin de période</option>
              <option value="immediately">Immédiate</option>
            </select>
          </div>

          {mode === "immediately" ? (
            <p className="text-destructive text-xs">
              Accès potentiellement perdu immédiatement. Aucun remboursement
              automatique.
            </p>
          ) : null}

          <div className="flex flex-col gap-1">
            <Label htmlFor={`${formId}-reason`}>Motif (obligatoire)</Label>
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
            {pending ? "Traitement…" : "Annuler l'abonnement"}
          </Button>
        </form>
      ) : null}

      {canResume && subscription.cancelAtPeriodEnd ? (
        <form
          action={resumeAction}
          className="flex flex-col gap-3 border-t pt-3"
        >
          <input type="hidden" name="subscriptionId" value={subscription.id} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${formId}-resume-reason`}>Motif</Label>
            <Textarea
              id={`${formId}-resume-reason`}
              name="reason"
              required
              minLength={3}
              rows={2}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Traitement…" : "Reprendre l'abonnement"}
          </Button>
        </form>
      ) : null}

      {!canCancel && !canResume ? (
        <p className="text-muted-foreground text-xs">
          Aucune action disponible pour votre rôle.
        </p>
      ) : null}
    </div>
  );
}

export function SubscriptionActionsDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [epoch, setEpoch] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setEpoch((e) => e + 1);
      }}
    >
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" />}
      >
        Actions
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Actions abonnement</DialogTitle>
          <DialogDescription>
            {props.subscription.userEmail} —{" "}
            {formatMoneyCents(
              props.subscription.unitAmount,
              props.subscription.currency,
            )}
          </DialogDescription>
        </DialogHeader>

        <SubscriptionActionsBody key={epoch} {...props} />

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
