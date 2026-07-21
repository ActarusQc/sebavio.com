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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function RestartPlanningDialog({
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recommencer la planification ?</DialogTitle>
          <DialogDescription>
            La conversation et le brouillon en cours seront réinitialisés. Un
            voyage déjà créé ne sera pas supprimé.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="bg-sebavio-navy hover:bg-sebavio-navy/90 text-white"
          >
            Recommencer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
