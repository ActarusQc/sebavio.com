"use client";

import { useActionState } from "react";
import {
  updateNotificationPreferencesAction,
  type NotificationsActionResult,
} from "@/features/notifications/actions";
import type { NotificationPreferencesDto } from "@/features/notifications/types";
import { Button } from "@/components/ui";

const initial: NotificationsActionResult | undefined = undefined;

type Props = {
  preferences: NotificationPreferencesDto;
};

function CheckboxRow({
  name,
  label,
  defaultChecked,
  disabled,
}: {
  name?: string;
  label: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        name={disabled ? undefined : name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="border-input size-4 rounded border disabled:opacity-50"
      />
      <span className={disabled ? "text-muted-foreground" : undefined}>
        {label}
      </span>
    </label>
  );
}

export function NotificationPreferencesForm({ preferences }: Props) {
  const [state, formAction, pending] = useActionState(
    updateNotificationPreferencesAction,
    initial,
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-medium">In-app</legend>
        <CheckboxRow
          name="inAppMaintenance"
          label="Entretien"
          defaultChecked={preferences.inAppMaintenance}
        />
        <CheckboxRow
          name="inAppTrip"
          label="Voyages à venir"
          defaultChecked={preferences.inAppTrip}
        />
        <CheckboxRow
          name="inAppBudget"
          label="Budget dépassé"
          defaultChecked={preferences.inAppBudget}
        />
        <CheckboxRow
          name="inAppWeather"
          label="Météo (bientôt)"
          defaultChecked={preferences.inAppWeather}
          disabled
        />
        <CheckboxRow
          name="inAppFuel"
          label="Carburant (bientôt)"
          defaultChecked={preferences.inAppFuel}
          disabled
        />
        <input
          type="hidden"
          name="inAppWeather"
          value={preferences.inAppWeather ? "true" : "false"}
        />
        <input
          type="hidden"
          name="inAppFuel"
          value={preferences.inAppFuel ? "true" : "false"}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-muted-foreground mb-1 font-medium">
          Courriel (phase SMTP ultérieure)
        </legend>
        <p className="text-muted-foreground text-sm">
          Canal préparé (préférences stockées) — envoi SMTP hors scope.
        </p>
        <input
          type="hidden"
          name="emailMaintenance"
          value={preferences.emailMaintenance ? "true" : "false"}
        />
        <input
          type="hidden"
          name="emailTrip"
          value={preferences.emailTrip ? "true" : "false"}
        />
        <input
          type="hidden"
          name="emailBudget"
          value={preferences.emailBudget ? "true" : "false"}
        />
        <input
          type="hidden"
          name="emailWeather"
          value={preferences.emailWeather ? "true" : "false"}
        />
        <input
          type="hidden"
          name="emailFuel"
          value={preferences.emailFuel ? "true" : "false"}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-muted-foreground mb-1 font-medium">
          Push (phase ultérieure)
        </legend>
        <input
          type="hidden"
          name="pushMaintenance"
          value={preferences.pushMaintenance ? "true" : "false"}
        />
        <input
          type="hidden"
          name="pushTrip"
          value={preferences.pushTrip ? "true" : "false"}
        />
        <input
          type="hidden"
          name="pushBudget"
          value={preferences.pushBudget ? "true" : "false"}
        />
        <input
          type="hidden"
          name="pushWeather"
          value={preferences.pushWeather ? "true" : "false"}
        />
        <input
          type="hidden"
          name="pushFuel"
          value={preferences.pushFuel ? "true" : "false"}
        />
        <p className="text-muted-foreground text-sm">
          Les canaux courriel et push seront activables après SMTP / Web Push.
        </p>
      </fieldset>

      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <p
          className="text-sm text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
