"use client";

import { useActionState } from "react";
import {
  addDocumentAction,
  addPhotoAction,
  updateOdometerAction,
  type VehiclesActionResult,
} from "@/features/vehicles/actions";
import {
  USER_DOCUMENT_TYPES,
  USER_DOCUMENT_TYPE_LABELS,
} from "@/features/vehicles/constants";
import type { UserVehicleDetailDto } from "@/features/vehicles/types";
import { FormField } from "@/components/common";
import { Badge, Button, Input } from "@/components/ui";

const initial: VehiclesActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type VehicleDetailProps = {
  vehicle: UserVehicleDetailDto;
};

export function VehicleDetailPanels({ vehicle }: VehicleDetailProps) {
  const [odoState, odoAction, odoPending] = useActionState(
    updateOdometerAction,
    initial,
  );
  const [photoState, photoAction, photoPending] = useActionState(
    addPhotoAction,
    initial,
  );
  const [docState, docAction, docPending] = useActionState(
    addDocumentAction,
    initial,
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{vehicle.displayName}</h2>
          {vehicle.primaryVehicle ? (
            <Badge variant="secondary">Principal</Badge>
          ) : null}
          {vehicle.isManualEntry ? (
            <Badge variant="outline">Saisie manuelle</Badge>
          ) : null}
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Kilométrage</dt>
            <dd>{vehicle.currentOdometer.toLocaleString("fr-CA")} km</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Consommation utilisée</dt>
            <dd>
              {vehicle.effectiveSpecs.consumptionLPer100Km != null
                ? `${vehicle.effectiveSpecs.consumptionLPer100Km} L/100 km`
                : "—"}
              {vehicle.effectiveSpecs.consumptionSource === "user_override" ? (
                <span className="text-muted-foreground ml-1 text-xs">
                  (personnalisée)
                </span>
              ) : vehicle.effectiveSpecs.manufacturerConsumptionL100 != null ? (
                <span className="text-muted-foreground ml-1 text-xs">
                  (suggérée :{" "}
                  {vehicle.effectiveSpecs.manufacturerConsumptionL100})
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Moyenne des pleins</dt>
            <dd>
              {vehicle.realAvgConsumption
                ? `${vehicle.realAvgConsumption} L/100 km`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Réservoir</dt>
            <dd>
              {vehicle.effectiveSpecs.tankCapacityLiters != null
                ? `${vehicle.effectiveSpecs.tankCapacityLiters} L`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Autonomie estimée</dt>
            <dd>
              {vehicle.stats.estimatedRangeKm != null
                ? `${vehicle.stats.estimatedRangeKm} km`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Référence</dt>
            <dd>
              {vehicle.model
                ? `${vehicle.model.manufacturerName} ${vehicle.model.modelName} (${vehicle.model.year})`
                : vehicle.catalogLabel
                  ? vehicle.catalogLabel
                  : vehicle.manualManufacturerName && vehicle.manualModelName
                    ? `${vehicle.manualManufacturerName} ${vehicle.manualModelName}${
                        vehicle.manualYear ? ` (${vehicle.manualYear})` : ""
                      }`
                    : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Mettre à jour le kilométrage</h3>
        <form action={odoAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={vehicle.id} />
          <FormField htmlFor="detail-odo" label="Nouveau kilométrage">
            <Input
              id="detail-odo"
              name="currentOdometer"
              type="number"
              min={vehicle.currentOdometer}
              required
              defaultValue={vehicle.currentOdometer}
            />
          </FormField>
          <Button type="submit" disabled={odoPending}>
            Mettre à jour
          </Button>
        </form>
        {odoState?.ok === false ? (
          <p className="text-destructive text-sm">{odoState.message}</p>
        ) : null}
        {odoState?.ok ? (
          <p className="text-sm text-emerald-700">{odoState.message}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Photos ({vehicle.stats.photoCount})</h3>
        {vehicle.photos.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune photo.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {vehicle.photos.map((p) => (
              <li key={p.id}>
                <a
                  href={p.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {p.caption || p.photoUrl}
                </a>
              </li>
            ))}
          </ul>
        )}
        <form action={photoAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={vehicle.id} />
          <FormField htmlFor="photo-url" label="URL photo">
            <Input id="photo-url" name="photoUrl" type="url" />
          </FormField>
          <FormField htmlFor="photo-caption" label="Légende">
            <Input id="photo-caption" name="caption" maxLength={200} />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={photoPending}>
              Ajouter la photo
            </Button>
          </div>
        </form>
        {photoState?.ok === false ? (
          <p className="text-destructive text-sm">{photoState.message}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">
          Documents ({vehicle.stats.documentCount})
        </h3>
        {vehicle.documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun document.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {vehicle.documents.map((d) => {
              const typeLabel = USER_DOCUMENT_TYPE_LABELS[d.type] ?? d.type;
              const label = `[${typeLabel}] ${d.title}`;
              return (
                <li key={d.id}>
                  {d.fileUrl ? (
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {label}
                    </a>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <form action={docAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={vehicle.id} />
          <FormField htmlFor="doc-type" label="Type">
            <select
              id="doc-type"
              name="type"
              className={selectClassName}
              defaultValue="Assurance"
            >
              {USER_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="doc-title" label="Titre">
            <Input id="doc-title" name="title" maxLength={150} />
          </FormField>
          <FormField htmlFor="doc-expiry" label="Expiration">
            <Input id="doc-expiry" name="expiryDate" type="date" />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={docPending}>
              Ajouter le document
            </Button>
          </div>
        </form>
        {docState?.ok === false ? (
          <p className="text-destructive text-sm">{docState.message}</p>
        ) : null}
      </section>
    </div>
  );
}
