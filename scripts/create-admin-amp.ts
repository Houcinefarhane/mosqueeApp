/**
 * Crée un compte administrateur pour la mosquée AMP existante.
 *
 * Usage :
 *   ADMIN_EMAIL="..." ADMIN_PASSWORD="..." ADMIN_PRENOM="..." ADMIN_NOM="..." npm run create:admin-amp
 *
 * Les identifiants ne doivent jamais être commités — uniquement en variables d'environnement.
 */

import { config } from "dotenv";
import * as readline from "readline";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

config();

const prisma = new PrismaClient();

const AMP_MOSQUEE_ID = "cmus645210000dc4j5do5tghx";
const BCRYPT_ROUNDS = 10;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variable d'environnement requise : ${name}`);
  }
  return value;
}

function parseDatabaseHost(databaseUrl: string): {
  host: string;
  database: string;
  isNeon: boolean;
} {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      database: url.pathname.replace(/^\//, "") || "(inconnu)",
      isNeon: url.hostname.includes("neon.tech"),
    };
  } catch {
    return { host: "(URL invalide)", database: "(inconnu)", isNeon: false };
  }
}

async function askConfirmation(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() === "CONFIRMER");
    });
  });
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║     CRÉATION COMPTE ADMIN — MOSQUÉE AMP              ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL manquante dans l'environnement.");
  }

  const dbInfo = parseDatabaseHost(databaseUrl);
  console.log("── Connexion base de données ──");
  console.log(`  Host     : ${dbInfo.host}`);
  console.log(`  Database : ${dbInfo.database}`);
  console.log(`  Neon     : ${dbInfo.isNeon ? "oui" : "NON"}\n`);

  if (!dbInfo.isNeon) {
    throw new Error(
      "DATABASE_URL ne pointe pas vers Neon (host sans « neon.tech »). Abandon par sécurité."
    );
  }

  const email = requireEnv("ADMIN_EMAIL");
  const password = requireEnv("ADMIN_PASSWORD");
  const prenom = requireEnv("ADMIN_PRENOM");
  const nom = requireEnv("ADMIN_NOM");

  if (password.length < 6) {
    throw new Error("ADMIN_PASSWORD doit contenir au moins 6 caractères.");
  }

  const mosquee = await prisma.mosquee.findUnique({
    where: { id: AMP_MOSQUEE_ID },
    select: { id: true, nom: true },
  });

  if (!mosquee) {
    throw new Error(
      `Mosquée AMP introuvable (ID ${AMP_MOSQUEE_ID}). Vérifiez DATABASE_URL et l'ID.`
    );
  }

  console.log("── Mosquée cible ──");
  console.log(`  ${mosquee.nom}`);
  console.log(`  ID : ${mosquee.id}\n`);

  const existingAdmins = await prisma.user.findMany({
    where: { mosqueeId: AMP_MOSQUEE_ID, role: Role.ADMIN },
    select: { id: true, email: true, prenom: true, nom: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingAdmins.length > 0) {
    console.log("── Admins AMP déjà existants ──");
    for (const admin of existingAdmins) {
      console.log(
        `  • ${admin.prenom} ${admin.nom} <${admin.email}> (créé le ${admin.createdAt.toISOString().slice(0, 10)})`
      );
    }
    console.log("");
    throw new Error(
      `${existingAdmins.length} admin(s) existent déjà pour cette mosquée. Abandon pour éviter les doublons.`
    );
  }

  const emailTaken = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, mosqueeId: true },
  });

  if (emailTaken) {
    throw new Error(`L'email ${email} est déjà utilisé (rôle ${emailTaken.role}).`);
  }

  console.log("── Compte à créer ──");
  console.log(`  Email   : ${email}`);
  console.log(`  Prénom  : ${prenom}`);
  console.log(`  Nom     : ${nom}`);
  console.log(`  Rôle    : ADMIN`);
  console.log(`  Mosquée : ${mosquee.nom}\n`);

  const confirmed = await askConfirmation(
    '⚠️  Vérifiez le host Neon ci-dessus. Tapez "CONFIRMER" pour créer le compte : '
  );

  if (!confirmed) {
    console.log("\n❌ Confirmation absente — opération annulée.\n");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      prenom,
      nom,
      role: Role.ADMIN,
      mosqueeId: AMP_MOSQUEE_ID,
    },
    select: {
      id: true,
      email: true,
      prenom: true,
      nom: true,
      role: true,
      mosquee: { select: { id: true, nom: true } },
      createdAt: true,
    },
  });

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║           COMPTE ADMIN CRÉÉ                          ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Email    : ${admin.email.padEnd(42)}║`);
  console.log(`║  Nom      : ${(`${admin.prenom} ${admin.nom}`).slice(0, 42).padEnd(42)}║`);
  console.log(`║  Rôle     : ${admin.role.padEnd(42)}║`);
  console.log(`║  Mosquée  : ${admin.mosquee.nom.slice(0, 42).padEnd(42)}║`);
  console.log(`║  ID user  : ${admin.id.padEnd(42)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  Connexion : /auth/login                             ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
}

main()
  .catch((error) => {
    console.error("❌ Erreur :", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
