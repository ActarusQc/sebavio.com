"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Checkbox, Input, Label } from "@/components/ui";
import { createPlanPriceAction } from "@/features/plans/actions";
import { PlanFormSection } from "@/features/plans/components/plan-form-section";

function dollarsToCents(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

type Props = {
  planId: string;
  activeSubscribers: number;
};

export function CreatePlanPriceForm({ planId, activeSubscribers }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [operationId] = useState(() => crypto.randomUUID());
  const [amountDollars, setAmountDollars] = useState("");
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [archivePrevious, setArchivePrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cents = dollarsToCents(amountDollars);
    if (cents == null) {
      setError("Montant invalide.");
      return;
    }

    startTransition(async () => {
      const result = await createPlanPriceAction({
        planId,
        unitAmount: cents,
        currency: "cad",
        interval,
        intervalCount: 1,
        archivePreviousForNewSubscribers: archivePrevious,
        operationId,
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Nouveau tarif créé.");
      router.push(`/admin/plans/${planId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {activeSubscribers > 0 ? (
        <p
          role="status"
          className="border-warning/40 bg-warning/10 text-warning-foreground rounded-md border px-3 py-2 text-sm"
        >
          Ce forfait est utilisé par {activeSubscribers} abonné
          {activeSubscribers === 1 ? "" : "s"} actif
          {activeSubscribers === 1 ? "" : "s"}. Les modifications de prix ne
          modifieront pas automatiquement leurs abonnements actuels.
        </p>
      ) : null}

      <PlanFormSection
        title="Nouveau tarif Stripe"
        description="Un nouveau Price Stripe sera créé. Les abonnements existants conservent leur ancien price_id — aucune migration automatique."
      >
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Montant (CAD)</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={amountDollars}
              onChange={(e) => setAmountDollars(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="interval">Intervalle</Label>
            <select
              id="interval"
              className="border-input h-9 rounded-lg border bg-transparent px-2.5 text-sm"
              value={interval}
              onChange={(e) =>
                setInterval(e.target.value === "year" ? "year" : "month")
              }
            >
              <option value="month">Mensuel</option>
              <option value="year">Annuel</option>
            </select>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={archivePrevious}
            onCheckedChange={(v) => setArchivePrevious(v === true)}
            className="mt-0.5"
          />
          <span>
            Désactiver l’ancien Price Stripe pour les nouveaux abonnés
            (archivePreviousForNewSubscribers). Les abonnements déjà actifs ne
            sont pas migrés.
          </span>
        </label>

        <p className="text-muted-foreground font-mono text-[10px]">
          operationId : {operationId}
        </p>
      </PlanFormSection>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer le tarif"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/plans/${planId}`)}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
