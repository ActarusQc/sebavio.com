"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";
import {
  applyPlanSyncAction,
  previewPlanSyncAction,
} from "@/features/plans/actions";
import type {
  PlanSyncProposedAction,
  PlanSyncReport,
} from "@/features/plans/services/plan-sync";

type Props = {
  canManage: boolean;
};

type Step = "idle" | "preview" | "done";

function actionLabel(action: PlanSyncProposedAction): string {
  if (action.actionType === "import_product") {
    const name =
      typeof action.payload.publicName === "string"
        ? action.payload.publicName
        : typeof action.payload.name === "string"
          ? action.payload.name
          : action.actionKey;
    return `Importer : ${name}`;
  }
  if (action.actionType === "update_price_mirror") {
    return `Mettre à jour le miroir prix : ${action.actionKey}`;
  }
  return action.actionKey;
}

export function SyncPlansDialog({ canManage }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [report, setReport] = useState<PlanSyncReport | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const proposed = useMemo(() => {
    if (!report) return [] as PlanSyncProposedAction[];
    return [...report.toCreateLocally, ...report.toUpdate];
  }, [report]);

  const reset = useCallback(() => {
    setStep("idle");
    setReport(null);
    setSelected(new Set());
    setError(null);
  }, []);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function runPreview() {
    setError(null);
    startTransition(async () => {
      const result = await previewPlanSyncAction();
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setReport(result.data);
      setSelected(
        new Set(
          result.data.toCreateLocally
            .concat(result.data.toUpdate)
            .map((a) => a.actionKey),
        ),
      );
      setStep("preview");
    });
  }

  function toggleKey(key: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function runApply() {
    if (!report || !canManage) return;
    setError(null);
    const confirmedActions = proposed
      .filter((a) => selected.has(a.actionKey))
      .map((a) => ({
        actionKey: a.actionKey,
        actionType: a.actionType,
        payload: a.payload,
      }));

    startTransition(async () => {
      const result = await applyPlanSyncAction({
        syncRunId: report.syncRunId,
        confirmedActions,
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(
        `Synchronisation terminée — appliquées : ${result.data.applied.length}, ignorées : ${result.data.skipped.length}, échecs : ${result.data.failed.length}.`,
      );
      setStep("done");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        Synchroniser avec Stripe
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Synchroniser avec Stripe</DialogTitle>
          <DialogDescription>
            Prévisualisez les écarts, puis appliquez uniquement les actions
            cochées. Aucune action destructive n’est exécutée implicitement.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}

        {step === "idle" ? (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              La prévisualisation est en lecture seule et n’écrit pas dans
              Stripe ni ne modifie les entitlements.
            </p>
            <DialogFooter>
              <Button type="button" onClick={runPreview} disabled={pending}>
                {pending ? "Analyse…" : "Prévisualiser"}
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === "preview" && report ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-xs">
              Mode {report.stripeMode} · sync{" "}
              <code className="bg-muted rounded px-1 font-mono text-[10px]">
                {report.syncRunId.slice(0, 8)}…
              </code>
            </p>

            {proposed.length === 0 ? (
              <p className="text-sm">
                Aucune action proposée. Les catalogues sont alignés.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {proposed.map((action) => (
                  <li
                    key={action.actionKey}
                    className="border-border flex items-start gap-2 rounded-md border p-2 text-sm"
                  >
                    <Checkbox
                      checked={selected.has(action.actionKey)}
                      disabled={!canManage || pending}
                      onCheckedChange={(v) =>
                        toggleKey(action.actionKey, v === true)
                      }
                      aria-label={actionLabel(action)}
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{actionLabel(action)}</p>
                      <p className="text-muted-foreground font-mono text-[10px]">
                        {action.actionType}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {report.inconsistencies.length > 0 ? (
              <div className="border-warning/40 bg-warning/10 rounded-md border px-3 py-2 text-xs">
                <p className="font-medium">Incohérences (non appliquées)</p>
                <ul className="mt-1 list-disc pl-4">
                  {report.inconsistencies.map((item, i) => (
                    <li key={`${item.code}-${i}`}>{item.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {report.ignored.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                {report.ignored.length} produit(s) ignoré(s) (hors Sebavio /
                autre mode).
              </p>
            ) : null}

            {report.errors.length > 0 ? (
              <div className="text-destructive text-xs">
                {report.errors.map((e, i) => (
                  <p key={i}>{e.message}</p>
                ))}
              </div>
            ) : null}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={reset}
                disabled={pending}
              >
                Recommencer
              </Button>
              {canManage ? (
                <Button
                  type="button"
                  onClick={runApply}
                  disabled={pending || selected.size === 0}
                >
                  {pending ? "Application…" : `Appliquer (${selected.size})`}
                </Button>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Lecture seule — l’application requiert plans.manage.
                </p>
              )}
            </DialogFooter>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-green-700 dark:text-green-400">
              Synchronisation appliquée. Rechargez la page pour voir les
              changements.
            </p>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  window.location.reload();
                }}
              >
                Fermer et actualiser
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
