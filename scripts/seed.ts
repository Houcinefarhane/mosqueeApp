/**
 * Données de démo MadrasaApp
 * Mot de passe commun : demo123
 *
 * Usage :
 *   npm run db:seed          → crée les comptes si absents
 *   npm run db:seed -- --force → supprime et recrée les données démo
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";

config();

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo123";
const DEMO_MOSQUEE_NOM = "Mosquée As-Salam (Démo)";

const DEMO_ACCOUNTS = {
  admin: { email: "admin@demo.fr", nom: "Benali", prenom: "Ahmed", role: "ADMIN" as const },
  prof: { email: "prof@demo.fr", nom: "Khaldi", prenom: "Fatima", role: "PROFESSEUR" as const },
  parent: { email: "parent@demo.fr", nom: "Mansouri", prenom: "Karim", role: "PARENT" as const },
  eleve: { email: "eleve@demo.fr", nom: "Mansouri", prenom: "Youssef", role: "ELEVE" as const },
};

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function deleteDemoData() {
  const demoUsers = await prisma.user.findMany({
    where: {
      email: { in: Object.values(DEMO_ACCOUNTS).map((a) => a.email) },
    },
    select: { mosqueeId: true },
  });

  const mosqueeIds = [...new Set(demoUsers.map((u) => u.mosqueeId))];

  for (const mosqueeId of mosqueeIds) {
    await prisma.mosquee.delete({ where: { id: mosqueeId } });
  }

  const orphanMosquee = await prisma.mosquee.findFirst({
    where: { nom: DEMO_MOSQUEE_NOM },
  });
  if (orphanMosquee) {
    await prisma.mosquee.delete({ where: { id: orphanMosquee.id } });
  }
}

function printCredentials(mosqueeId: string, eleveId?: string) {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║           COMPTES DE DÉMO — MadrasaApp               ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  Mot de passe pour tous : demo123                    ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  ADMIN       admin@demo.fr                           ║");
  console.log("║  PROFESSEUR  prof@demo.fr                            ║");
  console.log("║  PARENT      parent@demo.fr                          ║");
  console.log("║  ÉLÈVE       eleve@demo.fr                           ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Code mosquée : ${mosqueeId.padEnd(37)}║`);
  if (eleveId) {
    console.log(`║  Code élève   : ${eleveId.padEnd(37)}║`);
  }
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  Connexion : http://localhost:3002/auth/login        ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
}

async function seed() {
  const force = process.argv.includes("--force");

  console.log("🌱 Seed MadrasaApp — données de démo\n");

  const existingAdmin = await prisma.user.findUnique({
    where: { email: DEMO_ACCOUNTS.admin.email },
    include: { mosquee: true },
  });

  if (existingAdmin && !force) {
    const eleve = await prisma.eleve.findFirst({
      where: { mosqueeId: existingAdmin.mosqueeId, email: DEMO_ACCOUNTS.eleve.email },
    });
    console.log("ℹ️  Les comptes démo existent déjà. Utilisez --force pour recréer.\n");
    printCredentials(existingAdmin.mosqueeId, eleve?.id);
    return;
  }

  if (force) {
    console.log("🗑️  Suppression des anciennes données démo...");
    await deleteDemoData();
  }

  const password = await hashPassword(DEMO_PASSWORD);
  const today = new Date();
  today.setHours(10, 0, 0, 0);

  const result = await prisma.$transaction(async (tx) => {
    const mosquee = await tx.mosquee.create({
      data: {
        nom: DEMO_MOSQUEE_NOM,
        adresse: "12 Rue de la Paix, 75011 Paris",
        telephone: "01 23 45 67 89",
        email: "contact@assalam-demo.fr",
      },
    });

    const admin = await tx.user.create({
      data: {
        ...DEMO_ACCOUNTS.admin,
        password,
        mosqueeId: mosquee.id,
      },
    });

    const prof = await tx.user.create({
      data: {
        ...DEMO_ACCOUNTS.prof,
        password,
        mosqueeId: mosquee.id,
      },
    });

    const parent = await tx.user.create({
      data: {
        ...DEMO_ACCOUNTS.parent,
        password,
        mosqueeId: mosquee.id,
      },
    });

    const eleveUser = await tx.user.create({
      data: {
        ...DEMO_ACCOUNTS.eleve,
        password,
        mosqueeId: mosquee.id,
      },
    });

    const classe = await tx.classe.create({
      data: {
        nom: "Niveau 1 — Débutants",
        niveau: "Débutant",
        professeurId: prof.id,
        mosqueeId: mosquee.id,
      },
    });

    const eleveYoussef = await tx.eleve.create({
      data: {
        nom: "Mansouri",
        prenom: "Youssef",
        email: DEMO_ACCOUNTS.eleve.email,
        dateNaissance: new Date("2014-05-15"),
        classeId: classe.id,
        parentId: parent.id,
        userId: eleveUser.id,
        mosqueeId: mosquee.id,
      },
    });

    const eleveAmina = await tx.eleve.create({
      data: {
        nom: "Mansouri",
        prenom: "Amina",
        dateNaissance: new Date("2016-09-20"),
        classeId: classe.id,
        parentId: parent.id,
        mosqueeId: mosquee.id,
      },
    });

    // Planning
    await tx.planning.createMany({
      data: [
        { jour: "LUNDI", heureDebut: "17:00", heureFin: "18:30", matiere: "Coran", classeId: classe.id, mosqueeId: mosquee.id },
        { jour: "MERCREDI", heureDebut: "17:00", heureFin: "18:30", matiere: "Tajwid", classeId: classe.id, mosqueeId: mosquee.id },
        { jour: "SAMEDI", heureDebut: "10:00", heureFin: "11:30", matiere: "Arabe", classeId: classe.id, mosqueeId: mosquee.id },
      ],
    });

    // Appel + présences (aujourd'hui et jours passés)
    const appel = await tx.appel.create({
      data: {
        date: today,
        classeId: classe.id,
        professeurId: prof.id,
        mosqueeId: mosquee.id,
        commentaireSeance: "Bonne séance, les élèves progressent bien.",
      },
    });

    await tx.presence.createMany({
      data: [
        { date: today, statut: "PRESENT", eleveId: eleveYoussef.id, classeId: classe.id, professeurId: prof.id, mosqueeId: mosquee.id, appelId: appel.id },
        { date: today, statut: "PRESENT", eleveId: eleveAmina.id, classeId: classe.id, professeurId: prof.id, mosqueeId: mosquee.id, appelId: appel.id },
        { date: subDays(today, 3), statut: "ABSENT", eleveId: eleveYoussef.id, classeId: classe.id, professeurId: prof.id, mosqueeId: mosquee.id },
        { date: subDays(today, 7), statut: "PRESENT", eleveId: eleveYoussef.id, classeId: classe.id, professeurId: prof.id, mosqueeId: mosquee.id },
        { date: subDays(today, 7), statut: "RETARD", eleveId: eleveAmina.id, classeId: classe.id, professeurId: prof.id, mosqueeId: mosquee.id },
      ],
    });

    // Notes
    const session = await tx.noteSession.create({
      data: {
        date: subDays(today, 5),
        classeId: classe.id,
        professeurId: prof.id,
        mosqueeId: mosquee.id,
        matiere: "Coran",
        noteMax: 20,
      },
    });

    await tx.note.createMany({
      data: [
        { valeur: 16, noteMax: 20, matiere: "Coran", eleveId: eleveYoussef.id, professeurId: prof.id, mosqueeId: mosquee.id, sessionId: session.id, commentaire: "Bonne mémorisation" },
        { valeur: 14, noteMax: 20, matiere: "Coran", eleveId: eleveAmina.id, professeurId: prof.id, mosqueeId: mosquee.id, sessionId: session.id },
        { valeur: 18, noteMax: 20, matiere: "Tajwid", eleveId: eleveYoussef.id, professeurId: prof.id, mosqueeId: mosquee.id },
      ],
    });

    // Devoirs / cahier de texte
    await tx.devoir.createMany({
      data: [
        {
          titre: "Mémoriser sourate Al-Mulk",
          contenu: "Apprendre les versets 1 à 10 avec la traduction. Réviser la tajwid des règles de nunation.",
          matiere: "Coran",
          type: "CAHIER_TEXTE",
          dateLimite: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
          classeId: classe.id,
          professeurId: prof.id,
          mosqueeId: mosquee.id,
        },
        {
          titre: "Exercices d'arabe — écriture",
          contenu: "Copier 3 fois les lettres ج، ح، خ avec leurs différentes formes (début, milieu, fin de mot).",
          matiere: "Arabe",
          type: "DEVOIR",
          dateLimite: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
          classeId: classe.id,
          professeurId: prof.id,
          mosqueeId: mosquee.id,
        },
      ],
    });

    // Annonce
    await tx.annonce.create({
      data: {
        titre: "Bienvenue sur MadrasaApp !",
        contenu: "Ceci est une annonce de démonstration. Les cours reprennent samedi à 10h.",
        auteurId: admin.id,
        mosqueeId: mosquee.id,
      },
    });

    return { mosquee, eleveYoussef, admin };
  });

  console.log("✅ Données de démo créées avec succès !");
  printCredentials(result.mosquee.id, result.eleveYoussef.id);
}

seed()
  .catch((error) => {
    console.error("❌ Erreur seed :", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
