/**
 * Seed de charge MadrasaApp — données massives pour tests de performance
 *
 * Usage :
 *   npm run db:seed-charge
 *
 * Mosquée isolée : nom commence par "TEST-CHARGE" (supprimée puis recréée à chaque run)
 * Mot de passe de tous les comptes : Test1234!
 * Admin : admin@test-charge.local
 */

import { config } from "dotenv";
import { randomUUID } from "crypto";
import {
  PrismaClient,
  Role,
  StatutPresence,
  TypeDevoir,
} from "@prisma/client";
import { fakerFR as faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";

config();

const prisma = new PrismaClient();

const TEST_MARKER = "TEST-CHARGE";
const TEST_MOSQUEE_NOM = `${TEST_MARKER} — Mosquée de charge`;
const TEST_PASSWORD = "Test1234!";
const BATCH_SIZE = 500;

const NUM_PROFS = 20;
const NUM_CLASSES = 15;
const NUM_ELEVES = 400;
const NUM_PARENTS = 400;
const COURSE_DAYS = 60;
const MATIERES = ["Coran", "Arabe", "Tajwid", "Fiqh"];
const NOTE_SESSIONS_PER_MATIERE = 5;
const DEVOIRS_TOTAL = 180;
const MESSAGES_TOTAL = 2000;
const ANNONCES_TOTAL = 30;

faker.seed(42);

function id() {
  return randomUUID();
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(10, 0, 0, 0);
  return copy;
}

function pickPresenceStatut(): StatutPresence {
  const r = Math.random();
  if (r < 0.85) return "PRESENT";
  if (r < 0.93) return "ABSENT";
  if (r < 0.98) return "RETARD";
  return "EXCUSE";
}

function generateCourseDates(count: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(10, 0, 0, 0);
  const courseWeekdays = [1, 3, 6]; // lun, mer, sam

  while (dates.length < count) {
    cursor.setDate(cursor.getDate() - 1);
    if (courseWeekdays.includes(cursor.getDay())) {
      dates.push(startOfDay(cursor));
    }
  }

  return dates.reverse();
}

async function batchCreateMany<T extends Record<string, unknown>>(
  label: string,
  createMany: (args: { data: T[] }) => Promise<{ count: number }>,
  rows: T[]
): Promise<number> {
  const started = performance.now();
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const result = await createMany({ data: chunk });
    inserted += result.count;
  }

  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  console.log(`  ✓ ${inserted.toLocaleString("fr-FR")} ${label} (${seconds}s)`);
  return inserted;
}

async function deletePreviousChargeData() {
  const started = performance.now();
  const existing = await prisma.mosquee.findFirst({
    where: { nom: { startsWith: TEST_MARKER } },
    select: { id: true, nom: true },
  });

  if (existing) {
    await prisma.mosquee.delete({ where: { id: existing.id } });
    console.log(`  ✓ Ancienne mosquée supprimée : ${existing.nom}`);
  } else {
    console.log("  · Aucune donnée TEST-CHARGE existante");
  }

  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  console.log(`  ✓ Nettoyage terminé (${seconds}s)\n`);
}

