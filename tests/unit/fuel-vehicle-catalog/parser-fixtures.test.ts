import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { parseCatalogCsvFile } from "@/features/fuel-vehicle-catalog/infrastructure/csv-parser";
import type { OfficialCatalogResource } from "@/features/fuel-vehicle-catalog/domain/types";

const files: string[] = [];

async function writeTemp(name: string, content: string | Buffer) {
  const filePath = path.join(tmpdir(), `sebavio-nrcan-${name}`);
  await writeFile(filePath, content);
  files.push(filePath);
  return filePath;
}

afterAll(async () => {
  await Promise.all(files.map((f) => unlink(f).catch(() => undefined)));
});

const baseResource = (
  kind: OfficialCatalogResource["kind"],
): OfficialCatalogResource => ({
  id: "test",
  name: "fixture",
  url: "https://open.canada.ca/data/dataset/test/download/fixture.csv",
  format: "CSV",
  language: "en",
  kind,
  lastModified: null,
  size: null,
});

describe("parseCatalogCsvFile fixtures", () => {
  it("parse un CSV conventionnel anglais", async () => {
    const csv = [
      "Model year,Make,Model,Vehicle class,Engine size (L),Cylinders,Transmission,Fuel type,City (L/100 km),Highway (L/100 km),Combined (L/100 km),Combined (mpg),CO2 emissions (g/km),CO2 rating,Smog rating",
      "2022,Toyota,RAV4 AWD,SUV: Small,2.5,4,AS8,X,9.0,7.9,8.5,33,199,5,5",
      "2022,Toyota,RAV4 Hybrid AWD,SUV: Small,2.5,4,AV6,X,5.8,6.3,6.0,47,141,7,7",
    ].join("\n");
    const file = await writeTemp("conv.csv", csv);
    const result = await parseCatalogCsvFile(
      file,
      baseResource("conventional"),
    );
    expect(result.recordsRead).toBe(2);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.make).toBe("Toyota");
    expect(result.rows[0]?.combinedConsumptionL100Km).toBe(8.5);
    expect(result.rows[0]?.normalizedFuelType).toBe("regular");
    expect(result.rows[1]?.normalizedFuelType).toBe("hybrid");
    expect(result.rows[0]?.sourceKey).not.toBe(result.rows[1]?.sourceKey);
  });

  it("parse un CSV français latin1", async () => {
    const header =
      "Année modèle,Marque,Modèle,Catégorie de véhicule,Cylindrée (L),Cylindres,Transmission,Type de carburant,Ville (L/100 km),Route (L/100 km),Combinée (L/100 km),Combinée (mi/gal),Émissions de CO2 (g/km),Indice de CO2,Indice de smog";
    const line =
      "2026,Acura,Integra A-SPEC,Grande berline,1.5,4,AV7,Z,8.0,6.3,7.3,39,171,6,6";
    const buf = Buffer.from(`${header}\n${line}\n`, "latin1");
    const file = await writeTemp("fr.csv", buf);
    const result = await parseCatalogCsvFile(
      file,
      baseResource("conventional"),
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.make).toBe("Acura");
    expect(result.rows[0]?.normalizedFuelType).toBe("premium");
  });

  it("parse BEV et PHEV", async () => {
    const bev = [
      "Model year,Make,Model,Vehicle class,Motor (kW),Transmission,Fuel type,City (kWh/100 km),Highway (kWh/100 km),Combined (kWh/100 km),City (Le/100 km),Highway (Le/100 km),Combined (Le/100 km),Range (km),CO2 emissions (g/km),CO2 rating ,Smog rating,Recharge time (h)",
      "2022,Tesla,Model 3 RWD,Full-size,239,A1,B,13.5,15.0,14.2,1.5,1.7,1.6,438,0,10,10,10",
    ].join("\n");
    const bevFile = await writeTemp("bev.csv", bev);
    const bevResult = await parseCatalogCsvFile(bevFile, baseResource("bev"));
    expect(bevResult.rows[0]?.normalizedFuelType).toBe("electric");
    expect(bevResult.rows[0]?.electricRangeKm).toBe(438);
    expect(bevResult.rows[0]?.electricConsumptionKwh100Km).toBe(14.2);

    const phev = [
      "Model year,Make,Model,Vehicle class,Motor (kW),Engine size (L),Cylinders,Transmission,Fuel type 1,Combined Le/100 km,Range 1 (km),Recharge time (h),Fuel type 2,City (L/100 km),Highway (L/100 km),Combined (L/100 km),Range 2 (km),CO2 emissions (g/km),CO2 rating,Smog rating",
      "2022,Toyota,RAV4 Prime,SUV: Small,134,2.5,4,AV6,B,2.5 (22.3 kWh/100 km),68,4.5,X,6.0,6.2,6.1,960,40,9,7",
    ].join("\n");
    const phevFile = await writeTemp("phev.csv", phev);
    const phevResult = await parseCatalogCsvFile(
      phevFile,
      baseResource("phev"),
    );
    expect(phevResult.rows[0]?.normalizedFuelType).toBe("plugin_hybrid");
    expect(phevResult.rows[0]?.electricRangeKm).toBe(68);
    expect(phevResult.rows[0]?.combinedConsumptionL100Km).toBe(6.1);
  });

  it("rejette une ligne invalide sans tout arrêter", async () => {
    const csv = [
      "Model year,Make,Model,Vehicle class,Engine size (L),Cylinders,Transmission,Fuel type,City (L/100 km),Highway (L/100 km),Combined (L/100 km),Combined (mpg),CO2 emissions (g/km),CO2 rating,Smog rating",
      ",,,,2.5,4,AS8,X,9,8,8.5,33,200,5,5",
      "2022,Honda,CR-V,SUV,1.5,4,AV7,X,8.7,7.4,8.1,35,189,5,5",
    ].join("\n");
    const file = await writeTemp("bad.csv", csv);
    const result = await parseCatalogCsvFile(
      file,
      baseResource("conventional"),
    );
    expect(result.rejected.length).toBeGreaterThan(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.make).toBe("Honda");
  });
});
