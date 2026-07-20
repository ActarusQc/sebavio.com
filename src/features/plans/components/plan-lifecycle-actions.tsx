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
  duplicatePlanAction,
  hidePlanAction,
  reconcilePlanAction,
} from "@/features/plans/actions";

type Props = {
  planId: string;
  status: string;
  publicName: string;
};

export function PlanLifecycleActions({ planId, status, publicName }: Props) {
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
