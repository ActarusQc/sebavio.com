import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEffectiveVehicleSpecifications } from "@/features/vehicles/lib/effective-specs";

/**
 * Vérifie que la migration des overrides a bien ajouté les colonnes
 * et que les véhicules existants restent lisibles.
 */
describe("migration vehicle_spec_overrides (intégration DB)", () => {
  it("16. colonnes présentes et véhicules existants lisibles", async () => {
    const rows = await prisma.$queryRaw<
      Array<{
        column_name: string;
      }>
    >`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_vehicles'
        AND column_name IN (
          'custom_consumption_l100',
          'manufacturer_fuel_type',
          'custom_fuel_type',
          'manufacturer_tank_capacity_l',
          'spec_overrides',
          'specs_updated_at'
        )
      ORDER BY column_name
    `;

    const names = rows.map((r) => r.column_name);
    expect(names).toContain("custom_consumption_l100");
    expect(names).toContain("manufacturer_fuel_type");
    expect(names).toContain("custom_fuel_type");
    expect(names).toContain("manufacturer_tank_capacity_l");
    expect(names).toContain("spec_overrides");
    expect(names).toContain("specs_updated_at");

    const routeCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'trip_routes'
        AND column_name IN ('vehicle_specs_snapshot', 'fuel_estimate_stale')
    `;
    expect(routeCols.map((r) => r.column_name).sort()).toEqual([
      "fuel_estimate_stale",
      "vehicle_specs_snapshot",
    ]);

    const sample = await prisma.userVehicle.findFirst({
      where: { deletedAt: null },
      select: {
        id: true,
        officialCombinedConsumptionL100: true,
        customConsumptionL100: true,
        realAvgConsumption: true,
        manufacturerFuelType: true,
        fuelType: true,
        customFuelType: true,
        tankCapacityOverride: true,
        manufacturerTankCapacityL: true,
      },
    });

    if (sample) {
      const effective = getEffectiveVehicleSpecifications({
        manufacturerConsumptionL100:
          sample.officialCombinedConsumptionL100 != null
            ? Number(sample.officialCombinedConsumptionL100)
            : null,
        customConsumptionL100:
          sample.customConsumptionL100 != null
            ? Number(sample.customConsumptionL100)
            : null,
        realAvgConsumption:
          sample.realAvgConsumption != null
            ? Number(sample.realAvgConsumption)
            : null,
        manufacturerTankCapacityL:
          sample.manufacturerTankCapacityL != null
            ? Number(sample.manufacturerTankCapacityL)
            : null,
        customTankCapacityL:
          sample.tankCapacityOverride != null
            ? Number(sample.tankCapacityOverride)
            : null,
        manufacturerFuelType: sample.manufacturerFuelType,
        customFuelType: sample.customFuelType,
        fuelType: sample.fuelType,
      });
      // Ne doit pas lever — véhicule existant toujours exploitable
      expect(effective).toBeDefined();
      expect(
        effective.consumption.source === "missing" ||
          effective.consumptionLPer100Km == null ||
          effective.consumptionLPer100Km > 0,
      ).toBe(true);
    }

    // Sanity Prisma Decimal / Json
    expect(Prisma.Decimal).toBeDefined();
  });
});
