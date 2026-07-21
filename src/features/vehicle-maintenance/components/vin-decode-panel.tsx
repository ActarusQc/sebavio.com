"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { FormField } from "@/components/common";

type DecodedPayload = {
  vin: string;
  manufacturer: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  vehicleType: string | null;
  bodyClass: string | null;
  engine: string | null;
  displacementL: number | null;
  cylinders: number | null;
  fuelType: string | null;
  transmission: string | null;
  drivetrain: string | null;
  plantCountry: string | null;
  confidence: string;
  incomplete: boolean;
  ambiguous: boolean;
  isCertain: boolean;
  missingFields: string[];
};

type VinDecodeFieldsProps = {
  defaultVin?: string;
  onApplyManual?: (fields: {
    manualManufacturerName: string;
    manualModelName: string;
    manualYear: number;
    manualTrim: string;
  }) => void;
};

/**
 * Décodage VIN côté client → API serveur NHTSA.
 * Remplit les champs cachés d’identification ; l’utilisateur doit confirmer.
 */
export function VinDecodePanel({ defaultVin = "" }: VinDecodeFieldsProps) {
  const [vin, setVin] = useState(defaultVin);
  const [decoded, setDecoded] = useState<DecodedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  function decode() {
    setError(null);
    setMessage(null);
    setConfirmed(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/vehicles/decode-vin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vin }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: { decoded: DecodedPayload; message?: string };
          error?: { message?: string };
        };
        if (!res.ok || !json.success || !json.data?.decoded) {
          setError(json.error?.message ?? "Décodage VIN impossible");
          setDecoded(null);
          return;
        }
        setDecoded(json.data.decoded);
        setMessage(json.data.message ?? null);
      } catch {
        setError("Décodage VIN impossible");
      }
    });
  }

  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:col-span-2">
      <p className="text-sm font-medium">Identification par VIN (NHTSA)</p>
      <div className="flex flex-wrap items-end gap-2">
        <FormField
          htmlFor="vin-decode-input"
          label="VIN à décoder"
          className="min-w-[16rem] flex-1"
        >
          <Input
            id="vin-decode-input"
            name="vin"
            maxLength={17}
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="17 caractères"
          />
        </FormField>
        <Button
          type="button"
          variant="outline"
          disabled={pending || vin.length < 17}
          onClick={decode}
        >
          {pending ? "Décodage…" : "Décoder"}
        </Button>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {decoded ? (
        <div className="bg-muted/40 grid gap-2 rounded-md p-3 text-sm">
          {message ? <p className="text-muted-foreground">{message}</p> : null}
          {!decoded.isCertain ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Résultat {decoded.confidence}
              {decoded.ambiguous ? " (ambigu)" : ""}
              {decoded.incomplete ? " (incomplet)" : ""}. Ne pas considérer
              comme certain.
            </p>
          ) : null}
          <dl className="grid gap-1 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Marque</dt>
              <dd>{decoded.make ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Modèle</dt>
              <dd>{decoded.model ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Année</dt>
              <dd>{decoded.year ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Finition</dt>
              <dd>{decoded.trim ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Moteur</dt>
              <dd>{decoded.engine ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Confiance</dt>
              <dd>{decoded.confidence}</dd>
            </div>
          </dl>

          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Je confirme ces informations avant enregistrement
          </label>

          {confirmed ? (
            <>
              <input type="hidden" name="isManualEntry" value="true" />
              <input
                type="hidden"
                name="manualManufacturerName"
                value={decoded.make ?? decoded.manufacturer ?? ""}
              />
              <input
                type="hidden"
                name="manualModelName"
                value={decoded.model ?? ""}
              />
              <input
                type="hidden"
                name="manualYear"
                value={decoded.year ?? ""}
              />
              <input
                type="hidden"
                name="manualTrim"
                value={decoded.trim ?? ""}
              />
              <input type="hidden" name="engine" value={decoded.engine ?? ""} />
              <input
                type="hidden"
                name="transmission"
                value={decoded.transmission ?? ""}
              />
              <input
                type="hidden"
                name="drivetrain"
                value={decoded.drivetrain ?? ""}
              />
              <input
                type="hidden"
                name="vehicleType"
                value={decoded.vehicleType ?? ""}
              />
              <input
                type="hidden"
                name="bodyClass"
                value={decoded.bodyClass ?? ""}
              />
              <input
                type="hidden"
                name="manufacturerName"
                value={decoded.manufacturer ?? ""}
              />
              <input
                type="hidden"
                name="plantCountry"
                value={decoded.plantCountry ?? ""}
              />
              <input
                type="hidden"
                name="cylinders"
                value={decoded.cylinders ?? ""}
              />
              <input
                type="hidden"
                name="displacementL"
                value={decoded.displacementL ?? ""}
              />
              <input type="hidden" name="identificationSource" value="vin" />
              <input
                type="hidden"
                name="identificationConfidence"
                value={decoded.confidence}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
