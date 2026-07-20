"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Label, Switch, Textarea } from "@/components/ui";
import { createPlanAction } from "@/features/plans/actions";
import {
  listEntitlementsByCategory,
  type PlanEntitlementKey,
} from "@/features/plans/lib/entitlement-registry";
import { PlanFormSection } from "@/features/plans/components/plan-form-section";

type EntitlementDraft = {
  enabled: boolean;
  limit: string;
  value: string;
};

function dollarsToCents(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function CreatePlanForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const groups = useMemo(() => listEntitlementsByCategory(), []);

  const [internalName, setInternalName] = useState("");
  const [publicName, setPublicName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isVisibleOnSignup, setIsVisibleOnSignup] = useState(true);
  const [defaultTrialDays, setDefaultTrialDays] = useState("");
  const [monthlyDollars, setMonthlyDollars] = useState("19.99");
  const [yearlyDollars, setYearlyDollars] = useState("199.99");
  const [entitlements, setEntitlements] = useState<
    Record<string, EntitlementDraft>
  >(() => {
    const initial: Record<string, EntitlementDraft> = {};
    for (const g of listEntitlementsByCategory()) {
      for (const d of g.definitions) {
        initial[d.key] = { enabled: false, limit: "", value: "" };
      }
    }
    return initial;
  });
  const [error, setError] = useState<string | null>(null);

  function updateEntitlement(
    key: PlanEntitlementKey,
    patch: Partial<EntitlementDraft>,
  ) {
    setEntitlements((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const monthCents = dollarsToCents(monthlyDollars);
    const yearCents = dollarsToCents(yearlyDollars);
    if (monthCents == null || yearCents == null) {
      setError("Les montants mensuel et annuel CAD sont obligatoires.");
      return;
    }

    const entitlementPayload = Object.entries(entitlements)
      .filter(([, v]) => v.enabled || v.limit !== "" || v.value !== "")
      .map(([key, v]) => ({
        key: key as PlanEntitlementKey,
        enabled: v.enabled,
        limit: v.limit.trim() === "" ? null : Number.parseInt(v.limit, 10),
        value: v.value.trim() === "" ? null : v.value.trim(),
      }));

    for (const item of entitlementPayload) {
      if (
        item.limit != null &&
        (!Number.isInteger(item.limit) || item.limit < 0)
      ) {
        setError(`Limite invalide pour ${item.key}.`);
        return;
      }
    }

    startTransition(async () => {
      const result = await createPlanAction({
        internalName,
        publicName,
        shortDescription: shortDescription || undefined,
        fullDescription: fullDescription || undefined,
        displayOrder: Number.parseInt(displayOrder, 10) || 0,
        isFeatured,
        isVisibleOnSignup,
        defaultTrialDays:
          defaultTrialDays.trim() === ""
            ? null
            : Number.parseInt(defaultTrialDays, 10),
        prices: [
          {
            unitAmount: monthCents,
            currency: "cad",
            interval: "month",
            intervalCount: 1,
          },
          {
            unitAmount: yearCents,
            currency: "cad",
            interval: "year",
            intervalCount: 1,
          },
        ],
        entitlements: entitlementPayload,
      });

      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Forfait créé.");
      router.push(`/admin/plans/${result.data.planId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <PlanFormSection
        title="Informations générales"
        description="Métadonnées commerciales Sebavio (hors montants Stripe)."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="internalName">Identifiant interne</Label>
            <Input
              id="internalName"
              value={internalName}
              onChange={(e) => setInternalName(e.target.value)}
              placeholder="premium"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="publicName">Nom public</Label>
            <Input
              id="publicName"
              value={publicName}
              onChange={(e) => setPublicName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="shortDescription">Description courte</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="fullDescription">Description complète</Label>
            <Textarea
              id="fullDescription"
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayOrder">Ordre d’affichage</Label>
            <Input
              id="displayOrder"
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultTrialDays">Essai (jours)</Label>
            <Input
              id="defaultTrialDays"
              type="number"
              min={0}
              value={defaultTrialDays}
              onChange={(e) => setDefaultTrialDays(e.target.value)}
              placeholder="optionnel"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <Label htmlFor="isFeatured">Populaire</Label>
            <Switch
              id="isFeatured"
              checked={isFeatured}
              onCheckedChange={(v) => setIsFeatured(v)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <Label htmlFor="isVisibleOnSignup">Visible à l’inscription</Label>
            <Switch
              id="isVisibleOnSignup"
              checked={isVisibleOnSignup}
              onCheckedChange={(v) => setIsVisibleOnSignup(v)}
            />
          </div>
        </div>
      </PlanFormSection>

      <PlanFormSection
        title="Tarifs CAD"
        description="Un prix mensuel et un prix annuel seront créés dans Stripe (mode courant)."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monthly">Mensuel (CAD)</Label>
            <Input
              id="monthly"
              inputMode="decimal"
              value={monthlyDollars}
              onChange={(e) => setMonthlyDollars(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="yearly">Annuel (CAD)</Label>
            <Input
              id="yearly"
              inputMode="decimal"
              value={yearlyDollars}
              onChange={(e) => setYearlyDollars(e.target.value)}
              required
            />
          </div>
        </div>
      </PlanFormSection>

      <PlanFormSection
        title="Fonctionnalités"
        description="Activez et configurez les entitlements du forfait."
      >
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.category} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">{group.label}</h3>
              {group.definitions.map((def) => {
                const draft = entitlements[def.key];
                return (
                  <div
                    key={def.key}
                    className="border-border flex flex-col gap-2 rounded-md border p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{def.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {def.description}
                        </p>
                      </div>
                      <Switch
                        checked={draft?.enabled ?? false}
                        onCheckedChange={(v) =>
                          updateEntitlement(def.key, { enabled: v })
                        }
                      />
                    </div>
                    {def.valueType === "limit" ? (
                      <Input
                        type="number"
                        min={0}
                        placeholder="Limite (vide = illimité si activé)"
                        value={draft?.limit ?? ""}
                        onChange={(e) =>
                          updateEntitlement(def.key, { limit: e.target.value })
                        }
                      />
                    ) : null}
                    {def.valueType === "string" ? (
                      <Input
                        placeholder="Valeur"
                        value={draft?.value ?? ""}
                        onChange={(e) =>
                          updateEntitlement(def.key, { value: e.target.value })
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </PlanFormSection>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer le forfait"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/plans")}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
