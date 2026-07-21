"use client";

import {
  useId,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { GripVertical, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { FormField } from "@/components/common";
import { Button, Checkbox, Input, Textarea } from "@/components/ui";
import {
  DWELL_DURATION_PRESETS,
  STOP_DIRECTION_LABELS,
  STOP_TYPE_LABELS,
  WAYPOINT_STOP_TYPES,
} from "@/features/trips/constants";
import type { TripDetailDto, TripStopDto } from "@/features/trips/types";
import type { AddressSelection } from "@/types/address";
import { cn } from "@/lib/utils";

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 bg-background text-foreground h-11 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3";

type Direction = "outbound" | "return";

type AddPayload = {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  stopType: string;
  direction: Direction;
  durationMinutes: number;
  notes?: string | null;
  alsoAddToReturn?: boolean;
  sequence?: number;
};

type TripItinerarySectionProps = {
  trip: TripDetailDto;
  readonly: boolean;
  recalculating: boolean;
  mapEditMode: boolean;
  onToggleMapEdit: () => void;
  onRecalculate: () => void;
  onAdd: (data: AddPayload) => void;
  onUpdate: (stopId: string, data: Record<string, unknown>) => void;
  onDelete: (stopId: string) => void;
  onReorder: (direction: Direction, orderedIds: string[]) => void;
};

type FormValues = {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  stopType: string;
  direction: Direction;
  durationMinutes: number;
  notes: string;
  alsoAddToReturn: boolean;
};

type FormState = {
  open: boolean;
  mode: "add" | "edit";
  stopId?: string;
  sequence?: number;
  values: FormValues;
};

function emptyForm(direction: Direction): FormValues {
  return {
    name: "",
    address: "",
    latitude: null,
    longitude: null,
    placeId: null,
    stopType: WAYPOINT_STOP_TYPES[0],
    direction,
    durationMinutes: 0,
    notes: "",
    alsoAddToReturn: false,
  };
}

function formFromStop(stop: TripStopDto): FormValues {
  return {
    name: stop.name,
    address: stop.address ?? "",
    latitude: stop.latitude != null ? Number(stop.latitude) : null,
    longitude: stop.longitude != null ? Number(stop.longitude) : null,
    placeId: stop.placeId,
    stopType: stop.stopType,
    direction: stop.direction === "return" ? "return" : "outbound",
    durationMinutes: stop.durationMinutes,
    notes: stop.notes ?? "",
    alsoAddToReturn: false,
  };
}

function sortBySequence(stops: TripStopDto[]): TripStopDto[] {
  return [...stops].sort((a, b) => a.sequence - b.sequence);
}

function formatDwell(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }
  return `${minutes} min`;
}

export function TripItinerarySection({
  trip,
  readonly,
  recalculating,
  mapEditMode,
  onToggleMapEdit,
  onRecalculate,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: TripItinerarySectionProps) {
  const baseId = useId();
  const hasReturn = Boolean(trip.returnDate);

  const [formState, setFormState] = useState<FormState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const outboundStops = useMemo(
    () =>
      sortBySequence(
        trip.stops.filter((s) => (s.direction ?? "outbound") !== "return"),
      ),
    [trip.stops],
  );
  const returnStops = useMemo(
    () => sortBySequence(trip.stops.filter((s) => s.direction === "return")),
    [trip.stops],
  );

  function updateValues(patch: Partial<FormValues>) {
    setFormState((prev) =>
      prev ? { ...prev, values: { ...prev.values, ...patch } } : prev,
    );
  }

  function openAddForm(direction: Direction, sequence?: number) {
    setFormState({
      open: true,
      mode: "add",
      sequence,
      values: emptyForm(direction),
    });
  }

  function openEditForm(stop: TripStopDto) {
    setFormState({
      open: true,
      mode: "edit",
      stopId: stop.id,
      values: formFromStop(stop),
    });
  }

  function closeForm() {
    setFormState(null);
  }

  function handleAddressSelect(selection: AddressSelection | null) {
    if (!selection) {
      updateValues({ latitude: null, longitude: null, placeId: null });
      return;
    }
    setFormState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        values: {
          ...prev.values,
          address: selection.formattedAddress,
          latitude: selection.latitude,
          longitude: selection.longitude,
          placeId: selection.placeId,
          name: prev.values.name.trim()
            ? prev.values.name
            : selection.formattedAddress,
        },
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formState) return;
    const v = formState.values;
    const name = v.name.trim();
    if (!name) return;

    if (formState.mode === "add") {
      onAdd({
        name,
        address: v.address.trim() || null,
        latitude: v.latitude,
        longitude: v.longitude,
        placeId: v.placeId,
        stopType: v.stopType,
        direction: v.direction,
        durationMinutes: v.durationMinutes,
        notes: v.notes.trim() || null,
        alsoAddToReturn:
          v.direction === "outbound" ? v.alsoAddToReturn : undefined,
        sequence: formState.sequence,
      });
    } else if (formState.stopId) {
      onUpdate(formState.stopId, {
        name,
        address: v.address.trim() || null,
        latitude: v.latitude,
        longitude: v.longitude,
        placeId: v.placeId,
        stopType: v.stopType,
        direction: v.direction,
        durationMinutes: v.durationMinutes,
        notes: v.notes.trim() || null,
      });
    }
    closeForm();
  }

  function handleDragStart(event: DragEvent, id: string) {
    setDragId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(event: DragEvent, id: string) {
    event.preventDefault();
    if (dragOverId !== id) setDragOverId(id);
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  function handleDrop(
    event: DragEvent,
    direction: Direction,
    list: TripStopDto[],
    targetId: string,
  ) {
    event.preventDefault();
    const sourceId = dragId ?? event.dataTransfer.getData("text/plain");
    setDragId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const ids = list.map((s) => s.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, sourceId);
    onReorder(direction, next);
  }

  function renderEndpointRow(
    label: string,
    title: string,
    mark: "D" | "A",
    key: string,
  ) {
    return (
      <li
        key={key}
        className="bg-sebavio-navy/[0.03] flex items-center gap-3 border-b border-[rgb(14_45_70/0.08)] p-3 last:border-b-0"
      >
        <span
          className="bg-sebavio-navy flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          aria-hidden
        >
          {mark}
        </span>
        <div className="min-w-0">
          <p className="text-sebavio-navy text-sm font-semibold">{label}</p>
          <p className="text-muted-foreground truncate text-sm">{title}</p>
        </div>
      </li>
    );
  }

  function renderInsertButton(
    direction: Direction,
    sequence: number,
    key: string,
  ) {
    if (readonly) return null;
    return (
      <li
        key={key}
        className="flex justify-center border-b border-[rgb(14_45_70/0.08)] py-1 last:border-b-0"
      >
        <button
          type="button"
          disabled={recalculating}
          className="text-muted-foreground hover:text-sebavio-teal hover:bg-sebavio-teal-soft flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
          onClick={() => openAddForm(direction, sequence)}
        >
          <Plus className="size-3.5" aria-hidden />
          Insérer ici
        </button>
      </li>
    );
  }

  function renderStopRow(
    stop: TripStopDto,
    direction: Direction,
    list: TripStopDto[],
  ) {
    const isDragOver =
      dragOverId === stop.id && dragId != null && dragId !== stop.id;
    return (
      <li
        key={stop.id}
        draggable={!readonly}
        onDragStart={(e) => handleDragStart(e, stop.id)}
        onDragOver={(e) => handleDragOver(e, stop.id)}
        onDrop={(e) => handleDrop(e, direction, list, stop.id)}
        onDragEnd={handleDragEnd}
        data-testid={`trip-itinerary-stop-${stop.id}`}
        className={cn(
          "flex flex-col gap-2 border-b border-[rgb(14_45_70/0.08)] p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between",
          isDragOver && "bg-sebavio-teal-soft/50",
        )}
      >
        <div className="flex min-w-0 items-start gap-2">
          {!readonly ? (
            <span
              className="text-muted-foreground mt-0.5 cursor-grab touch-none active:cursor-grabbing"
              aria-hidden
            >
              <GripVertical className="size-4" />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="text-sebavio-navy font-medium">{stop.name}</p>
            <p className="text-muted-foreground text-sm">
              {STOP_TYPE_LABELS[stop.stopType] ?? stop.stopType}
              {stop.durationMinutes > 0
                ? ` · ${formatDwell(stop.durationMinutes)} sur place`
                : ""}
            </p>
            {stop.address ? (
              <p className="text-muted-foreground truncate text-sm">
                {stop.address}
              </p>
            ) : null}
            {stop.notes ? (
              <p className="text-muted-foreground text-xs italic">
                {stop.notes}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="bg-sebavio-teal-soft text-sebavio-teal rounded-full px-2 py-0.5 text-[11px] font-medium">
            {STOP_DIRECTION_LABELS[direction]}
          </span>
          {!readonly ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={recalculating}
                onClick={() => openEditForm(stop)}
                aria-label={`Modifier ${stop.name}`}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={recalculating}
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(stop.id)}
                aria-label={`Retirer ${stop.name}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          ) : null}
        </div>
      </li>
    );
  }

  function buildLegItems(
    direction: Direction,
    stops: TripStopDto[],
    startLabel: string,
    startTitle: string,
    startMark: "D" | "A",
    endLabel: string,
    endTitle: string,
    endMark: "D" | "A",
  ): ReactNode[] {
    const items: ReactNode[] = [];
    items.push(
      renderEndpointRow(
        startLabel,
        startTitle,
        startMark,
        `${direction}-start`,
      ),
    );
    items.push(renderInsertButton(direction, 1, `${direction}-insert-0`));
    stops.forEach((stop, i) => {
      items.push(renderStopRow(stop, direction, stops));
      items.push(
        renderInsertButton(direction, i + 2, `${direction}-insert-${i + 1}`),
      );
    });
    items.push(
      renderEndpointRow(endLabel, endTitle, endMark, `${direction}-end`),
    );
    return items;
  }

  const outboundItems = buildLegItems(
    "outbound",
    outboundStops,
    "Départ",
    trip.origin,
    "D",
    "Destination",
    trip.destination,
    "A",
  );

  const returnItems = hasReturn
    ? buildLegItems(
        "return",
        returnStops,
        "Départ du retour",
        trip.destination,
        "D",
        "Arrivée",
        trip.origin,
        "A",
      )
    : [];

  return (
    <section
      className="trip-card relative scroll-mt-28 overflow-hidden p-5 sm:scroll-mt-32 sm:p-6"
      id="trip-itinerary-section"
      data-testid="trip-itinerary-section"
      aria-labelledby="trip-itinerary-title"
    >
      {recalculating ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 backdrop-blur-sm"
          role="status"
        >
          <div className="text-sebavio-navy flex items-center gap-2 text-sm font-medium">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Recalcul de l&apos;itinéraire, du carburant et des arrêts…
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="trip-itinerary-title"
          className="font-heading text-sebavio-navy text-lg font-semibold"
        >
          Itinéraire
        </h2>
        {!readonly ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-sebavio-navy/20 min-h-11"
              disabled={recalculating}
              aria-pressed={mapEditMode}
              onClick={onToggleMapEdit}
            >
              {mapEditMode ? "Terminer l'édition" : "Modifier le trajet"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-sebavio-navy/20 min-h-11"
              disabled={recalculating}
              onClick={onRecalculate}
            >
              Recalculer
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sebavio-navy mb-2 text-sm font-semibold tracking-wide uppercase">
            Aller
          </h3>
          <ol
            className="divide-border overflow-hidden rounded-xl border"
            data-testid="trip-itinerary-outbound"
          >
            {outboundItems}
          </ol>
        </div>

        {hasReturn ? (
          <div>
            <h3 className="text-sebavio-navy mb-2 text-sm font-semibold tracking-wide uppercase">
              Retour
            </h3>
            <ol
              className="divide-border overflow-hidden rounded-xl border"
              data-testid="trip-itinerary-return"
            >
              {returnItems}
            </ol>
          </div>
        ) : null}
      </div>

      {!readonly ? (
        <div className="mt-4">
          {!formState?.open ? (
            <Button
              type="button"
              variant="outline"
              className="border-sebavio-navy/20 min-h-11 w-full sm:w-auto"
              disabled={recalculating}
              onClick={() => openAddForm("outbound")}
            >
              <Plus className="size-4" aria-hidden />
              Ajouter un détour ou une étape
            </Button>
          ) : null}

          {formState?.open ? (
            <form
              onSubmit={handleSubmit}
              className="border-sebavio-teal/30 bg-sebavio-teal-soft/15 mt-3 grid gap-3 rounded-xl border p-4"
              data-testid="trip-itinerary-form"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sebavio-navy text-sm font-semibold">
                  {formState.mode === "add"
                    ? "Ajouter un détour ou une étape"
                    : "Modifier l'étape"}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={closeForm}
                  aria-label="Fermer le formulaire"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <FormField htmlFor={`${baseId}-name`} label="Nom" required>
                <Input
                  id={`${baseId}-name`}
                  required
                  maxLength={200}
                  className="min-h-11 w-full"
                  value={formState.values.name}
                  onChange={(e) => updateValues({ name: e.target.value })}
                />
              </FormField>

              <FormField htmlFor={`${baseId}-address`} label="Adresse ou lieu">
                <AddressAutocomplete
                  id={`${baseId}-address`}
                  name="itinerary-stop-address"
                  value={formState.values.address}
                  onChange={(value) => updateValues({ address: value })}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Ex. Chutes Montmorency, Québec"
                  className="w-full"
                />
              </FormField>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField htmlFor={`${baseId}-type`} label="Type">
                  <select
                    id={`${baseId}-type`}
                    className={selectClassName}
                    value={formState.values.stopType}
                    onChange={(e) => updateValues({ stopType: e.target.value })}
                  >
                    {WAYPOINT_STOP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {STOP_TYPE_LABELS[t] ?? t}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField htmlFor={`${baseId}-direction`} label="Trajet">
                  <select
                    id={`${baseId}-direction`}
                    className={selectClassName}
                    value={formState.values.direction}
                    disabled={!hasReturn}
                    onChange={(e) =>
                      updateValues({
                        direction:
                          e.target.value === "return" ? "return" : "outbound",
                      })
                    }
                  >
                    <option value="outbound">
                      {STOP_DIRECTION_LABELS.outbound}
                    </option>
                    {hasReturn ? (
                      <option value="return">
                        {STOP_DIRECTION_LABELS.return}
                      </option>
                    ) : null}
                  </select>
                </FormField>
              </div>

              <FormField htmlFor={`${baseId}-duration`} label="Durée sur place">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {DWELL_DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.minutes}
                        type="button"
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          formState.values.durationMinutes === preset.minutes
                            ? "border-sebavio-teal bg-sebavio-teal-soft text-sebavio-teal"
                            : "border-input text-muted-foreground hover:bg-muted",
                        )}
                        onClick={() =>
                          updateValues({ durationMinutes: preset.minutes })
                        }
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <Input
                    id={`${baseId}-duration`}
                    type="number"
                    min={0}
                    max={24 * 60}
                    className="min-h-11 w-full sm:w-40"
                    value={formState.values.durationMinutes}
                    onChange={(e) =>
                      updateValues({
                        durationMinutes: Math.max(
                          0,
                          Number(e.target.value) || 0,
                        ),
                      })
                    }
                  />
                </div>
              </FormField>

              {formState.mode === "add" &&
              formState.values.direction === "outbound" &&
              hasReturn ? (
                <label className="text-sebavio-navy flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formState.values.alsoAddToReturn}
                    onCheckedChange={(checked) =>
                      updateValues({ alsoAddToReturn: checked === true })
                    }
                  />
                  Ajouter également ce détour au retour
                </label>
              ) : null}

              <FormField
                htmlFor={`${baseId}-notes`}
                label="Notes"
                hint="Optionnel"
              >
                <Textarea
                  id={`${baseId}-notes`}
                  rows={2}
                  className="w-full"
                  value={formState.values.notes}
                  onChange={(e) => updateValues({ notes: e.target.value })}
                />
              </FormField>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={recalculating}
                  className="bg-sebavio-navy hover:bg-sebavio-navy/90 min-h-11 text-white"
                >
                  {formState.mode === "add" ? "Ajouter" : "Enregistrer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={recalculating}
                  onClick={closeForm}
                >
                  Annuler
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
