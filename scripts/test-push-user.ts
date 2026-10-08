/**
 * Envoi push test vers un utilisateur (debug).
 * Usage: npx tsx scripts/test-push-user.ts fatiha.elbasssal.eleve@test.local
 * Requiert DATABASE_URL + FIREBASE_* dans .env (comme Vercel).
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { notifyUsers } from "../lib/push/send";

config();

async function main() {
  const email = process.argv[2]?.trim();
  if (!email) {
    console.error("Usage: npx tsx scripts/test-push-user.ts <email>");
    process.exit(1);
  }

  const fb = [
    process.env.FIREBASE_PROJECT_ID,
    process.env.FIREBASE_CLIENT_EMAIL,
    process.env.FIREBASE_PRIVATE_KEY,
  ].every((v) => v?.trim());
  console.log("Firebase configuré:", fb ? "oui" : "NON");
  if (!fb) {
    console.error(
      "Ajoutez FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY dans .env (copie Vercel)."
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user) {
    console.error("Utilisateur introuvable:", email);
    process.exit(1);
  }

  const tokens = await prisma.deviceToken.count({ where: { userId: user.id } });
  console.log("Tokens en base:", tokens);

  await notifyUsers([user.id], "absences", {
    title: "Test MadrasApp",
    body: "Si vous voyez ceci, le push fonctionne.",
    route: "/eleve/presences",
  });

  console.log("notifyUsers terminé (voir erreurs ci-dessus éventuelles).");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
