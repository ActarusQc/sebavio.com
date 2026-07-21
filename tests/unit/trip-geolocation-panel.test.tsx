/** @vitest-environment jsdom */
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TripGeolocationPanel } from "@/features/trips/components/detail/trip-geolocation-panel";

describe("TripGeolocationPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("affiche le bouton d'activation si permission requise", () => {
    const onActivate = vi.fn();
    render(
      <TripGeolocationPanel
        uiState="permission_required"
        canCenter={false}
        onActivate={onActivate}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onRetry={vi.fn()}
        onCenter={vi.fn()}
      />,
    );
    expect(screen.getByTestId("trip-geo-activate")).toBeInTheDocument();
    expect(screen.getByText(/localisation désactivée/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("trip-geo-activate"));
    expect(onActivate).toHaveBeenCalled();
  });

  it("affiche pause quand actif", () => {
    render(
      <TripGeolocationPanel
        uiState="active"
        canCenter
        onActivate={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onRetry={vi.fn()}
        onCenter={vi.fn()}
      />,
    );
    expect(screen.getByTestId("trip-geo-pause")).toBeInTheDocument();
    expect(screen.getByTestId("trip-geo-center")).not.toBeDisabled();
  });

  it("désactive Me centrer sans position", () => {
    render(
      <TripGeolocationPanel
        uiState="paused"
        canCenter={false}
        onActivate={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onRetry={vi.fn()}
        onCenter={vi.fn()}
      />,
    );
    expect(screen.getByTestId("trip-geo-center")).toBeDisabled();
    expect(screen.getByTestId("trip-geo-resume")).toBeInTheDocument();
  });

  it("permission refusée sans spam d'activation", () => {
    render(
      <TripGeolocationPanel
        uiState="denied"
        canCenter={false}
        onActivate={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onRetry={vi.fn()}
        onCenter={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("trip-geo-activate")).toBeNull();
    expect(screen.getByTestId("trip-geo-retry")).toBeInTheDocument();
  });
});
