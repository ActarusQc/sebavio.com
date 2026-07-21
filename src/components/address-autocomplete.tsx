"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  hasGoogleMapsApiKey,
  importGoogleLibrary,
} from "@/lib/google-maps-loader";
import type { AddressSelection } from "@/types/address";

export type { AddressSelection };

type AddressAutocompleteProps = {
  value?: string;
  defaultValue?: string;
  /** Valeurs geo initiales (édition). */
  defaultSelection?: Partial<AddressSelection> | null;
  onChange?: (value: string) => void;
  onAddressSelect?: (address: AddressSelection | null) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  name: string;
  disabled?: boolean;
  className?: string;
  /** Préfixe des champs cachés geo (défaut = name). */
  geoNamePrefix?: string;
};

type SuggestionItem = {
  key: string;
  label: string;
  secondary: string | null;
  prediction: PlacePredictionLike;
};

type PlacePredictionLike = {
  text?: { text?: string };
  mainText?: { text?: string };
  secondaryText?: { text?: string };
  placeId?: string;
  toPlace: () => PlaceLike;
};

type PlaceLike = {
  id?: string | null;
  formattedAddress?: string | null;
  location?: { lat: () => number; lng: () => number } | null;
  addressComponents?: Array<{
    longText?: string | null;
    shortText?: string | null;
    types?: string[];
  }> | null;
  fetchFields: (opts: { fields: string[] }) => Promise<void>;
};

type AutocompleteSessionTokenLike = new () => unknown;

type PlacesLibrary = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      sessionToken?: unknown;
      language?: string;
      region?: string;
      locationBias?: {
        west: number;
        north: number;
        east: number;
        south: number;
      };
    }) => Promise<{
      suggestions: Array<{ placePrediction: PlacePredictionLike | null }>;
    }>;
  };
  AutocompleteSessionToken: AutocompleteSessionTokenLike;
};

/** Bias Québec (viewport) — résultats hors zone toujours possibles. */
const QUEBEC_BIAS = {
  west: -79.9,
  south: 44.9,
  east: -57.0,
  north: 62.6,
} as const;

const DEBOUNCE_MS = 300;
const MIN_CHARS = 3;

function componentOf(
  components: PlaceLike["addressComponents"],
  type: string,
  preferShort = false,
): string | null {
  if (!components) return null;
  const match = components.find((c) => c.types?.includes(type));
  if (!match) return null;
  const value = preferShort
    ? (match.shortText ?? match.longText)
    : (match.longText ?? match.shortText);
  return value?.trim() || null;
}

function parsePlace(place: PlaceLike): AddressSelection | null {
  const placeId = place.id?.trim();
  const location = place.location;
  if (!placeId || !location) return null;

  const latitude = location.lat();
  const longitude = location.lng();
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const city =
    componentOf(place.addressComponents, "locality") ??
    componentOf(place.addressComponents, "postal_town") ??
    componentOf(place.addressComponents, "sublocality") ??
    componentOf(place.addressComponents, "administrative_area_level_3");

  return {
    formattedAddress:
      place.formattedAddress?.trim() ||
      [
        city,
        componentOf(place.addressComponents, "administrative_area_level_1"),
      ]
        .filter(Boolean)
        .join(", ") ||
      placeId,
    placeId,
    latitude,
    longitude,
    streetNumber: componentOf(place.addressComponents, "street_number"),
    route: componentOf(place.addressComponents, "route"),
    city,
    province: componentOf(
      place.addressComponents,
      "administrative_area_level_1",
      true,
    ),
    postalCode: componentOf(place.addressComponents, "postal_code"),
    country: componentOf(place.addressComponents, "country", true),
  };
}

function emptyGeo(): {
  placeId: string;
  latitude: string;
  longitude: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  streetNumber: string;
  route: string;
} {
  return {
    placeId: "",
    latitude: "",
    longitude: "",
    city: "",
    province: "",
    postalCode: "",
    country: "",
    streetNumber: "",
    route: "",
  };
}

function geoFromSelection(selection: AddressSelection) {
  return {
    placeId: selection.placeId,
    latitude: String(selection.latitude),
    longitude: String(selection.longitude),
    city: selection.city ?? "",
    province: selection.province ?? "",
    postalCode: selection.postalCode ?? "",
    country: selection.country ?? "",
    streetNumber: selection.streetNumber ?? "",
    route: selection.route ?? "",
  };
}

