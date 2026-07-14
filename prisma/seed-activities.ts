/**
 * Seed activités / POI — DONNÉES FICTIVES (source = seed-dev).
 * Coordonnées réalistes au Québec pour tester proximité / carte.
 * Noms clairement fictifs — aucun vrai établissement.
 *
 * Ne jamais exécuter en production.
 * Usage : npm run prisma:seed:activities
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const SEED_SOURCE = "seed-dev";

type SeedActivity = {
  name: string;
  kind: "activity" | "poi";
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  region: string;
  familyScore: number;
  petFriendly: boolean;
  estimatedDurationMin: number;
  priceIndicative: number | null;
  season: string[];
  description: string;
  rating: number;
};

/** Emplacements géographiques QC réels, noms 100 % fictifs. */
const DEMO_ACTIVITIES: SeedActivity[] = [
  {
    name: "Sentier Démo des Cascades",
    kind: "activity",
    category: "randonnee",
    latitude: 47.5605,
    longitude: -70.3125,
    address: "1 sentier inventé",
    city: "Baie-Saint-Paul",
    region: "Capitale-Nationale",
    familyScore: 80,
    petFriendly: true,
    estimatedDurationMin: 120,
    priceIndicative: 0,
    season: ["spring", "summer", "fall"],
    description: "Boucle fictive pour tests de proximité Charlevoix.",
    rating: 4.3,
  },
  {
    name: "Musée Démo du Fjord",
    kind: "poi",
    category: "musee",
    latitude: 48.4244,
    longitude: -70.8923,
    address: "10 rue inventée du Fjord",
    city: "Saguenay",
    region: "Saguenay–Lac-Saint-Jean",
    familyScore: 70,
    petFriendly: false,
    estimatedDurationMin: 90,
    priceIndicative: 18,
    season: ["year_round"],
    description: "Exposition fictive — seed-dev uniquement.",
    rating: 4.1,
  },
  {
    name: "Plage Démo Percé",
    kind: "activity",
    category: "plage",
    latitude: 48.5205,
    longitude: -64.2135,
    address: "2 chemin fictif de la côte",
    city: "Percé",
    region: "Gaspésie–Îles-de-la-Madeleine",
    familyScore: 90,
    petFriendly: true,
    estimatedDurationMin: 180,
    priceIndicative: null,
    season: ["summer"],
    description: "Baignade fictive pour tests saisonniers.",
    rating: 4.6,
  },
  {
    name: "Belvédère Démo Orford",
    kind: "poi",
    category: "belvedere",
    latitude: 45.3167,
    longitude: -72.25,
    address: "5 sommet inventé",
    city: "Orford",
    region: "Estrie",
    familyScore: 75,
    petFriendly: true,
    estimatedDurationMin: 60,
    priceIndicative: 10,
    season: ["spring", "summer", "fall"],
    description: "Point de vue fictif Estrie.",
    rating: 4.4,
  },
  {
    name: "Parc Démo Mont-Royal",
    kind: "activity",
    category: "parc",
    latitude: 45.5088,
    longitude: -73.5878,
    address: "8 avenue démo",
    city: "Montréal",
    region: "Montréal",
    familyScore: 95,
    petFriendly: true,
    estimatedDurationMin: 150,
    priceIndicative: 0,
    season: ["year_round"],
    description: "Balade urbaine fictive.",
    rating: 4.7,
  },
  {
    name: "Cascade Démo Jacques-Cartier",
    kind: "poi",
    category: "cascade",
    latitude: 47.2,
    longitude: -71.45,
    address: "12 vallée inventée",
    city: "Stoneham-et-Tewkesbury",
    region: "Capitale-Nationale",
    familyScore: 85,
    petFriendly: false,
    estimatedDurationMin: 45,
    priceIndicative: 8,
    season: ["spring", "summer", "fall"],
    description: "Chute fictive — coordonnées QC réalistes.",
    rating: 4.2,
  },
  {
    name: "Restaurant Démo Rimouski",
    kind: "activity",
    category: "restaurant",
    latitude: 48.4489,
    longitude: -68.524,
    address: "3 quai inventé",
    city: "Rimouski",
    region: "Bas-Saint-Laurent",
    familyScore: 60,
    petFriendly: false,
    estimatedDurationMin: 75,
    priceIndicative: 35,
    season: ["year_round"],
    description: "Repas fictif pour filtre prix.",
    rating: 4.0,
  },
  {
    name: "Site Historique Démo Québec",
    kind: "poi",
    category: "historique",
    latitude: 46.8139,
    longitude: -71.208,
    address: "1 place fictive",
    city: "Québec",
    region: "Capitale-Nationale",
    familyScore: 88,
    petFriendly: false,
    estimatedDurationMin: 100,
    priceIndicative: 22,
    season: ["year_round"],
    description: "Visite guidée fictive Vieux-Québec.",
    rating: 4.5,
  },
  {
    name: "Randonnée Démo Tremblant",
    kind: "activity",
    category: "randonnee",
    latitude: 46.1185,
    longitude: -74.5962,
    address: "7 sentier inventé nord",
    city: "Mont-Tremblant",
    region: "Laurentides",
    familyScore: 70,
    petFriendly: true,
    estimatedDurationMin: 210,
    priceIndicative: 0,
    season: ["summer", "fall"],
    description: "Trek fictif Laurentides.",
    rating: 4.4,
  },
  {
    name: "Réserve Nature Démo Bic",
    kind: "poi",
    category: "nature",
    latitude: 48.375,
    longitude: -68.7,
    address: "4 falaise inventée",
    city: "Le Bic",
    region: "Bas-Saint-Laurent",
    familyScore: 82,
    petFriendly: false,
    estimatedDurationMin: 180,
    priceIndicative: 12,
    season: ["spring", "summer", "fall"],
    description: "Observation fictive — seed-dev.",
    rating: 4.8,
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refus : le seed activités (seed-dev) est interdit en production.",
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run the activities seed.");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    let created = 0;
    let updated = 0;

    for (const item of DEMO_ACTIVITIES) {
      const existing = await prisma.activity.findFirst({
        where: { name: item.name, source: SEED_SOURCE },
      });

      if (existing) {
        await prisma.activity.update({
          where: { id: existing.id },
          data: {
            kind: item.kind,
            category: item.category,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address,
            city: item.city,
            region: item.region,
            countryCode: "CA",
            familyScore: item.familyScore,
            petFriendly: item.petFriendly,
            estimatedDurationMin: item.estimatedDurationMin,
            priceIndicative: item.priceIndicative,
            season: item.season,
            description: item.description,
            rating: item.rating,
            deletedAt: null,
          },
        });
        updated += 1;
      } else {
        await prisma.activity.create({
          data: {
            name: item.name,
            kind: item.kind,
            category: item.category,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address,
            city: item.city,
            region: item.region,
            countryCode: "CA",
            familyScore: item.familyScore,
            petFriendly: item.petFriendly,
            estimatedDurationMin: item.estimatedDurationMin,
            priceIndicative: item.priceIndicative,
            season: item.season,
            description: item.description,
            rating: item.rating,
            source: SEED_SOURCE,
          },
        });
        created += 1;
      }
    }

    console.log(
      `Seed activités OK — créés: ${created}, mis à jour: ${updated} (source=${SEED_SOURCE}).`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
