"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useTripFuelEstimate,
  type TripFuelEstimateApi,
  type UseTripFuelEstimateArgs,
} from "@/features/fuel/hooks/use-trip-fuel-estimate";

const TripFuelEstimateContext = createContext<TripFuelEstimateApi | null>(null);

export function TripFuelEstimateProvider({
  children,
  ...args
}: UseTripFuelEstimateArgs & { children: ReactNode }) {
  const api = useTripFuelEstimate(args);
  return (
    <TripFuelEstimateContext.Provider value={api}>
      {children}
      <input
        type="hidden"
        data-testid="last-fuel-estimate-payload"
        value={api.lastPayload}
        readOnly
      />
    </TripFuelEstimateContext.Provider>
  );
}

export function useTripFuelEstimateContext(): TripFuelEstimateApi {
  const ctx = useContext(TripFuelEstimateContext);
  if (!ctx) {
    throw new Error(
      "useTripFuelEstimateContext doit être utilisé dans TripFuelEstimateProvider",
    );
  }
  return ctx;
}
