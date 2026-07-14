/**
 * Seed campings — DONNÉES FICTIVES (source = seed-dev).
 * Coordonnées réalistes au Québec pour tester proximité / carte.
 * Noms clairement fictifs — aucun vrai établissement.
 *
 * Ne jamais exécuter en production.
 * Usage : npm run prisma:seed:campgrounds
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const SEED_SOURCE = "seed-dev";

type SeedCampground = {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  region: string;
  campgroundType: string;
  maxLengthM: number | null;
  services: string[];
  petFriendly: boolean;
  rating: number;
  priceMin: number;
  priceMax: number;
};

/** Emplacements géographiques QC réels, noms 100 % fictifs. */
const DEMO_CAMPGROUNDS: SeedCampground[] = [
  {
    name: "Camping Démo du Fjord",
    latitude: 48.4244,
    longitude: -70.8923,
    address: "1 chemin fictif du Fjord",
    city: "Saguenay",
    region: "Saguenay–Lac-Saint-Jean",
    campgroundType: "rv_park",
    maxLengthM: 12,
    services: ["electricity", "water", "dump_station", "wifi"],
    petFriendly: true,
    rating: 4.2,
    priceMin: 35,
    priceMax: 55,
  },
  {
    name: "Halte Démo des Laurentides",
    latitude: 46.0833,
    longitude: -74.2833,
    address: "10 sentier inventé",
    city: "Saint-Donat",
    region: "Lanaudière",
    campgroundType: "campground",
    maxLengthM: 10,
    services: ["electricity", "water", "shower"],
    petFriendly: true,
    rating: 4.0,
    priceMin: 30,
    priceMax: 48,
  },
  {
    name: "Parc VR Démo Gaspésie",
    latitude: 48.8302,
    longitude: -64.4818,
    address: "22 avenue démo Percé",
    city: "Percé",
    region: "Gaspésie–Îles-de-la-Madeleine",
    campgroundType: "rv_park",
    maxLengthM: 14,
    services: ["electricity", "water", "sewer", "wifi", "propane"],
    petFriendly: false,
    rating: 4.5,
    priceMin: 42,
    priceMax: 68,
  },
  {
    name: "Camping Démo Montérégie",
    latitude: 45.383,
    longitude: -73.15,
    address: "5 rang fictif",
    city: "Saint-Jean-sur-Richelieu",
    region: "Montérégie",
    campgroundType: "campground",
    maxLengthM: 11,
    services: ["electricity", "water", "dump_station", "laundry"],
    petFriendly: true,
    rating: 3.8,
    priceMin: 28,
    priceMax: 45,
  },
  {
    name: "Station Nuit Démo Charlevoix",
    latitude: 47.5605,
    longitude: -70.3125,
    address: "8 route inventée",
    city: "Baie-Saint-Paul",
    region: "Capitale-Nationale",
    campgroundType: "overnight",
    maxLengthM: 9,
    services: ["electricity", "wifi"],
    petFriendly: true,
    rating: 3.5,
    priceMin: 20,
    priceMax: 35,
  },
  {
    name: "Camping Démo Estrie Lac",
    latitude: 45.4,
    longitude: -72.15,
    address: "15 chemin du lac fictif",
    city: "Magog",
    region: "Estrie",
    campgroundType: "campground",
    maxLengthM: 12,
    services: ["electricity", "water", "sewer", "pool", "shower"],
    petFriendly: true,
    rating: 4.1,
    priceMin: 38,
    priceMax: 60,
  },
  {
    name: "Vidange Démo Capitale",
    latitude: 46.8139,
    longitude: -71.208,
    address: "100 boulevard démo",
    city: "Québec",
    region: "Capitale-Nationale",
    campgroundType: "dump_station",
    maxLengthM: null,
    services: ["dump_station", "water"],
    petFriendly: false,
    rating: 3.2,
    priceMin: 0,
    priceMax: 15,
  },
  {
    name: "Camping Démo Outaouais",
    latitude: 45.4765,
    longitude: -75.7013,
    address: "3 promenade inventée",
    city: "Gatineau",
    region: "Outaouais",
    campgroundType: "rv_park",
    maxLengthM: 13,
    services: ["electricity", "water", "sewer", "wifi", "propane"],
    petFriendly: true,
    rating: 4.3,
    priceMin: 40,
    priceMax: 62,
  },
  {
    name: "Halte Démo Côte-Nord",
    latitude: 49.2167,
    longitude: -68.15,
    address: "7 route 138 fictive",
    city: "Baie-Comeau",
    region: "Côte-Nord",
    campgroundType: "campground",
    maxLengthM: 10,
    services: ["electricity", "water", "dump_station"],
    petFriendly: true,
    rating: 3.9,
    priceMin: 25,
    priceMax: 40,
  },
  {
    name: "Camping Démo Île d'Orléans",
    latitude: 46.8833,
    longitude: -71.0,
    address: "12 chemin royal fictif",
    city: "Sainte-Famille",
    region: "Capitale-Nationale",
    campgroundType: "campground",
    maxLengthM: 8,
    services: ["electricity", "water", "shower"],
    petFriendly: false,
    rating: 4.0,
    priceMin: 32,
    priceMax: 50,
  },
  {
    name: "Parc VR Démo Montréal Est",
    latitude: 45.6,
    longitude: -73.55,
    address: "50 rue inventée Est",
    city: "Montréal",
    region: "Montréal",
    campgroundType: "rv_park",
    maxLengthM: 11,
    services: ["electricity", "water", "wifi", "laundry"],
    petFriendly: true,
    rating: 3.6,
    priceMin: 45,
    priceMax: 75,
  },
  {
    name: "Camping Démo Bas-Saint-Laurent",
    latitude: 48.4488,
    longitude: -68.523,
    address: "9 avenue démo",
    city: "Rimouski",
    region: "Bas-Saint-Laurent",
    campgroundType: "campground",
    maxLengthM: 12,
    services: ["electricity", "water", "dump_station", "wifi"],
    petFriendly: true,
    rating: 4.2,
    priceMin: 33,
    priceMax: 52,
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Seed campings refusé : NODE_ENV=production. Les données seed-dev ne doivent jamais atteindre la production.",
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run the campgrounds seed.");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    let upserted = 0;
    for (const item of DEMO_CAMPGROUNDS) {
      const existing = await prisma.campground.findFirst({
        where: { name: item.name, source: SEED_SOURCE },
      });

      if (existing) {
        await prisma.campground.update({
          where: { id: existing.id },
          data: {
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address,
            city: item.city,
            region: item.region,
            campgroundType: item.campgroundType,
            maxLengthM: item.maxLengthM,
            services: item.services,
            petFriendly: item.petFriendly,
            rating: item.rating,
            priceMin: item.priceMin,
            priceMax: item.priceMax,
            deletedAt: null,
            source: SEED_SOURCE,
          },
        });
      } else {
        await prisma.campground.create({
          data: {
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address,
            city: item.city,
            region: item.region,
            countryCode: "CA",
            campgroundType: item.campgroundType,
            maxLengthM: item.maxLengthM,
            services: item.services,
            petFriendly: item.petFriendly,
            rating: item.rating,
            priceMin: item.priceMin,
            priceMax: item.priceMax,
            source: SEED_SOURCE,
          },
        });
      }
      upserted += 1;
    }

    console.log(
      `Seed campings OK (source=${SEED_SOURCE}) : ${upserted} fiches fictives QC. Hors production.`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
