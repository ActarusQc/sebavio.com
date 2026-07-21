"use client";

import { useId, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";
import { STOP_TYPES } from "@/features/trips/constants";
import { cn } from "@/lib/utils";

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 bg-background text-foreground h-11 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3";

type TripAddStopCardProps = {
  tripId: string;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
};

export function TripAddStopCard({
  tripId,
  pending,
  onSubmit,
}: TripAddStopCardProps) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const panelId = `${baseId}-panel`;

  return (
    <section
      className="trip-card overflow-hidden p-0"
      data-testid="trip-add-stop-card"
    >
      <button
        type="button"
        className="focus-visible:ring-sebavio-teal flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="bg-sebavio-orange-soft text-sebavio-orange flex size-9 items-center justify-center rounded-full"
          aria-hidden
        >
          <Plus className="size-4" />
        </span>
        <span className="text-sebavio-navy flex-1 text-sm font-semibold">
          Ajouter une étape
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <form
          id={panelId}
          className="grid gap-3 border-t border-[rgb(14_45_70/0.08)] px-4 py-4"
          action={onSubmit}
        >
          <input type="hidden" name="tripId" value={tripId} />
          <FormField htmlFor={`${baseId}-name`} label="Nom" required>
            <Input
              id={`${baseId}-name`}
              name="name"
              required
              maxLength={200}
              className="min-h-11 w-full"
            />
          </FormField>
          <FormField htmlFor={`${baseId}-type`} label="Type">
            <select
              id={`${baseId}-type`}
              name="stopType"
              className={selectClassName}
              defaultValue="stop"
            >
              {STOP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor={`${baseId}-address`} label="Adresse ou lieu">
            <AddressAutocomplete
              id={`${baseId}-address`}
              name="address"
              placeholder="Ex. 123 rue Principale, Québec"
              className="w-full"
            />
          </FormField>
          <Button
            type="submit"
            disabled={pending}
            className="bg-sebavio-navy hover:bg-sebavio-navy/90 min-h-11 text-white"
          >
            Ajouter l&apos;étape
          </Button>
        </form>
      ) : null}
    </section>
  );
}
