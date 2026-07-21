import { hashSchedulePayload } from "./normalize";
import type {
  MaintenanceScheduleProvider,
  MaintenanceScheduleResult,
  MaintenanceVehicleInput,
  NormalizedMaintenanceTask,
} from "./types";

const DEMO_WARNING =
  "Données de démonstration — ne pas utiliser comme recommandation mécanique officielle.";

function demoTasks(prefix: string): NormalizedMaintenanceTask[] {
  return [
    {
      externalId: `${prefix}-oil`,
      category: "engine_oil",
      title: "Vidange d’huile moteur",
      description: "Remplacement de l’huile moteur (démonstration).",
      actionType: "replace",
      intervalKm: 8000,
      intervalMonths: 6,
      firstDueKm: 8000,
      firstDueMonths: 6,
      conditionType: "both",
      priority: "high",
      officialManufacturerRecommendation: false,
      inspectionOnly: false,
      notes: DEMO_WARNING,
      sourceReference: "sebavio-mock",
    },
    {
      externalId: `${prefix}-oil-filter`,
      category: "oil_filter",
      title: "Filtre à huile",
      actionType: "replace",
      intervalKm: 8000,
      intervalMonths: 6,
      conditionType: "both",
      priority: "medium",
      officialManufacturerRecommendation: false,
      inspectionOnly: false,
      notes: DEMO_WARNING,
      sourceReference: "sebavio-mock",
    },
    {
      externalId: `${prefix}-cabin`,
      category: "cabin_filter",
      title: "Filtre d’habitacle",
      actionType: "replace",
      intervalKm: 24000,
      intervalMonths: 12,
      conditionType: "both",
      priority: "low",
      officialManufacturerRecommendation: false,
      inspectionOnly: false,
      notes: DEMO_WARNING,
      sourceReference: "sebavio-mock",
    },
    {
      externalId: `${prefix}-brakes`,
      category: "brakes",
      title: "Inspection des freins",
      description:
        "Inspection visuelle des plaquettes et disques — aucun kilométrage de remplacement inventé.",
      actionType: "inspect",
      intervalKm: 20000,
      intervalMonths: 12,
      conditionType: "both",
      priority: "high",
      officialManufacturerRecommendation: false,
      inspectionOnly: true,
      notes: DEMO_WARNING,
      sourceReference: "sebavio-mock",
    },
    {
      externalId: `${prefix}-tires`,
      category: "tires",
      title: "Rotation des pneus",
      actionType: "rotate",
      intervalKm: 10000,
      intervalMonths: 6,
      conditionType: "both",
      priority: "medium",
      officialManufacturerRecommendation: false,
      inspectionOnly: false,
      notes: DEMO_WARNING,
      sourceReference: "sebavio-mock",
    },
    {
      externalId: `${prefix}-severe-air`,
      category: "air_filter",
      title: "Filtre à air (usage sévère)",
      actionType: "replace",
      intervalKm: 15000,
      intervalMonths: 12,
      conditionType: "severe",
      priority: "medium",
      officialManufacturerRecommendation: false,
      inspectionOnly: false,
      notes: DEMO_WARNING,
      sourceReference: "sebavio-mock",
    },
  ];
}

type DemoVehicle = {
  year: number;
  make: string;
  model: string;
  prefix: string;
};

const DEMO_VEHICLES: DemoVehicle[] = [
  { year: 2021, make: "toyota", model: "rav4", prefix: "rav4-2021" },
  { year: 2022, make: "ford", model: "f-150", prefix: "f150-2022" },
  { year: 2020, make: "honda", model: "civic", prefix: "civic-2020" },
  { year: 2023, make: "ram", model: "1500", prefix: "ram1500-2023" },
];

function matchDemo(input: MaintenanceVehicleInput): DemoVehicle | null {
  const make = (input.make ?? input.manufacturer ?? "").trim().toLowerCase();
  const model = (input.model ?? "").trim().toLowerCase();
  const year = input.year ?? null;

  return (
    DEMO_VEHICLES.find(
      (v) =>
        make.includes(v.make) &&
        model.includes(v.model) &&
        (year == null || year === v.year),
    ) ?? null
  );
}

/**
 * Fournisseur mock — développement et tests uniquement.
 * Jamais activé automatiquement en production.
 */
export class MockMaintenanceProvider implements MaintenanceScheduleProvider {
  readonly providerName = "mock";

  async getSchedule(
    input: MaintenanceVehicleInput,
  ): Promise<MaintenanceScheduleResult> {
    const matched = matchDemo(input);
    const vehicle = matched ?? {
      year: input.year ?? 2021,
      make: (input.make ?? "demo").toLowerCase(),
      model: (input.model ?? "vehicle").toLowerCase(),
      prefix: "generic-demo",
    };

    const tasks = demoTasks(vehicle.prefix);
    return {
      providerName: this.providerName,
      providerVehicleId: vehicle.prefix,
      sourceType: "mock",
      sourceReference: "sebavio-mock-v1",
      sourceVersion: "mock-1",
      normalConditions: true,
      severeConditions: true,
      tasks,
      rawDataHash: hashSchedulePayload(this.providerName, tasks),
      warning: DEMO_WARNING,
    };
  }
}
