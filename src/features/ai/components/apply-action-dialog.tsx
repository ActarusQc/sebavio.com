"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import type { AddressSelection } from "@/types/address";
import type { ProposedTripAction } from "@/features/ai/schemas/actions";

export function ApplyActionDialog({
  action,
  open,
  onOpenChange,
  onConfirm,
  description,
  locationError,
  largeDetourKm,
}: {
  action: ProposedTripAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (action: ProposedTripAction) => void;
  description: {
    title: string;
    details: string[];
    applicable: boolean;
    needsLocationConfirmation: boolean;
  } | null;
  locationError?: string | null;
  largeDetourKm?: number | null;
}) {
  const [selection, setSelection] = useState<AddressSelection | null>(null);
  const [confirmDetour, setConfirmDetour] = useState(false);

  if (!action || !description) return null;

  const needsLocation = description.needsLocationConfirmation;
  const hasLocation =
    selection?.latitude != null &&
    selection?.longitude != null &&
    Number.isFinite(selection.latitude) &&
    Number.isFinite(selection.longitude);

  const canSubmit =
    description.applicable &&
    (!needsLocation || hasLocation) &&
    (largeDetourKm == null || confirmDetour);

  function handleConfirm() {
    if (!action) return;
    let next = action;
    if (
      needsLocation &&
      selection &&
      (action.type === "add_activity" || action.type === "add_pause")
    ) {
      next = {
        ...action,
        address: selection.formattedAddress || action.address,
        latitude: selection.latitude,
        longitude: selection.longitude,
        locationSource: "user_confirmed",
        locationConfirmed: true,
        confirmLargeDetour: confirmDetour || Boolean(action.confirmLargeDetour),
      };
    } else if (
      largeDetourKm != null &&
      (action.type === "add_activity" || action.type === "add_pause")
    ) {
      next = { ...action, confirmLargeDetour: true };
    }
    onConfirm(next);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setSelection(null);
          setConfirmDetour(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {needsLocation
              ? "Emplacement requis"
              : largeDetourKm != null
                ? "Détour important détecté"
                : "Confirmer la modification"}
          </DialogTitle>
          <DialogDescription>
            {needsLocation
              ? "Sebavio doit confirmer l’emplacement de cette suggestion avant de pouvoir l’ajouter au trajet."
              : largeDetourKm != null
                ? `Cette suggestion ajouterait environ ${largeDetourKm} km au voyage. Vérifiez son emplacement avant de continuer.`
                : "Vérifiez ce qui sera enregistré avant d’appliquer. L’IA ne modifie jamais le voyage toute seule."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-sebavio-navy font-medium">{description.title}</p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5">
            {description.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          {needsLocation ? (
            <div className="space-y-2">
              <label
                className="text-sebavio-navy text-xs font-medium"
                htmlFor="ai-location-search"
              >
                Rechercher ou corriger l’adresse
              </label>
              <AddressAutocomplete
                name="ai-location"
                id="ai-location-search"
                placeholder="Adresse, ville…"
                onAddressSelect={setSelection}
              />
              {hasLocation ? (
                <p className="text-muted-foreground text-xs">
                  Position sélectionnée : {selection?.latitude.toFixed(5)},{" "}
                  {selection?.longitude.toFixed(5)}
                </p>
              ) : null}
            </div>
          ) : null}
          {largeDetourKm != null ? (
            <label className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={confirmDetour}
                onChange={(e) => setConfirmDetour(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Je confirme ce détour d’environ {largeDetourKm} km et souhaite
                continuer.
              </span>
            </label>
          ) : null}
          {locationError ? (
            <p className="rounded-md bg-amber-50 px-2 py-1 text-amber-950">
              {locationError}
            </p>
          ) : null}
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
          <Button type="button" disabled={!canSubmit} onClick={handleConfirm}>
            {needsLocation ? "Confirmer l’emplacement" : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
