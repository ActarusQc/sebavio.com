"use client";

import { useMemo, useState } from "react";
import {
  ACTIVITY_INTEREST_LABELS,
  ACTIVITY_INTERESTS,
  ACTIVITY_LEVEL_LABELS,
  ACTIVITY_LEVELS,
  ACCESSIBILITY_NEED_LABELS,
  ACCESSIBILITY_NEEDS,
  BUDGET_PREFERENCE_LABELS,
  BUDGET_PREFERENCES,
  CHILD_AGE_BAND_LABELS,
  DURATION_PREFERENCE_LABELS,
  DURATION_PREFERENCES,
  ENVIRONMENT_PREFERENCE_LABELS,
  ENVIRONMENT_PREFERENCES,
  MAX_DETOUR_OPTIONS,
  TRIP_PURPOSE_LABELS,
  TRIP_PURPOSES,
  childAgeBand,
  type ActivityInterest,
  type TripPurpose,
  type TripTravelerProfileDto,
} from "@/features/trips/activities/activity-types";
import { cn } from "@/lib/utils";

export type TravelerProfileFormState = {
  deferred: boolean;
  purpose: TripPurpose;
  adultCount: number;
  childCount: number;
  childAges: number[];
  interests: ActivityInterest[];
  budgetPreference: string;
  durationPreference: string;
  maxDetourMinutes: number;
  environmentPreference: string;
  activityLevel: string;
  accessibilityNeeds: string[];
  travelingWithPet: boolean;
};

const defaultState = (
  initial?: TripTravelerProfileDto | null,
): TravelerProfileFormState => ({
  deferred: initial?.deferred ?? false,
  purpose: initial?.purpose ?? "couple",
  adultCount: initial?.adultCount ?? 2,
  childCount: initial?.childCount ?? 0,
  childAges: initial?.childAges?.length ? [...initial.childAges] : [],
  interests: initial?.interests?.length
    ? [...initial.interests]
    : ["nature", "food", "scenic_views"],
  budgetPreference: initial?.budgetPreference ?? "any",
  durationPreference: initial?.durationPreference ?? "any",
  maxDetourMinutes: initial?.maxDetourMinutes ?? 15,
  environmentPreference: initial?.environmentPreference ?? "both",
  activityLevel: initial?.activityLevel ?? "moderate",
  accessibilityNeeds: initial?.accessibilityNeeds?.length
    ? [...initial.accessibilityNeeds]
    : ["none"],
  travelingWithPet: initial?.travelingWithPet ?? false,
});

type Props = {
  initial?: TripTravelerProfileDto | null;
  /** Prefixe pour champs hidden FormData */
  namePrefix?: string;
  onChange?: (state: TravelerProfileFormState) => void;
  compact?: boolean;
};

