"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Switch } from "@/components/ui";
import { setPlanEntitlementsAction } from "@/features/plans/actions";
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

type Props = {
  planId: string;
  initial: Array<{
    key: string;
    enabled: boolean;
    limit: number | null;
    value: string | null;
  }>;
};

export function PlanEntitlementsForm({ planId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const groups = useMemo(() => listEntitlementsByCategory(), []);
  const [error, setError] = useState<string | null>(null);

  const [entitlements, setEntitlements] = useState<
    Record<string, EntitlementDraft>
  >(() => {
    const map: Record<string, EntitlementDraft> = {};
    for (const g of listEntitlementsByCategory()) {
      for (const d of g.definitions) {
        const existing = initial.find((e) => e.key === d.key);
        map[d.key] = {
          enabled: existing?.enabled ?? false,
          limit: existing?.limit == null ? "" : String(existing.limit),
          value: existing?.value ?? "",
        };
      }
    }
    return map;
  });

  function update(key: PlanEntitlementKey, patch: Partial<EntitlementDraft>) {
    setEntitlements((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = Object.entries(entitlements).map(([key, v]) => ({
      key: key as PlanEntitlementKey,
      enabled: v.enabled,
      limit: v.limit.trim() === "" ? null : Number.parseInt(v.limit, 10),
      value: v.value.trim() === "" ? null : v.value.trim(),
    }));

    for (const item of payload) {
      if (
        item.limit != null &&
        (!Number.isInteger(item.limit) || item.limit < 0)
      ) {
        setError(`Limite invalide pour ${item.key}.`);
        return;
      }
    }

    startTransition(async () => {
      const result = await setPlanEntitlementsAction({
        planId,
        entitlements: payload,
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Fonctionnalités enregistrées.");
      router.push(`/admin/plans/${planId}`);
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
      {groups.map((group) => (
        <PlanFormSection key={group.category} title={group.label}>
          <div className="flex flex-col gap-3">
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
                      onCheckedChange={(v) => update(def.key, { enabled: v })}
                    />
                  </div>
                  {def.valueType === "limit" ? (
                    <Input
                      type="number"
                      min={0}
                      placeholder="Limite (vide = illimité)"
                      value={draft?.limit ?? ""}
                      onChange={(e) =>
                        update(def.key, { limit: e.target.value })
                      }
                    />
                  ) : null}
                  {def.valueType === "string" ? (
                    <Input
                      placeholder="Valeur"
                      value={draft?.value ?? ""}
                      onChange={(e) =>
                        update(def.key, { value: e.target.value })
                      }
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </PlanFormSection>
      ))}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
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
