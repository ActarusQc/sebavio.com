import type {
  MaintenanceScheduleProvider,
  MaintenanceScheduleResult,
  MaintenanceVehicleInput,
} from "./types";

/**
 * Fallback manuel : aucun calendrier inventé.
 * Permet à l’utilisateur d’ajouter des entretiens manuellement.
 */
export class ManualFallbackProvider implements MaintenanceScheduleProvider {
  readonly providerName = "manual";

  async getSchedule(
    _input: MaintenanceVehicleInput,
  ): Promise<MaintenanceScheduleResult> {
    void _input;
    return {
      providerName: this.providerName,
      sourceType: "manual",
      sourceReference: "manual-fallback",
      sourceVersion: "1",
      normalConditions: true,
      severeConditions: false,
      tasks: [],
      warning:
        "Nous n’avons pas encore trouvé le calendrier officiel de ce véhicule. Vous pouvez ajouter vos entretiens manuellement ou réessayer la synchronisation.",
    };
  }
}
