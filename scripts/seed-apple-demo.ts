/**
 * Jeu de données « École Démo » pour review Apple (isolé de l’AMP).
 *
 * Mots de passe stables : lib/seed/apple-demo-accounts.ts (+ copie data/apple-review-credentials.txt)
 *
 * Usage :
 *   npm run db:seed-apple-demo
 *   npm run db:seed-apple-demo -- --force
 */

import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  APPLE_DEMO_ACCOUNTS,
  APPLE_DEMO_MOSQUEE_NOM,
  formatAppleDemoCredentialsBlock,
} from "../lib/seed/apple-demo-accounts";

config();

const prisma = new PrismaClient();

const AMP_GUARD = /AMP|Mosquée de Plaisir/i;

const DEMO_EMAILS = [
  APPLE_DEMO_ACCOUNTS.admin.email,
  APPLE_DEMO_ACCOUNTS.prof.email,
  APPLE_DEMO_ACCOUNTS.eleve.email,
] as const;

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

function assertSafeMosquee(nom: string) {
  if (nom !== APPLE_DEMO_MOSQUEE_NOM) {
    throw new Error(`Refus : mosquée « ${nom} » ≠ « ${APPLE_DEMO_MOSQUEE_NOM} »`);
  }
  if (AMP_GUARD.test(nom)) {
    throw new Error("Refus : tentative de toucher aux données AMP.");
  }
}

function writeCredentialsFile() {
  const dir = resolve(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const path = resolve(dir, "apple-review-credentials.txt");
  writeFileSync(path, `${formatAppleDemoCredentialsBlock()}\n`, "utf8");
  return path;
}

async function cleanDemoNotesAndDevoirs(mosqueeId: string) {
  await prisma.note.deleteMany({ where: { mosqueeId } });
  await prisma.noteSession.deleteMany({ where: { mosqueeId } });
  await prisma.devoir.deleteMany({ where: { mosqueeId } });
}

async function syncDemoPasswords(mosqueeId: string) {
  const entries = [
    { email: APPLE_DEMO_ACCOUNTS.admin.email, password: APPLE_DEMO_ACCOUNTS.admin.password },
    { email: APPLE_DEMO_ACCOUNTS.prof.email, password: APPLE_DEMO_ACCOUNTS.prof.password },
    { email: APPLE_DEMO_ACCOUNTS.eleve.email, password: APPLE_DEMO_ACCOUNTS.eleve.password },
  ];

  for (const { email, password } of entries) {
    const user = await prisma.user.findFirst({
      where: { email, mosqueeId },
    });
    if (!user) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password) },
    });
  }
}

function printCredentials(extra?: { mosqueeId?: string; eleveId?: string }) {
  const filePath = writeCredentialsFile();
  console.log(formatAppleDemoCredentialsBlock());
  if (extra?.mosqueeId) console.log(`\nID mosquée : ${extra.mosqueeId}`);
  if (extra?.eleveId) console.log(`ID élève   : ${extra.eleveId}`);
  console.log(`\n📄 Copie locale : ${filePath}`);
  console.log(`📄 Référence repo : docs/apple-review-credentials.md\n`);
}

async function deleteAppleDemoOnly() {
  const mosquee = await prisma.mosquee.findFirst({
    where: { nom: APPLE_DEMO_MOSQUEE_NOM },
  });

  if (!mosquee) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { in: [...DEMO_EMAILS] } },
      include: { mosquee: true },
    });
    if (byEmail?.mosquee) {
      assertSafeMosquee(byEmail.mosquee.nom);
      await prisma.mosquee.delete({ where: { id: byEmail.mosquee.id } });
    }
    return;
  }

  assertSafeMosquee(mosquee.nom);
  await prisma.mosquee.delete({ where: { id: mosquee.id } });
}