async function main() {
  const totalStart = performance.now();
  console.log("\n🚀 Seed de charge MadrasaApp\n");
  console.log(`   Marqueur : ${TEST_MARKER}`);
  console.log(`   Mot de passe : ${TEST_PASSWORD}\n`);

  console.log("🗑️  Suppression des données TEST-CHARGE précédentes…");
  await deletePreviousChargeData();

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  console.log("🔐 Hash mot de passe calculé (1 seul bcrypt)\n");

  // --- Mosquée + admin ---
  let stepStart = performance.now();
  const mosqueeId = id();
  const adminId = id();

  await prisma.mosquee.create({
    data: {
      id: mosqueeId,
      nom: TEST_MOSQUEE_NOM,
      adresse: faker.location.streetAddress({ useFullAddress: true }),
      telephone: faker.phone.number(),
      email: "contact@test-charge.local",
    },
  });

  await prisma.user.create({
    data: {
      id: adminId,
      email: "admin@test-charge.local",
      password: passwordHash,
      nom: "Administrateur",
      prenom: "Charge",
      telephone: faker.phone.number(),
      role: Role.ADMIN,
      mosqueeId,
    },
  });

  console.log(
    `✓ Mosquée + admin créés (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`
  );

  // --- Professeurs ---
  stepStart = performance.now();
  const profIds = Array.from({ length: NUM_PROFS }, () => id());
  const profRows = profIds.map((profId, i) => ({
    id: profId,
    email: `prof-${String(i + 1).padStart(3, "0")}@test-charge.local`,
    password: passwordHash,
    nom: faker.person.lastName(),
    prenom: faker.person.firstName(),
    telephone: faker.phone.number(),
    role: Role.PROFESSEUR,
    mosqueeId,
  }));

  await batchCreateMany("professeurs", (args) => prisma.user.createMany(args), profRows);
  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  // --- Parents ---
  stepStart = performance.now();
  const parentIds = Array.from({ length: NUM_PARENTS }, () => id());
  const parentRows = parentIds.map((parentId, i) => ({
    id: parentId,
    email: `parent-${String(i + 1).padStart(3, "0")}@test-charge.local`,
    password: passwordHash,
    nom: faker.person.lastName(),
    prenom: faker.person.firstName(),
    telephone: faker.phone.number(),
    role: Role.PARENT,
    mosqueeId,
  }));

  await batchCreateMany("parents", (args) => prisma.user.createMany(args), parentRows);
  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  // --- Classes (1 prof par classe, rotation sur 20 profs) ---
  stepStart = performance.now();
  const niveaux = ["Débutant", "Intermédiaire", "Avancé", "Hifz", "Tajwid"];
  const classIds = Array.from({ length: NUM_CLASSES }, () => id());
  const classRows = classIds.map((classeId, i) => ({
    id: classeId,
    nom: `Classe ${String.fromCharCode(65 + i)} — ${niveaux[i % niveaux.length]}`,
    niveau: niveaux[i % niveaux.length],
    professeurId: profIds[i % NUM_PROFS],
    mosqueeId,
  }));

  await batchCreateMany("classes", (args) => prisma.classe.createMany(args), classRows);
  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  // --- Élèves (~27 par classe) + parents (1 min/enfant, certains 2-3 enfants) ---
  stepStart = performance.now();
  const eleveIds = Array.from({ length: NUM_ELEVES }, () => id());
  const eleveRows: Array<{
    id: string;
    nom: string;
    prenom: string;
    dateNaissance: Date;
    telephone: string;
    email: string;
    classeId: string;
    parentId: string;
    mosqueeId: string;
  }> = [];

  // ~280 élèves avec parent dédié, ~120 partagent un parent (2-3 enfants / famille)
  const SHARED_PARENT_COUNT = 120;
  const parentAssignment: string[] = [];

  for (let i = 0; i < NUM_ELEVES - SHARED_PARENT_COUNT; i++) {
    parentAssignment.push(parentIds[i]);
  }

  for (let i = 0; i < SHARED_PARENT_COUNT; i++) {
    const siblingPoolIndex = i % (NUM_ELEVES - SHARED_PARENT_COUNT);
    parentAssignment.push(parentIds[siblingPoolIndex]);
  }

  faker.helpers.shuffle(parentAssignment, { inplace: true });

  for (let i = 0; i < NUM_ELEVES; i++) {
    const classeId = classIds[i % NUM_CLASSES];
    eleveRows.push({
      id: eleveIds[i],
      nom: faker.person.lastName(),
      prenom: faker.person.firstName(),
      dateNaissance: faker.date.birthdate({ min: 6, max: 16, mode: "age" }),
      telephone: faker.phone.number(),
      email: `eleve-${String(i + 1).padStart(3, "0")}@test-charge.local`,
      classeId,
      parentId: parentAssignment[i],
      mosqueeId,
    });
  }

  await batchCreateMany("élèves", (args) => prisma.eleve.createMany(args), eleveRows);

  const elevesByClasse = new Map<string, string[]>();
  for (const row of eleveRows) {
    const list = elevesByClasse.get(row.classeId) ?? [];
    list.push(row.id);
    elevesByClasse.set(row.classeId, list);
  }

  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  // --- Planning minimal (3 créneaux / classe) ---
  stepStart = performance.now();
  const planningRows: Array<{
    id: string;
    jour: string;
    heureDebut: string;
    heureFin: string;
    matiere: string;
    classeId: string;
    mosqueeId: string;
  }> = [];

  const jours = ["LUNDI", "MERCREDI", "SAMEDI"];
  for (const classeId of classIds) {
    jours.forEach((jour, j) => {
      planningRows.push({
        id: id(),
        jour,
        heureDebut: "17:00",
        heureFin: "18:30",
        matiere: MATIERES[j % MATIERES.length],
        classeId,
        mosqueeId,
      });
    });
  }

  await batchCreateMany("créneaux planning", (args) => prisma.planning.createMany(args), planningRows);
  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  // --- Appels + présences (60 jours × 15 classes × ~27 élèves) ---
  stepStart = performance.now();
  const courseDates = generateCourseDates(COURSE_DAYS);
  const appelRows: Array<{
    id: string;
    date: Date;
    classeId: string;
    professeurId: string;
    mosqueeId: string;
  }> = [];

  const appelIdByKey = new Map<string, string>();

  for (const date of courseDates) {
    for (let c = 0; c < classIds.length; c++) {
      const classeId = classIds[c];
      const appelId = id();
      const key = `${classeId}:${date.toISOString()}`;
      appelIdByKey.set(key, appelId);
      appelRows.push({
        id: appelId,
        date,
        classeId,
        professeurId: profIds[c % NUM_PROFS],
        mosqueeId,
      });
    }
  }

  await batchCreateMany("appels", (args) => prisma.appel.createMany(args), appelRows);

  const presenceRows: Array<{
    id: string;
    date: Date;
    statut: StatutPresence;
    eleveId: string;
    classeId: string;
    professeurId: string;
    mosqueeId: string;
    appelId: string;
  }> = [];

  for (const date of courseDates) {
    for (let c = 0; c < classIds.length; c++) {
      const classeId = classIds[c];
      const professeurId = profIds[c % NUM_PROFS];
      const appelId = appelIdByKey.get(`${classeId}:${date.toISOString()}`)!;
      const eleves = elevesByClasse.get(classeId) ?? [];

      for (const eleveId of eleves) {
        presenceRows.push({
          id: id(),
          date,
          statut: pickPresenceStatut(),
          eleveId,
          classeId,
          professeurId,
          mosqueeId,
          appelId,
        });
      }
    }
  }

  await batchCreateMany("présences", (args) => prisma.presence.createMany(args), presenceRows);
  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  // --- Sessions de notes + notes (~8000) ---
  stepStart = performance.now();
  const sessionRows: Array<{
    id: string;
    date: Date;
    classeId: string;
    professeurId: string;
    mosqueeId: string;
    matiere: string;
    noteMax: number;
  }> = [];

  const noteRows: Array<{
    id: string;
    valeur: number;
    noteMax: number;
    matiere: string;
    eleveId: string;
    professeurId: string;
    mosqueeId: string;
    sessionId: string;
  }> = [];

  for (let c = 0; c < classIds.length; c++) {
    const classeId = classIds[c];
    const professeurId = profIds[c % NUM_PROFS];
    const eleves = elevesByClasse.get(classeId) ?? [];

    for (const matiere of MATIERES) {
      for (let s = 0; s < NOTE_SESSIONS_PER_MATIERE; s++) {
        const sessionId = id();
        const sessionDate = startOfDay(subDays(new Date(), s * 7 + c + MATIERES.indexOf(matiere)));

        sessionRows.push({
          id: sessionId,
          date: sessionDate,
          classeId,
          professeurId,
          mosqueeId,
          matiere,
          noteMax: 20,
        });

        for (const eleveId of eleves) {
          noteRows.push({
            id: id(),
            valeur: Math.round((8 + Math.random() * 12) * 2) / 2,
            noteMax: 20,
            matiere,
            eleveId,
            professeurId,
            mosqueeId,
            sessionId,
          });
        }
      }
    }
  }

  await batchCreateMany("sessions de notes", (args) => prisma.noteSession.createMany(args), sessionRows);
  await batchCreateMany("notes", (args) => prisma.note.createMany(args), noteRows);
  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  // --- Devoirs (~180) ---
  stepStart = performance.now();
  const devoirsPerClasse = Math.floor(DEVOIRS_TOTAL / NUM_CLASSES);
  const devoirRows: Array<{
    id: string;
    titre: string;
    contenu: string;
    matiere: string;
    type: TypeDevoir;
    dateLimite: Date;
    classeId: string;
    professeurId: string;
    mosqueeId: string;
    createdAt: Date;
  }> = [];

  for (let c = 0; c < classIds.length; c++) {
    const classeId = classIds[c];
    const professeurId = profIds[c % NUM_PROFS];

    for (let d = 0; d < devoirsPerClasse; d++) {
      devoirRows.push({
        id: id(),
        titre: faker.lorem.sentence({ min: 3, max: 6 }),
        contenu: faker.lorem.paragraph(),
        matiere: MATIERES[d % MATIERES.length],
        type: d % 3 === 0 ? TypeDevoir.CAHIER_TEXTE : TypeDevoir.DEVOIR,
        dateLimite: subDays(new Date(), -7 - d),
        classeId,
        professeurId,
        mosqueeId,
        createdAt: subDays(new Date(), d * 2),
      });
    }
  }

  await batchCreateMany("devoirs", (args) => prisma.devoir.createMany(args), devoirRows);
  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  // --- Messages (2000) ---
  stepStart = performance.now();
  const allUserIds = [adminId, ...profIds, ...parentIds];
  const messageRows: Array<{
    id: string;
    objet: string;
    contenu: string;
    lu: boolean;
    createdAt: Date;
    mosqueeId: string;
    senderId: string;
    receiverId: string;
  }> = [];

  for (let m = 0; m < MESSAGES_TOTAL; m++) {
    let senderId = faker.helpers.arrayElement(allUserIds);
    let receiverId = faker.helpers.arrayElement(allUserIds);
    while (receiverId === senderId) {
      receiverId = faker.helpers.arrayElement(allUserIds);
    }

    messageRows.push({
      id: id(),
      objet: faker.lorem.sentence({ min: 2, max: 5 }),
      contenu: faker.lorem.paragraphs({ min: 1, max: 2 }),
      lu: Math.random() > 0.4,
      createdAt: subDays(new Date(), Math.floor(Math.random() * 90)),
      mosqueeId,
      senderId,
      receiverId,
    });
  }

  await batchCreateMany("messages", (args) => prisma.message.createMany(args), messageRows);
  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  // --- Annonces (30) ---
  stepStart = performance.now();
  const annonceRows = Array.from({ length: ANNONCES_TOTAL }, (_, i) => ({
    id: id(),
    titre: faker.lorem.sentence({ min: 3, max: 6 }),
    contenu: faker.lorem.paragraphs({ min: 1, max: 3 }),
    auteurId: adminId,
    mosqueeId,
    createdAt: subDays(new Date(), i * 3),
  }));

  await batchCreateMany("annonces", (args) => prisma.annonce.createMany(args), annonceRows);
  console.log(`  (${((performance.now() - stepStart) / 1000).toFixed(1)}s)\n`);

  const totalSeconds = ((performance.now() - totalStart) / 1000).toFixed(1);

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║           SEED DE CHARGE — RÉSUMÉ                    ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Mosquée       : ${TEST_MOSQUEE_NOM.slice(0, 36).padEnd(36)}║`);
  console.log(`║  Code mosquée  : ${mosqueeId.slice(0, 36).padEnd(36)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Professeurs   : ${String(NUM_PROFS).padEnd(36)}║`);
  console.log(`║  Classes       : ${String(NUM_CLASSES).padEnd(36)}║`);
  console.log(`║  Élèves        : ${String(NUM_ELEVES).padEnd(36)}║`);
  console.log(`║  Parents       : ${String(NUM_PARENTS).padEnd(36)}║`);
  console.log(`║  Présences     : ${String(presenceRows.length).padEnd(36)}║`);
  console.log(`║  Notes         : ${String(noteRows.length).padEnd(36)}║`);
  console.log(`║  Devoirs       : ${String(devoirRows.length).padEnd(36)}║`);
  console.log(`║  Messages      : ${String(MESSAGES_TOTAL).padEnd(36)}║`);
  console.log(`║  Annonces      : ${String(ANNONCES_TOTAL).padEnd(36)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Admin         : admin@test-charge.local             ║`);
  console.log(`║  Mot de passe  : ${TEST_PASSWORD.padEnd(36)}║`);
  console.log(`║  Durée totale  : ${`${totalSeconds}s`.padEnd(36)}║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");
}

main()
  .catch((error) => {
    console.error("❌ Erreur seed de charge :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
