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
import {
  formatDateRangeFr,
  formatTravelers,
} from "@/features/ai-trip-planner/lib/format";
import type { TripDraft } from "@/features/ai-trip-planner/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: TripDraft;
  creating?: boolean;
  onConfirm: () => void;
};

export function CreateTripConfirmationDialog({
  open,
  onOpenChange,
  draft,
  creating,
  onConfirm,
}: Props) {
  const dates = formatDateRangeFr(draft.departureDate, draft.returnDate);
  const travelers = formatTravelers(draft);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer ce voyage ?</DialogTitle>
          <DialogDescription>
            Un véritable voyage Sebavio sera créé avec les informations validées
            pendant la conversation.
          </DialogDescription>
          <ul className="text-sebavio-navy list-inside list-disc space-y-1 text-sm">
            {draft.title ? <li>{draft.title}</li> : null}
            {draft.origin.name && draft.destination.name ? (
              <li>
                {draft.origin.name} → {draft.destination.name}
              </li>
            ) : null}
            {dates ? <li>{dates}</li> : null}
            {travelers ? <li>{travelers}</li> : null}
            {draft.vehicleLabel ? <li>{draft.vehicleLabel}</li> : null}
          </ul>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={creating}
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={creating}
            onClick={onConfirm}
            className="bg-sebavio-navy hover:bg-sebavio-navy/90 text-white"
          >
            {creating ? "Création…" : "Confirmer la création"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
