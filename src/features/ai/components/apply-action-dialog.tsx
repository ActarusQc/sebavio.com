"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ProposedTripAction } from "@/features/ai/schemas/actions";

export function ApplyActionDialog({
  action,
  open,
  onOpenChange,
  onConfirm,
  description,
}: {
  action: ProposedTripAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  description: {
    title: string;
    details: string[];
    applicable: boolean;
  } | null;
}) {
  if (!action || !description) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la modification</DialogTitle>
          <DialogDescription>
            Vérifiez ce qui sera enregistré avant d’appliquer. L’IA ne modifie
            jamais le voyage toute seule.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p className="text-sebavio-navy font-medium">{description.title}</p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5">
            {description.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          {!description.applicable ? (
            <p className="text-amber-800">
              Cette action n’est pas encore applicable automatiquement.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!description.applicable}
            onClick={onConfirm}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
