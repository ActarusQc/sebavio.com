/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { afterEach } from "vitest";
import { TripHeader } from "@/features/trips/components/detail/trip-header";
import { TripAssistantProvider } from "@/features/ai/components/trip-assistant-context";
import {
  TripAssistantFab,
  TripAssistantSheet,
} from "@/features/ai/components/trip-assistant-panel";
import { TripAiSummaryCard } from "@/features/ai/components/trip-ai-summary-card";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const bootstrap = vi.fn();
const sendMessage = vi.fn();

vi.mock("@/features/ai/actions", () => ({
  getTripAssistantBootstrapAction: (...args: unknown[]) => bootstrap(...args),
  sendTripAssistantMessageAction: (...args: unknown[]) => sendMessage(...args),
  applyTripAssistantActionAction: vi.fn(),
}));

beforeEach(() => {
  bootstrap.mockReset();
  sendMessage.mockReset();
  bootstrap.mockResolvedValue({
    ok: true,
    data: {
      canUsePersonalizedAi: true,
      canUseRecommendations: true,
      aiEnabled: true,
      conversation: null,
      demoResponse: {
        summary: "demo",
        answer: "demo",
        status: "ok",
        warnings: [],
        suggestions: [],
        missingInformation: [],
      },
      quickActions: [],
    },
  });
});

afterEach(() => {
  cleanup();
});

describe("TripHeader", () => {
  it("affiche les données dynamiques du voyage", () => {
    render(
      <TripHeader
        tripId="t1"
        title="Week-end en Charlevoix"
        status="in_progress"
        origin="Montréal"
        originCity="Montréal"
        originProvince="QC"
        destination="Baie-Saint-Paul"
        destinationCity="Baie-Saint-Paul"
        destinationProvince="QC"
        departureDate="2026-07-10"
        returnDate="2026-07-12"
        canEdit
      />,
    );

    expect(screen.getByTestId("trip-header")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Week-end en Charlevoix",
    );
    expect(screen.getByText(/Montréal/)).toBeInTheDocument();
    expect(screen.getByText(/Baie-Saint-Paul/)).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Retour aux voyages/i }),
    ).toHaveAttribute("href", "/dashboard/trips");
  });
});

describe("Assistant Sebavio — page voyage", () => {
  function renderAssistant() {
    return render(
      <TripAssistantProvider tripId="trip-1">
        <TripAiSummaryCard />
        <TripAssistantFab />
        <TripAssistantSheet />
      </TripAssistantProvider>,
    );
  }

  it("charge le bootstrap sans envoyer de message IA", async () => {
    renderAssistant();
    await waitFor(() => expect(bootstrap).toHaveBeenCalledWith("trip-1"));
    expect(sendMessage).not.toHaveBeenCalled();
    expect(screen.getByTestId("trip-ai-summary-card")).toBeInTheDocument();
  });

  it("ouvre le panneau via le FAB", async () => {
    renderAssistant();
    await waitFor(() => expect(bootstrap).toHaveBeenCalled());
    const fab = screen.getByTestId("trip-assistant-open");
    expect(fab).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(fab);
    await waitFor(() =>
      expect(screen.getByTestId("trip-assistant-open")).toHaveAttribute(
        "aria-expanded",
        "true",
      ),
    );
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("lance une analyse uniquement au clic", async () => {
    sendMessage.mockResolvedValue({
      ok: true,
      data: {
        mode: "personalized",
        response: {
          summary: "ok",
          answer: "Analyse terminée",
          status: "ok",
          warnings: [
            {
              code: "w",
              title: "Conduite longue",
              description: "x",
              severity: "warning",
            },
          ],
          suggestions: [],
          missingInformation: [],
          analysis: {
            ok: [],
            watch: ["Journée de conduite assez longue"],
            suggestions: [],
            missing: [],
          },
        },
        conversationId: "c1",
        promptVersion: "v1",
        model: "test",
      },
    });

    renderAssistant();
    await waitFor(() => expect(bootstrap).toHaveBeenCalled());
    expect(sendMessage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("trip-ai-analyze"));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
    expect(sendMessage.mock.calls[0]?.[0]).toMatchObject({
      tripId: "trip-1",
      requestType: "analyze",
    });
  });

  it("affiche l’invitation forfait Découverte sans analyse personnalisée", async () => {
    bootstrap.mockResolvedValue({
      ok: true,
      data: {
        canUsePersonalizedAi: false,
        canUseRecommendations: false,
        aiEnabled: true,
        conversation: null,
        demoResponse: {
          summary: "demo",
          answer: "demo",
          status: "ok",
          warnings: [],
          suggestions: [],
          missingInformation: [],
        },
        quickActions: [],
      },
    });

    renderAssistant();
    await waitFor(() =>
      expect(screen.getByText(/Débloquez l’analyse/i)).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("trip-ai-analyze")).not.toBeInTheDocument();
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
