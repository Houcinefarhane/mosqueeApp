/**
 * Jeu de données « École Démo » pour review Apple (isolé de l’AMP).
 *
 * Usage :
 *   npm run db:seed-apple-demo
 *   npm run db:seed-apple-demo -- --force
 *
 * Les mots de passe sont générés à l’exécution et affichés uniquement en console
 * (jamais stockés dans le dépôt).
 */

import { randomBytes } from "crypto";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";

config();

const prisma = new PrismaClient();

const DEMO_MOSQUEE_NOM = "École Démo";
const AMP_GUARD = /AMP|Mosquée de Plaisir/i;

const DEMO_EMAILS = {
  admin: "admin@review.ecole-demo.fr",
  prof: "prof@review.ecole-demo.fr",
  eleve: "eleve@review.ecole-demo.fr",
} as const;

function generatePassword(): string {
  const base = randomBytes(18).toString("base64url");
  return `Md${base}!7`;
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

function assertSafeMosquee(nom: string) {
  if (nom !== DEMO_MOSQUEE_NOM) {
    throw new Error(`Refus : mosquée « ${nom} » ≠ « ${DEMO_MOSQUEE_NOM} »`);
  }
  if (AMP_GUARD.test(nom)) {
    throw new Error("Refus : tentative de toucher aux données AMP.");
  }
}

async function deleteAppleDemoOnly() {
  const mosquee = await prisma.mosquee.findFirst({
    where: { nom: DEMO_MOSQUEE_NOM },
  });

  if (!mosquee) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { in: Object.values(DEMO_EMAILS) } },
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
    where: { nom: DEMO_MOSQUEE_NOM },
  });

  if (existing && !force) {
    console.log(
      "ℹ️  « École Démo » existe déjà. Utilisez --force pour recréer (nouveaux mots de passe).\n"
    );
    return;
  }

  if (force && existing) {
    console.log("🗑️  Suppression de l’ancienne École Démo uniquement…");
    await deleteAppleDemoOnly();
  }

  const passwords = {
    admin: generatePassword(),
    prof: generatePassword(),
    eleve: generatePassword(),
  };

  const today = new Date();
  today.setHours(10, 0, 0, 0);

  const result = await prisma.$transaction(async (tx) => {
    const mosquee = await tx.mosquee.create({
      data: {
        nom: DEMO_MOSQUEE_NOM,
        adresse: "1 Rue Démo, 75000 Paris",
        telephone: "01 00 00 00 00",
        email: "contact@review.ecole-demo.fr",
      },
    });

    const admin = await tx.user.create({
      data: {
        email: DEMO_EMAILS.admin,
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
        email: DEMO_EMAILS.prof,
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
        email: DEMO_EMAILS.eleve,
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
        email: DEMO_EMAILS.eleve,
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

    const session = await tx.noteSession.create({
      data: {
        date: subDays(today, 4),
        classeId: classe.id,
        professeurId: prof.id,
        mosqueeId: mosquee.id,
        matiere: "Coran",
        noteMax: 20,
        commentaireSeance: "Session de démonstration Apple.",
      },
    });

    await tx.note.createMany({
      data: [
        {
          valeur: 17,
          noteMax: 20,
          matiere: "Coran",
          commentaire: "Très bonne récitation",
          eleveId: eleve.id,
          professeurId: prof.id,
          mosqueeId: mosquee.id,
          sessionId: session.id,
        },
        {
          valeur: 15,
          noteMax: 20,
          matiere: "Tajwid",
          eleveId: eleve.id,
          professeurId: prof.id,
          mosqueeId: mosquee.id,
        },
      ],
    });

    await tx.devoir.createMany({
      data: [
        {
          titre: "Révision sourate Al-Fatiha",
          contenu: "Relire et mémoriser les 7 versets. Préparer la récitation pour le prochain cours.",
          matiere: "Coran",
          type: "CAHIER_TEXTE",
          dateLimite: addDays(today, 5),
          classeId: classe.id,
          professeurId: prof.id,
          mosqueeId: mosquee.id,
        },
        {
          titre: "Devoir — lettres arabes",
          contenu: "Exercice d’écriture : أ، ب، ت (3 lignes de chaque).",
          matiere: "Arabe",
          type: "DEVOIR",
          dateLimite: addDays(today, 10),
          classeId: classe.id,
          professeurId: prof.id,
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
  console.log("=== IDENTIFIANTS REVIEW APPLE (confidentiel) ===");
  console.log(`École        : ${DEMO_MOSQUEE_NOM}`);
  console.log(`ID mosquée   : ${result.mosquee.id}`);
  console.log(`ID élève     : ${result.eleve.id}`);
  console.log(`URL          : https://madrasa-app-pi.vercel.app/auth/login`);
  console.log("");
  console.log(`ADMIN        ${DEMO_EMAILS.admin}`);
  console.log(`  mot de passe : ${passwords.admin}`);
  console.log(`PROFESSEUR   ${DEMO_EMAILS.prof}`);
  console.log(`  mot de passe : ${passwords.prof}`);
  console.log(`ÉLÈVE        ${DEMO_EMAILS.eleve}`);
  console.log(`  mot de passe : ${passwords.eleve}`);
  console.log("================================================\n");
}

seed()
  .catch((error) => {
    console.error("❌ Erreur seed Apple :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
