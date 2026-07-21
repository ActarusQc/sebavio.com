"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  ExternalLink,
  EyeOff,
  MapPin,
  RefreshCw,
  Settings2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addActivityAction,
  generateSuggestionsAction,
  rejectActivityAction,
  removeActivityAction,
  restoreActivityAction,
  toggleStarActivityAction,
  upsertTravelerProfileAction,
} from "@/features/trips/activities/actions";
import {
  ACTIVITY_INTEREST_LABELS,
  INSERT_PLACEMENTS,
  REJECT_REASON_LABELS,
  REJECT_REASONS,
  TRIP_PURPOSE_LABELS,
  type InsertPlacement,
  type TripActivityDto,
  type TripTravelerProfileDto,
} from "@/features/trips/activities/activity-types";
import { TripTravelerProfileFields } from "@/features/trips/activities/components/trip-traveler-profile-fields";
import { computeActivityPlacement } from "@/features/trips/services/build-trip-route-request";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type TabId =
  | "recommended"
  | "starred"
  | "along_route"
  | "destination"
  | "added"
  | "hidden";

const EXPLORER_TABS: Array<{ id: TabId; label: string }> = [
  { id: "recommended", label: "Recommandées" },
  { id: "starred", label: "Choisies ★" },
  { id: "along_route", label: "Sur la route" },
  { id: "destination", label: "À destination" },
  { id: "added", label: "Ajoutées à l'itinéraire" },
  { id: "hidden", label: "Masquées" },
];

export function isSelectedActivityStatus(status: string): boolean {
  return (
    status === "saved" || status === "added_to_trip" || status === "completed"
  );
}

type TripEndpointHint = {
  address: string;
  lat: number;
  lng: number;
};

type Props = {
  tripId: string;
  readonly?: boolean;
  /** explorer = page Activités ; selected = résumé compact sur le voyage */
  variant?: "explorer" | "selected";
  onActivitiesChange?: (activities: TripActivityDto[]) => void;
  tripOrigin?: TripEndpointHint | null;
  tripDestination?: TripEndpointHint | null;
};

