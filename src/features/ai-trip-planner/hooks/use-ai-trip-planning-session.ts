"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type {
  TripPlannerAccessDto,
  TripPlannerSessionDto,
} from "@/features/ai-trip-planner/types";
import type { AddressSelection } from "@/types/address";

type ApiOk<T> = { success: true; data: T };
type ApiFail = {
  success: false;
  error?: { message?: string; code?: string };
};

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiOk<T> | ApiFail | T;
  if (body && typeof body === "object" && "success" in body) {
    if ((body as ApiOk<T>).success === true) {
      return (body as ApiOk<T>).data;
    }
    const fail = body as ApiFail;
    throw new Error(
      fail.error?.message ?? "Une erreur est survenue. Veuillez réessayer.",
    );
  }
  if (!res.ok) {
    throw new Error("Une erreur est survenue. Veuillez réessayer.");
  }
  return body as T;
}

export function useAITripPlanningSession() {
  const [session, setSession] = useState<TripPlannerSessionDto | null>(null);
  const [access, setAccess] = useState<TripPlannerAccessDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTripId, setSuccessTripId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const createLockRef = useRef(false);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-trip-planner/session", {
        method: "GET",
        credentials: "same-origin",
      });
      const data = await parseJson<{
        session: TripPlannerSessionDto | null;
        access: TripPlannerAccessDto;
      }>(res);
      setAccess(data.access);
      if (data.session) {
        setSession(data.session);
      } else if (data.access.canUse) {
        const created = await fetch("/api/ai-trip-planner/session", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const createdData = await parseJson<{
          session: TripPlannerSessionDto;
          access: TripPlannerAccessDto;
        }>(created);
        setAccess(createdData.access);
        setSession(createdData.session);
      } else {
        setSession(null);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de charger la planification.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Chargement initial de la session (fetch async → setState dans callbacks).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap on mount
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || !session || sending) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSending(true);
      setError(null);

      const optimisticId = `local-${Date.now()}`;
      setSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: optimisticId,
                  role: "user",
                  content: text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : prev,
      );

      try {
        const res = await fetch(
          `/api/ai-trip-planner/session/${session.id}/message`,
          {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text }),
            signal: controller.signal,
          },
        );
        const data = await parseJson<{ session: TripPlannerSessionDto }>(res);
        startTransition(() => setSession(data.session));
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setSession((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.filter((m) => m.id !== optimisticId),
              }
            : prev,
        );
        setError(
          e instanceof Error
            ? e.message
            : "L’assistant n’a pas pu répondre. Réessayez.",
        );
      } finally {
        setSending(false);
      }
    },
    [session, sending],
  );

  const restart = useCallback(async () => {
    if (!session) return;
    setError(null);
    setSuccessTripId(null);
    try {
      await fetch(`/api/ai-trip-planner/session/${session.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const created = await fetch("/api/ai-trip-planner/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceNew: true }),
      });
      const data = await parseJson<{
        session: TripPlannerSessionDto;
        access: TripPlannerAccessDto;
      }>(created);
      setAccess(data.access);
      setSession(data.session);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de recommencer la planification.",
      );
    }
  }, [session]);

  const selectPlace = useCallback(
    async (
      field: "origin" | "destination",
      options: { useHome?: boolean; address?: AddressSelection | null },
    ) => {
      if (!session || sending) return;
      setSending(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/ai-trip-planner/session/${session.id}/place`,
          {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              field,
              useHome: Boolean(options.useHome),
              address: options.address
                ? {
                    formattedAddress: options.address.formattedAddress,
                    placeId: options.address.placeId,
                    latitude: options.address.latitude,
                    longitude: options.address.longitude,
                    city: options.address.city,
                    province: options.address.province,
                    postalCode: options.address.postalCode,
                    country: options.address.country,
                  }
                : null,
            }),
          },
        );
        const data = await parseJson<{ session: TripPlannerSessionDto }>(res);
        startTransition(() => setSession(data.session));
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Impossible d’enregistrer l’adresse. Réessayez.",
        );
      } finally {
        setSending(false);
      }
    },
    [session, sending],
  );

  const createTrip = useCallback(async () => {
    if (!session || createLockRef.current || creating) return null;
    createLockRef.current = true;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ai-trip-planner/session/${session.id}/create-trip`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        },
      );
      const data = await parseJson<{
        tripId: string;
        session: TripPlannerSessionDto;
      }>(res);
      setSession(data.session);
      setSuccessTripId(data.tripId);
      return data.tripId;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "La création du voyage a échoué. Réessayez.",
      );
      return null;
    } finally {
      setCreating(false);
      createLockRef.current = false;
    }
  }, [session, creating]);

  return {
    session,
    access,
    loading,
    sending,
    creating,
    error,
    successTripId,
    sendMessage,
    selectPlace,
    restart,
    createTrip,
    retry: bootstrap,
    clearError: () => setError(null),
  };
}