function geoFromPartial(
  selection: Partial<AddressSelection> | null | undefined,
) {
  if (!selection) return emptyGeo();
  return {
    placeId: selection.placeId ?? "",
    latitude:
      selection.latitude != null && Number.isFinite(selection.latitude)
        ? String(selection.latitude)
        : "",
    longitude:
      selection.longitude != null && Number.isFinite(selection.longitude)
        ? String(selection.longitude)
        : "",
    city: selection.city ?? "",
    province: selection.province ?? "",
    postalCode: selection.postalCode ?? "",
    country: selection.country ?? "",
    streetNumber: selection.streetNumber ?? "",
    route: selection.route ?? "",
  };
}

export function AddressAutocomplete({
  value,
  defaultValue = "",
  defaultSelection = null,
  onChange,
  onAddressSelect,
  placeholder = "Ville ou adresse",
  required,
  id,
  name,
  disabled,
  className,
  geoNamePrefix,
}: AddressAutocompleteProps) {
  const reactId = useId();
  const listboxId = `${id ?? name}-suggestions-${reactId}`;
  const prefix = geoNamePrefix ?? name;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionTokenRef = useRef<unknown>(null);
  const placesRef = useRef<PlacesLibrary | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const text = isControlled ? value : internalValue;

  const [geo, setGeo] = useState(() => geoFromPartial(defaultSelection));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const placesAvailable = hasGoogleMapsApiKey();

  const updateMenuPosition = useCallback(() => {
    try {
      const el = inputRef.current;
      if (!el || typeof el.getBoundingClientRect !== "function") {
        // Repli : ancrage via le conteneur si la ref input n’est pas un nœud DOM.
        const root = rootRef.current;
        if (!root || typeof root.getBoundingClientRect !== "function") return;
        const rect = root.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
        return;
      }
      const rect = el.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    } catch {
      // Ne jamais faire échouer la recherche d’adresses pour un souci de positionnement.
    }
  }, []);

  const clearSession = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  const ensurePlaces = useCallback(async (): Promise<PlacesLibrary> => {
    if (placesRef.current) return placesRef.current;
    const places = (await importGoogleLibrary("places")) as PlacesLibrary;
    placesRef.current = places;
    return places;
  }, []);

  const ensureSession = useCallback(async () => {
    const places = await ensurePlaces();
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, [ensurePlaces]);

  const clearSelectionMeta = useCallback(() => {
    setGeo(emptyGeo());
    onAddressSelect?.(null);
  }, [onAddressSelect]);

  const applySelection = useCallback(
    (selection: AddressSelection) => {
      if (!isControlled) setInternalValue(selection.formattedAddress);
      onChange?.(selection.formattedAddress);
      setGeo(geoFromSelection(selection));
      onAddressSelect?.(selection);
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      setError(null);
      clearSession();
    },
    [clearSession, isControlled, onAddressSelect, onChange],
  );

  const search = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < MIN_CHARS || !placesAvailable) {
        setSuggestions([]);
        setLoading(false);
        setOpen(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const places = await ensurePlaces();
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        const sessionToken = await ensureSession();
        const result =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: trimmed,
            sessionToken,
            language: "fr",
            region: "ca",
            locationBias: { ...QUEBEC_BIAS },
          });

        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        const raw = result?.suggestions ?? [];
        const items: SuggestionItem[] = raw
          .map((s, index) => {
            const prediction = s.placePrediction;
            if (!prediction) return null;
            const label =
              prediction.mainText?.text?.trim() ||
              prediction.text?.text?.trim() ||
              "";
            if (!label) return null;
            return {
              key: prediction.placeId ?? `${label}-${index}`,
              label,
              secondary: prediction.secondaryText?.text?.trim() || null,
              prediction,
            };
          })
          .filter((item): item is SuggestionItem => item != null);

        setSuggestions(items);
        setActiveIndex(items.length > 0 ? 0 : -1);
        setError(null);
        setOpen(true);
        updateMenuPosition();
      } catch (err) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        if (process.env.NODE_ENV !== "production") {
          console.error("[AddressAutocomplete] search failed", err);
        }
        setSuggestions([]);
        setOpen(true);
        updateMenuPosition();
        setError(
          "Suggestions d'adresses temporairement indisponibles. Saisie manuelle possible.",
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [ensurePlaces, ensureSession, placesAvailable, updateMenuPosition],
  );

  const scheduleSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void search(query);
      }, DEBOUNCE_MS);
    },
    [search],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(listboxId);
      if (menu?.contains(target)) return;
      setOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [listboxId, open]);

  const selectPrediction = async (prediction: PlacePredictionLike) => {
    setLoading(true);
    setError(null);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["id", "formattedAddress", "location", "addressComponents"],
      });
      const selection = parsePlace(place);
      if (!selection) {
        setError(
          "Adresse incomplète. Choisissez une autre suggestion ou saisissez manuellement.",
        );
        return;
      }
      applySelection(selection);
    } catch {
      setError(
        "Impossible de récupérer cette adresse. Réessayez ou saisissez manuellement.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
    clearSelectionMeta();
    if (next.trim().length < MIN_CHARS) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      setError(null);
      return;
    }
    scheduleSearch(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      if (suggestions.length > 0) {
        setOpen(true);
        updateMenuPosition();
      }
      return;
    }
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) =>
        suggestions.length === 0 ? -1 : (i + 1) % suggestions.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) =>
        suggestions.length === 0
          ? -1
          : (i - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault();
        void selectPrediction(suggestions[activeIndex].prediction);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showEmpty =
    open &&
    !loading &&
    !error &&
    text.trim().length >= MIN_CHARS &&
    suggestions.length === 0;

  const menu =
    mounted &&
    open &&
    menuPos &&
    placesAvailable &&
    createPortal(
      <div
        id={listboxId}
        role="listbox"
        aria-label="Suggestions d'adresses"
        className="border-border bg-popover text-popover-foreground fixed z-[80] max-h-60 overflow-auto rounded-lg border shadow-lg"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
        }}
      >
        {loading ? (
          <p
            className="text-muted-foreground px-2.5 py-2 text-sm"
            role="status"
          >
            Recherche…
          </p>
        ) : null}
        {error ? (
          <p className="text-destructive px-2.5 py-2 text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {showEmpty ? (
          <p
            className="text-muted-foreground px-2.5 py-2 text-sm"
            role="status"
          >
            Aucune adresse trouvée
          </p>
        ) : null}
        {suggestions.map((item, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={item.key}
              type="button"
              role="option"
              aria-selected={active}
              id={`${listboxId}-option-${index}`}
              className={cn(
                "hover:bg-accent w-full px-2.5 py-2 text-left text-sm outline-none",
                active && "bg-accent",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void selectPrediction(item.prediction)}
            >
              <span className="block font-medium">{item.label}</span>
              {item.secondary ? (
                <span className="text-muted-foreground block text-xs">
                  {item.secondary}
                </span>
              ) : null}
            </button>
          );
        })}
        {(suggestions.length > 0 || showEmpty || error) && (
          <p className="text-muted-foreground border-border border-t px-2.5 py-1.5 text-[10px] tracking-wide uppercase">
            Powered by Google
          </p>
        )}
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <Input
        ref={inputRef}
        id={id}
        name={name}
        value={text}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        onChange={(e) => handleTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 || error) {
            setOpen(true);
            updateMenuPosition();
          }
        }}
      />
      {loading && !open ? (
        <span
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs"
          aria-hidden
        >
          …
        </span>
      ) : null}

      <input type="hidden" name={`${prefix}PlaceId`} value={geo.placeId} />
      <input type="hidden" name={`${prefix}Latitude`} value={geo.latitude} />
      <input type="hidden" name={`${prefix}Longitude`} value={geo.longitude} />
      <input type="hidden" name={`${prefix}City`} value={geo.city} />
      <input type="hidden" name={`${prefix}Province`} value={geo.province} />
      <input
        type="hidden"
        name={`${prefix}PostalCode`}
        value={geo.postalCode}
      />
      <input type="hidden" name={`${prefix}Country`} value={geo.country} />
      <input
        type="hidden"
        name={`${prefix}StreetNumber`}
        value={geo.streetNumber}
      />
      <input type="hidden" name={`${prefix}Route`} value={geo.route} />

      {menu}
    </div>
  );
}
