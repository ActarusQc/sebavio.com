/**
 * Seed catalogue véhicules — DONNÉES FICTIVES / APPROXIMATIVES (source = seed-dev).
 * Ne jamais exécuter en production. Script séparé du seed principal.
 *
 * Usage : npm run prisma:seed:catalog
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const SEED_SOURCE = "seed-dev";

function assertNotProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Seed catalogue refusé : NODE_ENV=production. Les données seed-dev ne doivent jamais atteindre la production.",
    );
  }
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run the catalog seed.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

type SeedManufacturer = {
  name: string;
  countryCode: string;
  website?: string;
};

type SeedModel = {
  manufacturerName: string;
  category: string;
  modelName: string;
  trim: string;
  year: number;
  engine?: string;
  transmission?: string;
  driveType?: string;
  fuelType?: string;
  fuelCapacityL?: number;
  avgConsumption?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  gvwrKg?: number;
  sleepingCapacity?: number;
  freshWaterL?: number;
  greyWaterL?: number;
  blackWaterL?: number;
};

const MANUFACTURERS: SeedManufacturer[] = [
  { name: "Ford", countryCode: "US", website: "https://www.ford.com" },
  { name: "Chevrolet", countryCode: "US" },
  { name: "Toyota", countryCode: "JP", website: "https://www.toyota.com" },
  { name: "Winnebago", countryCode: "US" },
  { name: "Thor Motor Coach", countryCode: "US" },
  { name: "Airstream", countryCode: "US" },
  { name: "Forest River", countryCode: "US" },
  { name: "Jayco", countryCode: "US" },
  { name: "Mercedes-Benz", countryCode: "DE" },
  { name: "RAM", countryCode: "US" },
];

const MODELS: SeedModel[] = [
  {
    manufacturerName: "Ford",
    category: "Car",
    modelName: "F-150",
    trim: "XLT",
    year: 2024,
    engine: "3.5L EcoBoost V6",
    transmission: "10-speed auto",
    driveType: "4x4",
    fuelType: "Gasoline",
    fuelCapacityL: 136,
    avgConsumption: 12.5,
  },
  {
    manufacturerName: "Ford",
    category: "Car",
    modelName: "Transit",
    trim: "250",
    year: 2023,
    engine: "3.5L V6",
    driveType: "RWD",
    fuelType: "Gasoline",
    fuelCapacityL: 95,
    avgConsumption: 13.2,
  },
  {
    manufacturerName: "Chevrolet",
    category: "Car",
    modelName: "Silverado 1500",
    trim: "LT",
    year: 2024,
    engine: "5.3L V8",
    driveType: "4x4",
    fuelType: "Gasoline",
    fuelCapacityL: 91,
    avgConsumption: 13.8,
  },
  {
    manufacturerName: "Toyota",
    category: "Car",
    modelName: "Highlander",
    trim: "XLE",
    year: 2024,
    engine: "2.4L turbo",
    driveType: "AWD",
    fuelType: "Hybrid",
    fuelCapacityL: 65,
    avgConsumption: 6.8,
  },
  {
    manufacturerName: "Winnebago",
    category: "ClassC",
    modelName: "View",
    trim: "24D",
    year: 2024,
    engine: "3.0L diesel",
    driveType: "RWD",
    fuelType: "Diesel",
    fuelCapacityL: 100,
    avgConsumption: 14.5,
    lengthM: 7.8,
    widthM: 2.4,
    heightM: 3.4,
    gvwrKg: 5000,
    sleepingCapacity: 4,
    freshWaterL: 120,
    greyWaterL: 90,
    blackWaterL: 50,
  },
  {
    manufacturerName: "Winnebago",
    category: "ClassB",
    modelName: "Revel",
    trim: "44E",
    year: 2023,
    fuelType: "Diesel",
    driveType: "4x4",
    lengthM: 5.9,
    widthM: 2.1,
    heightM: 3.0,
    sleepingCapacity: 2,
    freshWaterL: 80,
    greyWaterL: 40,
    blackWaterL: 20,
  },
  {
    manufacturerName: "Thor Motor Coach",
    category: "ClassA",
    modelName: "Hurricane",
    trim: "29M",
    year: 2024,
    fuelType: "Gasoline",
    lengthM: 9.1,
    widthM: 2.6,
    heightM: 3.8,
    gvwrKg: 8200,
    sleepingCapacity: 6,
    freshWaterL: 200,
    greyWaterL: 150,
    blackWaterL: 100,
  },
  {
    manufacturerName: "Thor Motor Coach",
    category: "ClassC",
    modelName: "Four Winds",
    trim: "28Z",
    year: 2023,
    fuelType: "Gasoline",
    lengthM: 8.8,
    sleepingCapacity: 6,
  },
  {
    manufacturerName: "Airstream",
    category: "TravelTrailer",
    modelName: "Flying Cloud",
    trim: "25FB",
    year: 2024,
    lengthM: 7.7,
    widthM: 2.5,
    heightM: 2.9,
    sleepingCapacity: 4,
    freshWaterL: 140,
    greyWaterL: 110,
    blackWaterL: 70,
  },
  {
    manufacturerName: "Airstream",
    category: "TravelTrailer",
    modelName: "Basecamp",
    trim: "20X",
    year: 2023,
    lengthM: 6.1,
    sleepingCapacity: 2,
  },
  {
    manufacturerName: "Forest River",
    category: "FifthWheel",
    modelName: "Salem Hemisphere",
    trim: "356QB",
    year: 2024,
    lengthM: 11.5,
    sleepingCapacity: 8,
    freshWaterL: 200,
  },
  {
    manufacturerName: "Forest River",
    category: "TravelTrailer",
    modelName: "Cherokee",
    trim: "274DBH",
    year: 2023,
    lengthM: 9.2,
    sleepingCapacity: 8,
  },
  {
    manufacturerName: "Jayco",
    category: "ClassC",
    modelName: "Redhawk",
    trim: "26M",
    year: 2024,
    fuelType: "Gasoline",
    lengthM: 8.5,
    sleepingCapacity: 6,
  },
  {
    manufacturerName: "Jayco",
    category: "TravelTrailer",
    modelName: "Jay Flight",
    trim: "28BHS",
    year: 2023,
    lengthM: 9.0,
    sleepingCapacity: 8,
  },
  {
    manufacturerName: "Mercedes-Benz",
    category: "Car",
    modelName: "Sprinter",
    trim: "2500",
    year: 2024,
    engine: "2.0L turbodiesel",
    driveType: "RWD",
    fuelType: "Diesel",
    fuelCapacityL: 93,
    avgConsumption: 10.5,
  },
  {
    manufacturerName: "Mercedes-Benz",
    category: "ClassB",
    modelName: "Sprinter Camper Van",
    trim: "Base",
    year: 2023,
    fuelType: "Diesel",
    lengthM: 6.0,
    sleepingCapacity: 2,
  },
  {
    manufacturerName: "RAM",
    category: "Car",
    modelName: "1500",
    trim: "Big Horn",
    year: 2024,
    engine: "5.7L HEMI V8",
    driveType: "4x4",
    fuelType: "Gasoline",
    avgConsumption: 14.0,
  },
  {
    manufacturerName: "RAM",
    category: "Car",
    modelName: "ProMaster",
    trim: "2500",
    year: 2023,
    fuelType: "Gasoline",
    driveType: "FWD",
  },
  {
    manufacturerName: "Winnebago",
    category: "ClassA",
    modelName: "Adventurer",
    trim: "35F",
    year: 2022,
    fuelType: "Gasoline",
    lengthM: 10.8,
    sleepingCapacity: 6,
  },
  {
    manufacturerName: "Chevrolet",
    category: "Car",
    modelName: "Express",
    trim: "2500",
    year: 2022,
    fuelType: "Gasoline",
    driveType: "RWD",
  },
  {
    manufacturerName: "Ford",
    category: "ClassC",
    modelName: "E-450 Chassis Cutaway",
    trim: "Base",
    year: 2024,
    fuelType: "Gasoline",
    driveType: "RWD",
  },
  {
    manufacturerName: "Toyota",
    category: "Car",
    modelName: "Sienna",
    trim: "XSE",
    year: 2024,
    fuelType: "Hybrid",
    driveType: "AWD",
    avgConsumption: 6.5,
  },
  {
    manufacturerName: "Jayco",
    category: "FifthWheel",
    modelName: "Eagle HT",
    trim: "28.5RSTS",
    year: 2024,
    lengthM: 10.2,
    sleepingCapacity: 6,
  },
  {
    manufacturerName: "Thor Motor Coach",
    category: "ClassB",
    modelName: "Sequence",
    trim: "20L",
    year: 2024,
    fuelType: "Gasoline",
    lengthM: 6.2,
    sleepingCapacity: 2,
  },
  {
    manufacturerName: "Airstream",
    category: "TravelTrailer",
    modelName: "Globetrotter",
    trim: "27FB",
    year: 2022,
    lengthM: 8.4,
    sleepingCapacity: 4,
  },
];

async function main(): Promise<void> {
  assertNotProduction();
  const prisma = createPrismaClient();

  try {
    const manufacturerIds = new Map<string, string>();

    for (const mfr of MANUFACTURERS) {
      const row = await prisma.manufacturer.upsert({
        where: { name: mfr.name },
        update: {
          countryCode: mfr.countryCode,
          website: mfr.website ?? null,
          active: true,
          source: SEED_SOURCE,
        },
        create: {
          name: mfr.name,
          countryCode: mfr.countryCode,
          website: mfr.website ?? null,
          active: true,
          source: SEED_SOURCE,
        },
      });
      manufacturerIds.set(mfr.name, row.id);
    }

    let modelCount = 0;
    for (const model of MODELS) {
      const manufacturerId = manufacturerIds.get(model.manufacturerName);
      if (!manufacturerId) {
        throw new Error(
          `Constructeur manquant pour le seed: ${model.manufacturerName}`,
        );
      }

      const existing = await prisma.vehicleModel.findFirst({
        where: {
          manufacturerId,
          year: model.year,
          trim: model.trim,
          modelName: model.modelName,
        },
      });

      const data = {
        category: model.category,
        engine: model.engine ?? null,
        transmission: model.transmission ?? null,
        driveType: model.driveType ?? null,
        fuelType: model.fuelType ?? null,
        fuelCapacityL: model.fuelCapacityL ?? null,
        avgConsumption: model.avgConsumption ?? null,
        lengthM: model.lengthM ?? null,
        widthM: model.widthM ?? null,
        heightM: model.heightM ?? null,
        gvwrKg: model.gvwrKg ?? null,
        sleepingCapacity: model.sleepingCapacity ?? null,
        freshWaterL: model.freshWaterL ?? null,
        greyWaterL: model.greyWaterL ?? null,
        blackWaterL: model.blackWaterL ?? null,
        source: SEED_SOURCE,
      };

      if (existing) {
        await prisma.vehicleModel.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.vehicleModel.create({
          data: {
            manufacturerId,
            modelName: model.modelName,
            trim: model.trim,
            year: model.year,
            ...data,
          },
        });
      }
      modelCount += 1;
    }

    console.log(
      `Seed catalogue OK (source=${SEED_SOURCE}) : ${MANUFACTURERS.length} constructeurs, ${modelCount} modèles. Données fictives — hors production.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