async function seed() {
  const force = process.argv.includes("--force");

  console.log("🍎 Seed Apple — École Démo (sans AMP)\n");

  const existing = await prisma.mosquee.findFirst({
    where: { nom: APPLE_DEMO_MOSQUEE_NOM },
  });

  if (existing && !force) {
    console.log(
      "ℹ️  « École Démo » existe déjà — mots de passe + retrait notes/devoirs démo…"
    );
    await syncDemoPasswords(existing.id);
    await cleanDemoNotesAndDevoirs(existing.id);
    const eleve = await prisma.eleve.findFirst({
      where: { mosqueeId: existing.id, email: APPLE_DEMO_ACCOUNTS.eleve.email },
    });
    printCredentials({ mosqueeId: existing.id, eleveId: eleve?.id });
    return;
  }

  if (force && existing) {
    console.log("🗑️  Suppression de l’ancienne École Démo uniquement…");
    await deleteAppleDemoOnly();
  }

  const passwords = {
    admin: APPLE_DEMO_ACCOUNTS.admin.password,
    prof: APPLE_DEMO_ACCOUNTS.prof.password,
    eleve: APPLE_DEMO_ACCOUNTS.eleve.password,
  };

  const result = await prisma.$transaction(async (tx) => {
    const mosquee = await tx.mosquee.create({
      data: {
        nom: APPLE_DEMO_MOSQUEE_NOM,
        adresse: "1 Rue Démo, 75000 Paris",
        telephone: "01 00 00 00 00",
        email: "contact@review.ecole-demo.fr",
      },
    });

    const admin = await tx.user.create({
      data: {
        email: APPLE_DEMO_ACCOUNTS.admin.email,
        nom: "Demo",
        prenom: "Admin",
        role: "ADMIN",
        password: await hashPassword(passwords.admin),
        mosqueeId: mosquee.id,
        privacyPolicyAcceptedAt: new Date(),
        privacyPolicyVersion: "apple-review",
      },
    });

    const prof = await tx.user.create({
      data: {
        email: APPLE_DEMO_ACCOUNTS.prof.email,
        nom: "Demo",
        prenom: "Professeur",
        role: "PROFESSEUR",
        password: await hashPassword(passwords.prof),
        mosqueeId: mosquee.id,
        privacyPolicyAcceptedAt: new Date(),
        privacyPolicyVersion: "apple-review",
      },
    });

    const eleveUser = await tx.user.create({
      data: {
        email: APPLE_DEMO_ACCOUNTS.eleve.email,
        nom: "Demo",
        prenom: "Élève",
        role: "ELEVE",
        password: await hashPassword(passwords.eleve),
        mosqueeId: mosquee.id,
        privacyPolicyAcceptedAt: new Date(),
        privacyPolicyVersion: "apple-review",
      },
    });

    const classe = await tx.classe.create({
      data: {
        nom: "Classe Démo — Niveau 1",
        niveau: "Débutant",
        salle: "Salle A",
        professeurId: prof.id,
        mosqueeId: mosquee.id,
      },
    });

    const eleve = await tx.eleve.create({
      data: {
        nom: "Demo",
        prenom: "Élève",
        email: APPLE_DEMO_ACCOUNTS.eleve.email,
        classeId: classe.id,
        userId: eleveUser.id,
        mosqueeId: mosquee.id,
      },
    });

    await tx.planning.createMany({
      data: [
        {
          jour: "LUNDI",
          heureDebut: "17:00",
          heureFin: "18:00",
          matiere: "Coran",
          classeId: classe.id,
          mosqueeId: mosquee.id,
        },
        {
          jour: "MERCREDI",
          heureDebut: "17:00",
          heureFin: "18:00",
          matiere: "Tajwid",
          classeId: classe.id,
          mosqueeId: mosquee.id,
        },
        {
          jour: "SAMEDI",
          heureDebut: "10:00",
          heureFin: "11:30",
          matiere: "Arabe",
          classeId: classe.id,
          mosqueeId: mosquee.id,
        },
      ],
    });

    await tx.annonce.create({
      data: {
        titre: "École Démo — Review Apple",
        contenu:
          "Environnement de démonstration MadrasApp. Données fictives, sans lien avec une mosquée réelle.",
        auteurId: admin.id,
        mosqueeId: mosquee.id,
      },
    });

    return { mosquee, eleve };
  });

  console.log("✅ École Démo créée.\n");
  printCredentials({ mosqueeId: result.mosquee.id, eleveId: result.eleve.id });
}

seed()
  .catch((error) => {
    console.error("❌ Erreur seed Apple :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