export function TripActivitiesSection({
  tripId,
  readonly = false,
  variant = "explorer",
  onActivitiesChange,
  tripOrigin = null,
  tripDestination = null,
}: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<TripTravelerProfileDto | null>(null);
  const [activities, setActivities] = useState<TripActivityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);
  const [tab, setTab] = useState<TabId>("recommended");
  const [editPrefs, setEditPrefs] = useState(false);
  const [addTarget, setAddTarget] = useState<TripActivityDto | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/trips/${tripId}/activities`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Chargement impossible");
      const json = (await res.json()) as {
        data?: {
          profile: TripTravelerProfileDto | null;
          activities: TripActivityDto[];
        };
        profile?: TripTravelerProfileDto | null;
        activities?: TripActivityDto[];
      };
      const data = json.data ?? json;
      const nextActivities = data.activities ?? [];
      setProfile(data.profile ?? null);
      setActivities(nextActivities);
      onActivitiesChange?.(nextActivities);
    } catch {
      setError("Les activités sont temporairement indisponibles.");
    } finally {
      setLoading(false);
    }
  }, [tripId, onActivitiesChange]);

  const confirmAdd = useCallback(
    (payload: Record<string, unknown>) => {
      startTransition(async () => {
        setError(null);
        const result = await addActivityAction(tripId, payload);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setAddTarget(null);
        await load();
        router.refresh();
      });
    },
    [tripId, router, load],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/v1/trips/${tripId}/activities`, {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("Chargement impossible");
        const json = (await res.json()) as {
          data?: {
            profile: TripTravelerProfileDto | null;
            activities: TripActivityDto[];
          };
        };
        if (cancelled) return;
        const data = json.data ?? { profile: null, activities: [] };
        const nextActivities = data.activities ?? [];
        setProfile(data.profile ?? null);
        setActivities(nextActivities);
        setError(null);
        onActivitiesChange?.(nextActivities);
      } catch {
        if (!cancelled) {
          setError("Les activités sont temporairement indisponibles.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on trip change
  }, [tripId]);

  const selectedActivities = useMemo(
    () => activities.filter((a) => isSelectedActivityStatus(a.status)),
    [activities],
  );

  const filtered = useMemo(() => {
    if (variant === "selected") return selectedActivities;
    switch (tab) {
      case "recommended":
        return activities.filter(
          (a) => a.status === "suggested" || a.status === "saved",
        );
      case "starred":
        return selectedActivities;
      case "along_route":
        return activities.filter(
          (a) =>
            (a.status === "suggested" || a.status === "saved") &&
            a.suggestedForSegment === "along_route",
        );
      case "destination":
        return activities.filter(
          (a) =>
            (a.status === "suggested" || a.status === "saved") &&
            a.suggestedForSegment === "destination",
        );
      case "added":
        return activities.filter(
          (a) => a.status === "added_to_trip" || a.status === "completed",
        );
      case "hidden":
        return activities.filter((a) => a.status === "rejected");
      default:
        return activities;
    }
  }, [activities, tab, variant, selectedActivities]);

  function refresh(force = true) {
    startTransition(async () => {
      const result = await generateSuggestionsAction(tripId, force);
      if (!result.ok) {
        setError(result.message);
        setPartial(true);
      } else {
        setPartial(Boolean((result.data as { partial?: boolean })?.partial));
        await load();
      }
    });
  }

  const profileSummary = useMemo(() => {
    if (!profile || profile.deferred) {
      return "Préférences non configurées — suggestions génériques possibles.";
    }
    const kids =
      profile.childCount > 0
        ? ` · ${profile.childCount} enfant${profile.childCount > 1 ? "s" : ""}, ${profile.childAges.join(" et ")} ans`
        : "";
    const interests = profile.interests
      .slice(0, 4)
      .map((i) => ACTIVITY_INTEREST_LABELS[i] ?? i)
      .join(" · ");
    return `Voyage ${TRIP_PURPOSE_LABELS[profile.purpose].toLowerCase()} · ${profile.adultCount} adulte${profile.adultCount > 1 ? "s" : ""}${kids}${interests ? `\n${interests}` : ""}`;
  }, [profile]);

  if (variant === "selected") {
    return (
      <section
        id="trip-activities-section"
        className="trip-card flex h-full scroll-mt-28 flex-col gap-3 p-4 sm:scroll-mt-32 sm:p-5"
        data-testid="trip-selected-activities"
        aria-labelledby="trip-selected-activities-heading"
      >
        <div>
          <h2
            id="trip-selected-activities-heading"
            className="text-sebavio-navy text-lg font-semibold"
          >
            Activités choisies
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Sélectionnées avec l&apos;étoile depuis l&apos;onglet Activités.
          </p>
        </div>

        {loading ? (
          <div className="bg-muted h-20 animate-pulse rounded-xl" aria-busy />
        ) : null}

        {!loading && selectedActivities.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune activité choisie pour ce voyage. Ouvrez Activités pour
            parcourir les suggestions et cliquer sur l&apos;étoile.
          </p>
        ) : null}

        {!loading && selectedActivities.length > 0 ? (
          <ul className="grid gap-2">
            {selectedActivities.map((activity) => (
              <li key={activity.id}>
                <ActivityCard
                  activity={activity}
                  readonly={readonly}
                  compact
                  onStar={() =>
                    startTransition(async () => {
                      await toggleStarActivityAction(tripId, activity.id);
                      await load();
                    })
                  }
                  onAdd={() => setAddTarget(activity)}
                  onHide={() => undefined}
                  onRestore={() => undefined}
                  onRemove={() =>
                    startTransition(async () => {
                      await removeActivityAction(tripId, activity.id);
                      await load();
                    })
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="button"
            className="bg-sebavio-navy hover:bg-sebavio-navy/90 min-h-10 text-white"
            render={<Link href={`/dashboard/activities?tripId=${tripId}`} />}
          >
            Explorer les suggestions
          </Button>
          <Link
            href={`/dashboard/activities?tripId=${tripId}`}
            className="text-sebavio-teal text-sm font-medium underline-offset-2 hover:underline"
          >
            Voir toutes les activités →
          </Link>
        </div>

        {addTarget && !readonly ? (
          <AddActivityDialog
            key={`add-activity-${addTarget.id}`}
            tripId={tripId}
            activity={addTarget}
            pending={pending}
            errorMessage={error}
            tripOrigin={tripOrigin}
            tripDestination={tripDestination}
            onClose={() => {
              setAddTarget(null);
              setError(null);
            }}
            onConfirm={confirmAdd}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section
      className="trip-card flex flex-col gap-4 p-4 sm:p-5"
      data-testid="trip-activities-section"
      aria-labelledby="trip-activities-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="trip-activities-heading"
            className="text-sebavio-navy text-lg font-semibold"
          >
            Activités pour votre voyage
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Des idées adaptées à votre groupe et à votre itinéraire. Cliquez sur
            l&apos;étoile pour les retrouver dans la fiche voyage.
          </p>
          <p className="text-sebavio-navy/80 mt-2 text-sm whitespace-pre-line">
            {profileSummary}
          </p>
          {profile?.suggestionsGeneratedAt ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Dernière actualisation :{" "}
              {new Date(profile.suggestionsGeneratedAt).toLocaleString("fr-CA")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!readonly ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10"
                onClick={() => setEditPrefs((v) => !v)}
              >
                <Settings2 className="size-4" aria-hidden />
                Modifier les préférences
              </Button>
              <Button
                type="button"
                size="sm"
                className="min-h-10"
                disabled={pending}
                onClick={() => refresh(true)}
              >
                <RefreshCw
                  className={cn("size-4", pending && "animate-spin")}
                  aria-hidden
                />
                Actualiser les suggestions
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {editPrefs && !readonly ? (
        <PrefsEditor
          tripId={tripId}
          profile={profile}
          onSaved={async () => {
            setEditPrefs(false);
            await load();
            refresh(true);
          }}
          onCancel={() => setEditPrefs(false)}
        />
      ) : null}

      <div
        className="flex gap-1 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Filtres activités"
      >
        {EXPLORER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-3 text-sm whitespace-nowrap",
              tab === t.id
                ? "bg-sebavio-teal text-white"
                : "bg-muted text-foreground",
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-busy>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted h-40 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error} Le reste du voyage reste consultable.
        </p>
      ) : null}

      {!loading && !error && !profile ? (
        <p className="text-muted-foreground text-sm">
          Aucune préférence configurée.{" "}
          {!readonly
            ? "Modifiez vos préférences ou actualisez pour générer des suggestions."
            : null}
        </p>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {partial
            ? "Aucune activité trouvée pour cet itinéraire avec vos préférences. Essayez d'élargir le détour ou les intérêts, puis actualisez."
            : "Aucune activité dans cet onglet pour le moment. Cliquez sur « Actualiser les suggestions » pour lancer une recherche Google Places."}
        </p>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((activity) => (
            <li key={activity.id}>
              <ActivityCard
                activity={activity}
                readonly={readonly}
                onStar={() =>
                  startTransition(async () => {
                    await toggleStarActivityAction(tripId, activity.id);
                    await load();
                  })
                }
                onAdd={() => setAddTarget(activity)}
                onHide={(reason) =>
                  startTransition(async () => {
                    await rejectActivityAction(tripId, activity.id, reason);
                    await load();
                  })
                }
                onRestore={() =>
                  startTransition(async () => {
                    await restoreActivityAction(tripId, activity.id);
                    await load();
                  })
                }
                onRemove={() =>
                  startTransition(async () => {
                    await removeActivityAction(tripId, activity.id);
                    await load();
                  })
                }
              />
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-muted-foreground text-[11px]">
        Données de lieux fournies par Google. Horaires et tarifs à confirmer.
      </p>

      {addTarget && !readonly ? (
        <AddActivityDialog
          key={`add-activity-${addTarget.id}`}
          tripId={tripId}
          activity={addTarget}
          pending={pending}
          errorMessage={error}
          tripOrigin={tripOrigin}
          tripDestination={tripDestination}
          onClose={() => {
            setAddTarget(null);
            setError(null);
          }}
          onConfirm={confirmAdd}
        />
      ) : null}
    </section>
  );
}

function PrefsEditor({
  tripId,
  profile,
  onSaved,
  onCancel,
}: {
  tripId: string;
  profile: TripTravelerProfileDto | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [json, setJson] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="border-border rounded-xl border p-3">
      <TripTravelerProfileFields
        initial={profile}
        namePrefix="editTraveler"
        onChange={(s) => setJson(JSON.stringify(s))}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const raw = json
                ? (JSON.parse(json) as Record<string, unknown>)
                : { deferred: true };
              const result = await upsertTravelerProfileAction(tripId, raw);
              if (result.ok) onSaved();
            })
          }
        >
          Enregistrer
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

function ActivityCard({
  activity,
  readonly,
  compact = false,
  onStar,
  onAdd,
  onHide,
  onRestore,
  onRemove,
}: {
  activity: TripActivityDto;
  readonly: boolean;
  compact?: boolean;
  onStar: () => void;
  onAdd: () => void;
  onHide: (reason?: string) => void;
  onRestore: () => void;
  onRemove: () => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const starred = isSelectedActivityStatus(activity.status);

  return (
    <article className="border-border bg-card flex h-full flex-col gap-2 rounded-xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sebavio-navy text-sm leading-snug font-semibold">
            {activity.name}
          </h3>
          <p className="text-muted-foreground text-xs">
            {[activity.city, activity.primaryType?.replaceAll("_", " ")]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {activity.rating != null ? (
            <span className="text-sebavio-navy flex items-center gap-1 text-xs font-medium">
              {activity.rating.toFixed(1)}
            </span>
          ) : null}
          {!readonly ? (
            <button
              type="button"
              className="focus-visible:ring-sebavio-teal inline-flex size-10 items-center justify-center rounded-full outline-none focus-visible:ring-2"
              aria-pressed={starred}
              aria-label={
                starred
                  ? "Retirer des activités choisies"
                  : "Choisir cette activité"
              }
              onClick={onStar}
            >
              <Star
                className={cn(
                  "size-5",
                  starred
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground",
                )}
                aria-hidden
              />
            </button>
          ) : starred ? (
            <Star
              className="size-5 fill-amber-400 text-amber-400"
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      {compact ? (
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {activity.googleMapsUrl ? (
            <a
              href={activity.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border inline-flex min-h-9 items-center gap-1 rounded-lg border px-2 text-xs"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Maps
            </a>
          ) : null}
          {!readonly &&
          activity.status !== "added_to_trip" &&
          activity.status !== "completed" ? (
            <Button type="button" size="sm" className="min-h-9" onClick={onAdd}>
              Ajouter à l&apos;itinéraire
            </Button>
          ) : null}
          {activity.status === "added_to_trip" && !readonly ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRemove}
            >
              Retirer
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="text-muted-foreground space-y-0.5 text-xs">
            {activity.detourDurationMinutes != null ? (
              <li>Détour estimé : {activity.detourDurationMinutes} min</li>
            ) : null}
            {activity.estimatedVisitMinutes != null ? (
              <li>
                Durée suggérée : environ{" "}
                {Math.round(activity.estimatedVisitMinutes / 60) >= 1
                  ? `${(activity.estimatedVisitMinutes / 60).toFixed(1)} h`
                  : `${activity.estimatedVisitMinutes} min`}
              </li>
            ) : null}
            {activity.environmentGuess !== "unknown" ? (
              <li>
                {activity.environmentGuess === "indoor"
                  ? "Intérieur (estimé)"
                  : "Extérieur (estimé)"}
              </li>
            ) : null}
            <li>Horaire à confirmer</li>
          </ul>

          {activity.suitabilityReasons.length > 0 ? (
            <ul className="text-sebavio-navy/80 list-inside list-disc text-xs">
              {activity.suitabilityReasons.slice(0, 3).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}

          {activity.warningReasons.length > 0 ? (
            <ul className="list-inside list-disc text-xs text-amber-800">
              {activity.warningReasons.slice(0, 2).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            {!readonly &&
            activity.status !== "added_to_trip" &&
            activity.status !== "rejected" ? (
              <Button
                type="button"
                size="sm"
                className="min-h-9"
                onClick={onAdd}
              >
                Ajouter à l&apos;itinéraire
              </Button>
            ) : null}
            {activity.googleMapsUrl ? (
              <a
                href={activity.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border inline-flex min-h-9 items-center gap-1 rounded-lg border px-2 text-xs"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                Google Maps
              </a>
            ) : null}
            {activity.status === "rejected" && !readonly ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRestore}
              >
                Restaurer
              </Button>
            ) : null}
            {activity.status === "added_to_trip" && !readonly ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRemove}
              >
                Retirer
              </Button>
            ) : null}
            {!readonly &&
            activity.status !== "rejected" &&
            activity.status !== "added_to_trip" ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowReject((v) => !v)}
              >
                <EyeOff className="size-3.5" aria-hidden />
                Masquer
              </Button>
            ) : null}
          </div>

          {showReject ? (
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="w-full text-xs font-medium">
                Je ne suis pas intéressé
              </span>
              {REJECT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="bg-muted rounded-full px-2 py-1 text-[11px]"
                  onClick={() => onHide(r)}
                >
                  {REJECT_REASON_LABELS[r]}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

function AddActivityDialog({
  tripId,
  activity,
  pending,
  errorMessage,
  tripOrigin,
  tripDestination,
  onClose,
  onConfirm,
}: {
  tripId: string;
  activity: TripActivityDto;
  pending: boolean;
  errorMessage?: string | null;
  tripOrigin?: TripEndpointHint | null;
  tripDestination?: TripEndpointHint | null;
  onClose: () => void;
  onConfirm: (payload: Record<string, unknown>) => void;
}) {
  const [placement, setPlacement] = useState<InsertPlacement>("outbound");
  const [asRouteStop, setAsRouteStop] = useState(true);
  const [visitMinutes, setVisitMinutes] = useState(
    String(activity.estimatedVisitMinutes ?? 90),
  );
  void tripId;

  const impactKm = activity.detourDistanceKm ?? 10;
  const impactMin = activity.detourDurationMinutes ?? 15;
  const visitParsed = Number.parseInt(visitMinutes, 10);
  const visit =
    Number.isFinite(visitParsed) && visitParsed >= 15
      ? Math.min(visitParsed, 12 * 60)
      : 90;
  const visitHoursLabel =
    visit >= 60
      ? `${(visit / 60).toFixed(visit % 60 === 0 ? 0 : 1)} h`
      : `${visit} min`;

  const geoMismatch = useMemo(() => {
    if (
      !tripOrigin ||
      !tripDestination ||
      !Number.isFinite(tripOrigin.lat) ||
      !Number.isFinite(tripDestination.lat)
    ) {
      return null;
    }
    const computed = computeActivityPlacement({
      activity: { lat: activity.latitude, lng: activity.longitude },
      origin: { lat: tripOrigin.lat, lng: tripOrigin.lng },
      destination: {
        lat: tripDestination.lat,
        lng: tripDestination.lng,
      },
    });
    if (placement === "destination" && computed !== "near_destination") {
      return "Cette activité se trouve sur votre trajet, mais pas près de votre destination. Nous l'ajouterons comme étape sur le trajet aller (la destination du voyage reste inchangée).";
    }
    return null;
  }, [
    activity.latitude,
    activity.longitude,
    placement,
    tripOrigin,
    tripDestination,
  ]);

  const effectivePlacement: InsertPlacement =
    geoMismatch && placement === "destination" ? "outbound" : placement;

  const placementLabels: Record<InsertPlacement, string> = {
    outbound: "Sur le trajet aller",
    destination: "À destination",
    return: "Sur le trajet retour",
    day: "À une journée précise",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="add-activity-title"
    >
      <div className="bg-card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-4 shadow-xl">
        <h3 id="add-activity-title" className="text-sebavio-navy font-semibold">
          Ajouter « {activity.name} »
        </h3>
        <p className="text-muted-foreground mt-2 text-sm">
          Cette activité ajoutera environ :
        </p>
        <ul className="text-sebavio-navy mt-1 list-inside list-disc text-sm">
          <li>+ {impactKm} km</li>
          <li>+ {impactMin} minutes de conduite</li>
          <li>+ {visitHoursLabel} sur place</li>
        </ul>
        <p className="text-muted-foreground mt-1 text-xs">
          Estimations — confirmation requise avant modification de
          l&apos;itinéraire.
        </p>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Temps prévu sur place (minutes)
          </span>
          <input
            type="number"
            min={15}
            max={720}
            step={15}
            className="border-input bg-background focus-visible:ring-sebavio-teal min-h-11 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
            value={visitMinutes}
            disabled={pending}
            onChange={(e) => setVisitMinutes(e.target.value)}
            aria-describedby="visit-minutes-hint"
          />
          <span
            id="visit-minutes-hint"
            className="text-muted-foreground text-xs"
          >
            Compte dans la durée totale du voyage (conduite + activités). Entre
            15 et 720 minutes.
          </span>
        </label>

        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium">
            Où l&apos;insérer ?
          </legend>
          <div className="grid gap-2">
            {INSERT_PLACEMENTS.map((p) => (
              <label
                key={p}
                className="border-border flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm"
              >
                <input
                  type="radio"
                  name="placement"
                  checked={placement === p}
                  onChange={() => setPlacement(p)}
                  disabled={pending}
                />
                {placementLabels[p]}
              </label>
            ))}
          </div>
        </fieldset>

        {geoMismatch ? (
          <p
            className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            role="status"
          >
            {geoMismatch}
          </p>
        ) : null}

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={asRouteStop}
            onChange={(e) => setAsRouteStop(e.target.checked)}
            disabled={pending}
          />
          <span>
            Ajouter comme arrêt routier — la destination finale du voyage
            restera inchangée.
            {effectivePlacement === "outbound" ? (
              <>
                {" "}
                L&apos;activité sera ajoutée comme étape intermédiaire sur le
                trajet aller.
              </>
            ) : null}
          </span>
        </label>

        {errorMessage ? (
          <p
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending}
            className="min-h-11 flex-1"
            onClick={() =>
              onConfirm({
                activityId: activity.id,
                placement: effectivePlacement,
                asRouteStop: asRouteStop && effectivePlacement !== "day",
                confirmImpact: true,
                estimatedVisitMinutes: visit,
              })
            }
          >
            <MapPin className="size-4" aria-hidden />
            {pending ? "Ajout en cours…" : "Confirmer l'ajout"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={pending}
            onClick={onClose}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
