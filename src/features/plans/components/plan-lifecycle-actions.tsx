"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import {
  archivePlanAction,
  deletePlanAction,
  duplicatePlanAction,
  getPlanDeleteImpactAction,
  hidePlanAction,
  reconcilePlanAction,
} from "@/features/plans/actions";
import type { PlanDeleteImpact } from "@/features/plans/lib/plan-delete-types";
import { formatMoneyCents } from "@/features/billing/lib/format";

type PriceSummaryProp = {
  billingType: string;
  interval: string;
  intervalCount: number;
  unitAmount: number;
  currency: string;
  isCurrent: boolean;
  accessDurationDays: number | null;
};

type Props = {
  planId: string;
  status: string;
  publicName: string;
  internalName: string;
  isSystemProtected: boolean;
  prices: PriceSummaryProp[];
};

export function PlanLifecycleActions({
  planId,
  status,
  publicName,
  internalName,
  isSystemProtected,
  prices,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const archived = status === "archived";
  const needsReconcile = status === "pending_reconciliation";

  return (
    <div className="flex flex-wrap gap-2">
      {!archived ? (
        <HideDialog
          planId={planId}
          pending={pending}
          startTransition={startTransition}
          onDone={() => {
            router.refresh();
          }}
        />
      ) : null}
      {!archived ? (
        <ArchiveDialog
          planId={planId}
          pending={pending}
          startTransition={startTransition}
          onDone={() => {
            router.refresh();
          }}
        />
      ) : null}
      <DeleteDialog
        planId={planId}
        publicName={publicName}
        internalName={internalName}
        isSystemProtected={isSystemProtected}
        prices={prices}
        pending={pending}
        startTransition={startTransition}
        onDone={() => {
          router.push("/admin/plans");
          router.refresh();
        }}
      />
      <DuplicateDialog
        planId={planId}
        publicName={publicName}
        pending={pending}
        startTransition={startTransition}
        onCreated={(newId) => {
          router.push(`/admin/plans/${newId}`);
          router.refresh();
        }}
      />
      {needsReconcile ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await reconcilePlanAction({ planId });
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Réconciliation terminée.");
              router.refresh();
            });
          }}
        >
          {pending ? "Réconciliation…" : "Réconcilier"}
        </Button>
      ) : null}
    </div>
  );
}

