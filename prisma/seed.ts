import "dotenv/config";
import { hash } from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function requireSeedPassword(): string {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Seed refusé : NODE_ENV=production. Le seed de développement ne peut pas s'exécuter en production.",
    );
  }

  const password = process.env.SEED_PASSWORD;
  if (!password || password.trim() === "") {
    throw new Error(
      "Seed impossible : variable SEED_PASSWORD absente ou vide. Définis-la dans le fichier .env.",
    );
  }

  return password;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run the seed.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main(): Promise<void> {
  const password = requireSeedPassword();
  const passwordHash = await hash(password);

  const accounts = [
    {
      email: "superadmin@sebavio.local",
      role: "super_admin",
      status: "active",
    },
    {
      email: "admin@sebavio.local",
      role: "admin",
      status: "active",
    },
    {
      email: "user@sebavio.local",
      role: "user",
      status: "active",
    },
  ] as const;

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        passwordHash,
        role: account.role,
        status: account.status,
        deletedAt: null,
      },
      create: {
        email: account.email,
        passwordHash,
        role: account.role,
        status: account.status,
      },
    });
  }

  console.log(
    `Seed OK : ${accounts.length} comptes de développement (super_admin, admin, user).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
