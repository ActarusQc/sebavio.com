/**
 * Promotion sécurisée d'un utilisateur existant en SUPER_ADMIN.
 *
 * Usage :
 *   npm run admin:promote -- --email="adresse@example.com"
 *
 * - Vérifie que l'utilisateur existe
 * - Demande une confirmation explicite (sauf --yes en CI contrôlée)
 * - Écrit un journal d'audit système
 * - Ne crée jamais de compte ni de mot de passe
 */

import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

function parseArgs(argv: string[]): {
  email: string | null;
  yes: boolean;
} {
  let email: string | null = null;
  let yes = false;
  for (const arg of argv) {
    if (arg === "--yes" || arg === "-y") {
      yes = true;
      continue;
    }
    const match = /^--email=(.+)$/.exec(arg);
    if (match) {
      email = match[1].trim().toLowerCase();
    }
  }
  return { email, yes };
}

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL est requis.");
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`${message} [écrire PROMOUVOIR] : `);
    return answer.trim() === "PROMOUVOIR";
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const { email, yes } = parseArgs(process.argv.slice(2));
  if (!email) {
    console.error(
      'Usage : npm run admin:promote -- --email="adresse@example.com"',
    );
    process.exit(1);
  }

  const prisma = createPrisma();
  try {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      console.error(`Utilisateur introuvable : ${email}`);
      process.exit(1);
    }

    if (user.role === "super_admin") {
      console.log(`${email} est déjà super_admin. Rien à faire.`);
      return;
    }

    console.log(
      `Promotion prévue : ${user.email} (${user.role} → super_admin), statut=${user.status}`,
    );

    if (!yes) {
      const ok = await confirm(
        "Confirmer la promotion en SUPER_ADMIN (irréversible sans autre super_admin)",
      );
      if (!ok) {
        console.log("Annulé.");
        return;
      }
    }

    const requestId = randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "super_admin" },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          actorRole: "system",
          entity: "users",
          entityId: user.id,
          action: "SYSTEM_PROMOTE_SUPER_ADMIN",
          reason: "CLI admin:promote",
          oldValue: { role: user.role, email: user.email },
          newValue: { role: "super_admin", email: user.email },
          requestId,
        },
      });
    });

    console.log(
      `OK — ${email} est maintenant super_admin (audit ${requestId}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