export function TripTravelerProfileFields({
  initial,
  namePrefix = "traveler",
  onChange,
  compact = false,
}: Props) {
  const [state, setState] = useState(() => defaultState(initial));
  const [showAdvanced, setShowAdvanced] = useState(false);

  function update(patch: Partial<TravelerProfileFormState>) {
    setState((prev) => {
      let next = { ...prev, ...patch };
      if (patch.childCount != null) {
        const ages = [...next.childAges];
        while (ages.length < next.childCount) ages.push(5);
        while (ages.length > next.childCount) ages.pop();
        next = { ...next, childAges: ages };
      }
      if (patch.purpose === "solo") {
        next = { ...next, adultCount: 1 };
      }
      if (patch.purpose === "couple") {
        next = { ...next, adultCount: 2 };
      }
      onChange?.(next);
      return next;
    });
  }

  const payload = useMemo(() => JSON.stringify(state), [state]);

  return (
    <section
      className="trip-card flex flex-col gap-4 p-4 sm:p-5"
      data-testid="trip-traveler-profile-fields"
      aria-labelledby={`${namePrefix}-heading`}
    >
      <input type="hidden" name={`${namePrefix}Json`} value={payload} />

      <div>
        <h2
          id={`${namePrefix}-heading`}
          className="text-sebavio-navy text-base font-semibold"
        >
          Avec qui voyagez-vous ?
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Ces infos aident Sebavio à suggérer des activités adaptées.
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={state.deferred}
          onChange={(e) => update({ deferred: e.target.checked })}
          className="size-4 accent-[var(--sebavio-teal)]"
        />
        Je déciderai plus tard
      </label>

      {!state.deferred ? (
        <>
          <fieldset>
            <legend className="text-sebavio-navy mb-2 text-sm font-medium">
              Type de voyage
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {TRIP_PURPOSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => update({ purpose: p })}
                  className={cn(
                    "focus-visible:ring-sebavio-teal min-h-11 rounded-xl border px-2 py-2 text-sm outline-none focus-visible:ring-2",
                    state.purpose === p
                      ? "border-sebavio-teal bg-sebavio-teal-soft text-sebavio-navy font-medium"
                      : "border-border bg-card text-foreground hover:border-sebavio-teal/40",
                  )}
                  aria-pressed={state.purpose === p}
                >
                  {TRIP_PURPOSE_LABELS[p]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-sebavio-navy font-medium">
                Nombre d&apos;adultes
              </span>
              <input
                type="number"
                min={1}
                max={20}
                value={state.adultCount}
                onChange={(e) =>
                  update({ adultCount: Number(e.target.value) || 1 })
                }
                className="border-input bg-card h-10 rounded-lg border px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-sebavio-navy font-medium">
                Nombre d&apos;enfants
              </span>
              <input
                type="number"
                min={0}
                max={20}
                value={state.childCount}
                onChange={(e) =>
                  update({ childCount: Number(e.target.value) || 0 })
                }
                className="border-input bg-card h-10 rounded-lg border px-3"
              />
            </label>
          </div>

          {state.childCount > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {state.childAges.map((age, idx) => (
                <label key={idx} className="flex flex-col gap-1 text-sm">
                  <span className="text-sebavio-navy font-medium">
                    Enfant {idx + 1} — âge
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={17}
                      value={age}
                      onChange={(e) => {
                        const next = [...state.childAges];
                        next[idx] = Math.min(
                          17,
                          Math.max(0, Number(e.target.value) || 0),
                        );
                        update({ childAges: next });
                      }}
                      className="border-input bg-card h-10 w-full rounded-lg border px-3"
                    />
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {CHILD_AGE_BAND_LABELS[childAgeBand(age)]}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          ) : null}

          <fieldset>
            <legend className="text-sebavio-navy mb-2 text-sm font-medium">
              Centres d&apos;intérêt
            </legend>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_INTERESTS.map((interest) => {
                const selected = state.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? state.interests.filter((i) => i !== interest)
                        : [...state.interests, interest];
                      update({ interests: next });
                    }}
                    className={cn(
                      "focus-visible:ring-sebavio-teal min-h-9 rounded-full border px-3 py-1.5 text-xs outline-none focus-visible:ring-2 sm:text-sm",
                      selected
                        ? "border-sebavio-teal bg-sebavio-teal text-white"
                        : "border-border bg-card text-foreground hover:border-sebavio-teal/40",
                    )}
                    aria-pressed={selected}
                  >
                    {ACTIVITY_INTEREST_LABELS[interest]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {!compact ? (
            <div>
              <button
                type="button"
                className="text-sebavio-teal text-sm font-medium underline-offset-2 hover:underline"
                onClick={() => setShowAdvanced((v) => !v)}
                aria-expanded={showAdvanced}
              >
                Personnaliser davantage mes suggestions
              </button>

              {showAdvanced ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label="Budget par activité"
                    value={state.budgetPreference}
                    onChange={(v) => update({ budgetPreference: v })}
                    options={BUDGET_PREFERENCES.map((k) => ({
                      value: k,
                      label: BUDGET_PREFERENCE_LABELS[k],
                    }))}
                  />
                  <SelectField
                    label="Durée préférée"
                    value={state.durationPreference}
                    onChange={(v) => update({ durationPreference: v })}
                    options={DURATION_PREFERENCES.map((k) => ({
                      value: k,
                      label: DURATION_PREFERENCE_LABELS[k],
                    }))}
                  />
                  <SelectField
                    label="Détour maximal accepté"
                    value={String(state.maxDetourMinutes)}
                    onChange={(v) => update({ maxDetourMinutes: Number(v) })}
                    options={MAX_DETOUR_OPTIONS.map((m) => ({
                      value: String(m),
                      label: `${m} minutes`,
                    }))}
                  />
                  <SelectField
                    label="Environnement"
                    value={state.environmentPreference}
                    onChange={(v) => update({ environmentPreference: v })}
                    options={ENVIRONMENT_PREFERENCES.map((k) => ({
                      value: k,
                      label: ENVIRONMENT_PREFERENCE_LABELS[k],
                    }))}
                  />
                  <SelectField
                    label="Niveau d'activité"
                    value={state.activityLevel}
                    onChange={(v) => update({ activityLevel: v })}
                    options={ACTIVITY_LEVELS.map((k) => ({
                      value: k,
                      label: ACTIVITY_LEVEL_LABELS[k],
                    }))}
                  />
                  <SelectField
                    label="Accessibilité"
                    value={state.accessibilityNeeds[0] ?? "none"}
                    onChange={(v) => update({ accessibilityNeeds: [v] })}
                    options={ACCESSIBILITY_NEEDS.map((k) => ({
                      value: k,
                      label: ACCESSIBILITY_NEED_LABELS[k],
                    }))}
                  />
                  <fieldset className="sm:col-span-2">
                    <legend className="text-sebavio-navy mb-2 text-sm font-medium">
                      Voyage avec un animal
                    </legend>
                    <div className="flex gap-2">
                      {[
                        { v: true, label: "Oui" },
                        { v: false, label: "Non" },
                      ].map((opt) => (
                        <button
                          key={String(opt.v)}
                          type="button"
                          onClick={() => update({ travelingWithPet: opt.v })}
                          className={cn(
                            "min-h-10 flex-1 rounded-xl border px-3 text-sm",
                            state.travelingWithPet === opt.v
                              ? "border-sebavio-teal bg-sebavio-teal-soft"
                              : "border-border",
                          )}
                          aria-pressed={state.travelingWithPet === opt.v}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-sebavio-navy font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input bg-card h-10 rounded-lg border px-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