function HideDialog({
  planId,
  pending,
  startTransition,
  onDone,
}: {
  planId: string;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        Masquer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Masquer le forfait</DialogTitle>
          <DialogDescription>
            Le forfait ne sera plus proposé aux nouveaux clients. Les abonnés
            existants restent inchangés.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hide-reason">Raison</Label>
          <Textarea
            id="hide-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={pending || reason.trim().length < 1}
            onClick={() => {
              startTransition(async () => {
                const result = await hidePlanAction({ planId, reason });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Forfait masqué.");
                setOpen(false);
                onDone();
              });
            }}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveDialog({
  planId,
  pending,
  startTransition,
  onDone,
}: {
  planId: string;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [archiveStripe, setArchiveStripe] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="destructive" />}>
        Archiver
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archiver le forfait</DialogTitle>
          <DialogDescription>
            Action irréversible en Phase 4. Aucune migration d’abonnements.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="archive-reason">Raison</Label>
            <Textarea
              id="archive-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={archiveStripe}
              onCheckedChange={(v) => setArchiveStripe(v === true)}
              className="mt-0.5"
            />
            <span>Archiver aussi le produit Stripe (active: false)</span>
          </label>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || reason.trim().length < 1}
            onClick={() => {
              startTransition(async () => {
                const result = await archivePlanAction({
                  planId,
                  reason,
                  archiveStripeProduct: archiveStripe,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Forfait archivé.");
                setOpen(false);
                onDone();
              });
            }}
          >
            Confirmer l’archivage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatPriceLine(p: PriceSummaryProp): string {
  const amount = formatMoneyCents(p.unitAmount, p.currency);
  if (p.billingType === "one_time" || p.interval === "one_time") {
    const days =
      p.accessDurationDays != null ? ` · ${p.accessDurationDays} j` : "";
    return `Unique — ${amount}${days}`;
  }
  return `${p.interval}/${p.intervalCount} — ${amount}`;
}

function DeleteDialog({
  planId,
  publicName,
  internalName,
  isSystemProtected,
  prices,
  pending,
  startTransition,
  onDone,
}: {
  planId: string;
  publicName: string;
  internalName: string;
  isSystemProtected: boolean;
  prices: PriceSummaryProp[];
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [confirmSystem, setConfirmSystem] = useState(false);
  const [reason, setReason] = useState("");
  const [impact, setImpact] = useState<PlanDeleteImpact | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmName("");
      setConfirmSystem(false);
      setReason("");
      setImpact(null);
      setLoadingImpact(false);
      return;
    }
    setLoadingImpact(true);
    setImpact(null);
    void getPlanDeleteImpactAction({ planId }).then((result) => {
      setLoadingImpact(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setImpact(result.data);
    });
  }

  const nameMatches = confirmName === publicName;
  const systemOk = !isSystemProtected || confirmSystem;
  const hardBlocked =
    impact != null &&
    (impact.subscriptionsTotal > 0 ||
      impact.purchasesCount > 0 ||
      impact.accessGrantsCount > 0 ||
      (!impact.canDelete && !isSystemProtected));
  const canSubmit =
    nameMatches &&
    systemOk &&
    !pending &&
    !loadingImpact &&
    impact != null &&
    impact.subscriptionsTotal === 0 &&
    impact.purchasesCount === 0 &&
    impact.accessGrantsCount === 0 &&
    (impact.canDelete || isSystemProtected);

  const displayPrices =
    impact?.priceSummaries?.length && impact.priceSummaries.length > 0
      ? impact.priceSummaries
      : prices;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="destructive" />}>
        Supprimer
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supprimer définitivement</DialogTitle>
          <DialogDescription>
            Irréversible. Préférez l’archivage s’il existe un historique
            financier ou des abonnés.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <dl className="space-y-1">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="font-medium">{publicName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono text-xs">{internalName}</dd>
            </div>
          </dl>

          <div>
            <p className="mb-1 font-medium">Tarifs</p>
            {displayPrices.length === 0 ? (
              <p className="text-muted-foreground">Aucun tarif (gratuit).</p>
            ) : (
              <ul className="text-muted-foreground list-inside list-disc">
                {displayPrices.map((p, i) => (
                  <li key={`${p.interval}-${p.unitAmount}-${i}`}>
                    {formatPriceLine(p)}
                    {p.isCurrent ? " (courant)" : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {loadingImpact ? (
            <p className="text-muted-foreground">Chargement de l’impact…</p>
          ) : impact ? (
            <ul className="border-border space-y-1 rounded-md border p-3">
              <li>Prix locaux : {impact.pricesCount}</li>
              <li>
                Abonnements Stripe : {impact.subscriptionsTotal} (actifs :{" "}
                {impact.activeSubscriptions})
              </li>
              <li>Achats : {impact.purchasesCount}</li>
              <li>
                Droits d’accès : {impact.accessGrantsCount} (actifs :{" "}
                {impact.activeGrantsCount})
              </li>
              <li>Utilisateurs couverts : {impact.usersCovered}</li>
            </ul>
          ) : null}

          {impact &&
          (impact.subscriptionsTotal > 0 ||
            impact.purchasesCount > 0 ||
            impact.accessGrantsCount > 0) ? (
            <p
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2"
            >
              Suppression impossible. Archivez le forfait à la place.
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-confirm-name">
              Tapez le nom public exact « {publicName} »
            </Label>
            <Input
              id="delete-confirm-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoComplete="off"
            />
          </div>

          {isSystemProtected ? (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={confirmSystem}
                onCheckedChange={(v) => setConfirmSystem(v === true)}
                className="mt-0.5"
              />
              <span>
                Je confirme la suppression d’un forfait système protégé (
                {internalName}).
              </span>
            </label>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-reason">Raison (optionnel)</Label>
            <Textarea
              id="delete-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit || hardBlocked}
            onClick={() => {
              startTransition(async () => {
                const result = await deletePlanAction({
                  planId,
                  confirmPublicName: confirmName,
                  confirmSystemDelete: isSystemProtected
                    ? confirmSystem
                    : undefined,
                  reason: reason.trim().length > 0 ? reason : undefined,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Forfait supprimé définitivement.");
                setOpen(false);
                onDone();
              });
            }}
          >
            {pending ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DuplicateDialog({
  planId,
  publicName,
  pending,
  startTransition,
  onCreated,
}: {
  planId: string;
  publicName: string;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [internalName, setInternalName] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        Dupliquer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dupliquer « {publicName} »</DialogTitle>
          <DialogDescription>
            Crée un nouveau forfait à partir des prix courants et entitlements.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dup-internal">Nouvel identifiant interne</Label>
          <Input
            id="dup-internal"
            value={internalName}
            onChange={(e) => setInternalName(e.target.value)}
            placeholder="premium_copy"
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={pending || internalName.trim().length < 1}
            onClick={() => {
              startTransition(async () => {
                const result = await duplicatePlanAction({
                  planId,
                  internalName,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Forfait dupliqué.");
                setOpen(false);
                onCreated(result.data.planId);
              });
            }}
          >
            Dupliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
