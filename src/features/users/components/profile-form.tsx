"use client";

import { useActionState } from "react";
import {
  updateProfileAction,
  type UsersActionResult,
} from "@/features/users/actions";
import type { UserProfileDto } from "@/features/users/types";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: UsersActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type ProfileFormProps = {
  profile: UserProfileDto;
  email: string;
};

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initial,
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <FormField htmlFor="email" label="Courriel">
        <Input id="email" type="email" value={email} disabled readOnly />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField htmlFor="firstName" label="Prénom">
          <Input
            id="firstName"
            name="firstName"
            defaultValue={profile.firstName}
            maxLength={100}
            autoComplete="given-name"
          />
        </FormField>
        <FormField htmlFor="lastName" label="Nom">
          <Input
            id="lastName"
            name="lastName"
            defaultValue={profile.lastName}
            maxLength={100}
            autoComplete="family-name"
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField htmlFor="language" label="Langue" required>
          <select
            id="language"
            name="language"
            required
            defaultValue={profile.language}
            className={selectClassName}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </FormField>
        <FormField htmlFor="country" label="Pays" required>
          <select
            id="country"
            name="country"
            required
            defaultValue={profile.country}
            className={selectClassName}
          >
            <option value="CA">Canada</option>
            <option value="US">États-Unis</option>
            <option value="FR">France</option>
            <option value="BE">Belgique</option>
            <option value="CH">Suisse</option>
            <option value="GB">Royaume-Uni</option>
          </select>
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField htmlFor="currency" label="Devise" required>
          <select
            id="currency"
            name="currency"
            required
            defaultValue={profile.currency}
            className={selectClassName}
          >
            <option value="CAD">CAD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
            <option value="GBP">GBP</option>
          </select>
        </FormField>
        <FormField htmlFor="timezone" label="Fuseau horaire" required>
          <select
            id="timezone"
            name="timezone"
            required
            defaultValue={profile.timezone}
            className={selectClassName}
          >
            <option value="America/Toronto">America/Toronto</option>
            <option value="America/Vancouver">America/Vancouver</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="UTC">UTC</option>
          </select>
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField htmlFor="travelStyle" label="Style de voyage">
          <select
            id="travelStyle"
            name="travelStyle"
            defaultValue={profile.travelStyle ?? ""}
            className={selectClassName}
          >
            <option value="">—</option>
            <option value="aventure">Aventure</option>
            <option value="famille">Famille</option>
            <option value="luxe">Luxe</option>
            <option value="detente">Détente</option>
          </select>
        </FormField>
        <FormField htmlFor="budgetLevel" label="Niveau de budget">
          <select
            id="budgetLevel"
            name="budgetLevel"
            defaultValue={profile.budgetLevel ?? ""}
            className={selectClassName}
          >
            <option value="">—</option>
            <option value="economique">Économique</option>
            <option value="moyen">Moyen</option>
            <option value="premium">Premium</option>
          </select>
        </FormField>
      </div>
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
        {pending ? "Enregistrement…" : "Enregistrer le profil"}
      </Button>
    </form>
  );
}
