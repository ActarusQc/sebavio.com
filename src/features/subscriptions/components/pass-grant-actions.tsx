"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  adminExtendPassAction,
  revokePassGrantAction,
} from "@/features/subscriptions/actions";

type Props = {
  grantId: string;
  status: string;
  canManage: boolean;
};

export function PassGrantActions({ grantId, status, canManage }: Props) {
  if (!canManage) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "revoked" ? <RevokeDialog grantId={grantId} /> : null}
      {status !== "revoked" ? <ExtendDialog grantId={grantId} /> : null}
    </div>
  );
}

function RevokeDialog({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="destructive" />}>
        Révoquer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Révoquer le Pass</DialogTitle>
          <DialogDescription>
            Le droit d&apos;accès sera immédiatement révoqué. Un motif est
            obligatoire (journal d&apos;audit).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="revoke-reason">Motif</Label>
          <Textarea
            id="revoke-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || reason.trim().length === 0}
            onClick={() => {
              startTransition(async () => {
                const result = await revokePassGrantAction({
                  grantId,
                  reason: reason.trim(),
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Pass révoqué.");
                setOpen(false);
                router.refresh();
              });
            }}
          >
            {pending ? "Révocation…" : "Confirmer la révocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExtendDialog({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("30");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        Prolonger
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prolonger le Pass</DialogTitle>
          <DialogDescription>
            Les jours sont empilés sur la date de fin actuelle si le Pass est
            encore valide. Motif obligatoire.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="extend-days">Jours</Label>
            <Input
              id="extend-days"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="extend-reason">Motif</Label>
            <Textarea
              id="extend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={
              pending ||
              reason.trim().length === 0 ||
              !Number.isInteger(Number(days)) ||
              Number(days) < 1
            }
            onClick={() => {
              startTransition(async () => {
                const result = await adminExtendPassAction({
                  grantId,
                  days: Number(days),
                  reason: reason.trim(),
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Pass prolongé.");
                setOpen(false);
                router.refresh();
              });
            }}
          >
            {pending ? "Prolongation…" : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
