/**
 * Suppression des mosquées de test en production (Neon).
 * Conserve uniquement AMP — Mosquée de Plaisir et ses données réelles.
 *
 * Usage :
 *   npm run cleanup:test-data:dry-run   → aperçu sans suppression
 *   npm run cleanup:test-data           → suppression après confirmation "CONFIRMER"
 */

import { config } from "dotenv";
import * as readline from "readline";
import { PrismaClient } from "@prisma/client";

config();

const prisma = new PrismaClient();

const AMP_MOSQUEE_ID = "cmus645210000dc4j5do5tghx";
const DEMO_MOSQUEE_NOM = "Mosquée As-Salam (Démo)";

const dryRun =
  process.argv.includes("--dry-run") ||
  process.env.CLEANUP_DRY_RUN === "1" ||
  process.env.CLEANUP_DRY_RUN === "true";

type MosqueeStats = {
  id: string;
  nom: string;
  users: number;
  classes: number;
  eleves: number;
  plannings: number;
  presences: number;
  notes: number;
  devoirs: number;
  messages: number;
  annonces: number;
};

function isProtectedMosquee(m: { id: string; nom: string }): boolean {
  return m.id === AMP_MOSQUEE_ID || /AMP/i.test(m.nom);
}

function isTestMosquee(m: { id: string; nom: string }): boolean {
  if (isProtectedMosquee(m)) return false;
  if (/TEST-CHARGE/i.test(m.nom)) return true;
  if (m.nom === DEMO_MOSQUEE_NOM) return true;
  return false;
}

async function countMosqueeStats(mosqueeId: string, nom: string): Promise<MosqueeStats> {
  const [
    users,
    classes,
    eleves,
    plannings,
    presences,
    notes,
    devoirs,
    messages,
    annonces,
  ] = await Promise.all([
    prisma.user.count({ where: { mosqueeId } }),
    prisma.classe.count({ where: { mosqueeId } }),
    prisma.eleve.count({ where: { mosqueeId } }),
    prisma.planning.count({ where: { mosqueeId } }),
    prisma.presence.count({ where: { mosqueeId } }),
    prisma.note.count({ where: { mosqueeId } }),
    prisma.devoir.count({ where: { mosqueeId } }),
    prisma.message.count({ where: { mosqueeId } }),
    prisma.annonce.count({ where: { mosqueeId } }),
  ]);

  return {
    id: mosqueeId,
    nom,
    users,
    classes,
    eleves,
    plannings,
    presences,
    notes,
    devoirs,
    messages,
    annonces,
  };
}

async function getAmpCounts() {
  const mosquee = await prisma.mosquee.findUnique({
    where: { id: AMP_MOSQUEE_ID },
    select: { id: true, nom: true },
  });

  if (!mosquee) {
    throw new Error(
      `Mosquée AMP introuvable (ID ${AMP_MOSQUEE_ID}). Abandon pour éviter toute suppression accidentelle.`
    );
  }

  const [eleves, classes, profs] = await Promise.all([
    prisma.eleve.count({ where: { mosqueeId: AMP_MOSQUEE_ID } }),
    prisma.classe.count({ where: { mosqueeId: AMP_MOSQUEE_ID } }),
    prisma.user.count({
      where: { mosqueeId: AMP_MOSQUEE_ID, role: "PROFESSEUR" },
    }),
  ]);

  return { mosquee, eleves, classes, profs };
}

function printMosqueeStats(stats: MosqueeStats) {
  console.log(`  • ${stats.nom}`);
  console.log(`    ID        : ${stats.id}`);
  console.log(`    Users     : ${stats.users}`);
  console.log(`    Classes   : ${stats.classes}`);
  console.log(`    Élèves    : ${stats.eleves}`);
  console.log(`    Plannings : ${stats.plannings}`);
  console.log(`    Présences : ${stats.presences}`);
  console.log(`    Notes     : ${stats.notes}`);
  console.log(`    Devoirs   : ${stats.devoirs}`);
  console.log(`    Messages  : ${stats.messages}`);
  console.log(`    Annonces  : ${stats.annonces}`);
}

function assertAmpNotInDeletionList(toDelete: MosqueeStats[]) {
  const ampInList = toDelete.filter(
    (m) => m.id === AMP_MOSQUEE_ID || /AMP/i.test(m.nom)
  );
  if (ampInList.length > 0) {
    throw new Error(
      `SÉCURITÉ : la mosquée AMP apparaît dans la liste à supprimer — opération annulée.\n` +
        ampInList.map((m) => `  - ${m.nom} (${m.id})`).join("\n")
    );
  }
}

async function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  Tapez exactement "CONFIRMER" pour supprimer définitivement : ',
      (answer) => {
        rl.close();
        resolve(answer.trim() === "CONFIRMER");
      }
    );
  });
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log(
    dryRun
      ? "║     NETTOYAGE DONNÉES TEST — MODE DRY-RUN            ║"
      : "║     NETTOYAGE DONNÉES TEST — PRODUCTION              ║"
  );
  console.log("╚══════════════════════════════════════════════════════╝\n");

  if (dryRun) {
    console.log("ℹ️  Mode dry-run : aucune donnée ne sera supprimée.\n");
  }

  const ampBefore = await getAmpCounts();
  console.log("── Mosquée AMP (référence, à conserver) ──");
  console.log(`  ${ampBefore.mosquee.nom} (${ampBefore.mosquee.id})`);
  console.log(`  Élèves : ${ampBefore.eleves} | Classes : ${ampBefore.classes} | Profs : ${ampBefore.profs}\n`);

  const allMosquees = await prisma.mosquee.findMany({
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  console.log(`── Mosquées en base (${allMosquees.length}) ──`);
  for (const m of allMosquees) {
    const tag = isProtectedMosquee(m)
      ? " [PROTÉGÉE]"
      : isTestMosquee(m)
        ? " [À SUPPRIMER]"
        : " [AUTRE — non ciblée]";
    console.log(`  - ${m.nom} (${m.id})${tag}`);
  }
  console.log("");

  const targets = allMosquees.filter(isTestMosquee);
  if (targets.length === 0) {
    console.log("✅ Aucune mosquée de test à supprimer.\n");
    return;
  }

  const toDelete: MosqueeStats[] = [];
  for (const m of targets) {
    toDelete.push(await countMosqueeStats(m.id, m.nom));
  }

  assertAmpNotInDeletionList(toDelete);

  console.log("── Mosquées qui SERONT supprimées ──\n");
  for (const stats of toDelete) {
    printMosqueeStats(stats);
    console.log("");
  }

  const totals = toDelete.reduce(
    (acc, s) => ({
      users: acc.users + s.users,
      classes: acc.classes + s.classes,
      eleves: acc.eleves + s.eleves,
      plannings: acc.plannings + s.plannings,
      presences: acc.presences + s.presences,
      notes: acc.notes + s.notes,
      devoirs: acc.devoirs + s.devoirs,
      messages: acc.messages + s.messages,
      annonces: acc.annonces + s.annonces,
    }),
    {
      users: 0,
      classes: 0,
      eleves: 0,
      plannings: 0,
      presences: 0,
      notes: 0,
      devoirs: 0,
      messages: 0,
      annonces: 0,
    }
  );

  console.log("── Totaux à supprimer ──");
  console.log(`  Mosquées  : ${toDelete.length}`);
  console.log(`  Users     : ${totals.users}`);
  console.log(`  Classes   : ${totals.classes}`);
  console.log(`  Élèves    : ${totals.eleves}`);
  console.log(`  Plannings : ${totals.plannings}`);
  console.log(`  Présences : ${totals.presences}`);
  console.log(`  Notes     : ${totals.notes}`);
  console.log(`  Devoirs   : ${totals.devoirs}`);
  console.log(`  Messages  : ${totals.messages}`);
  console.log(`  Annonces  : ${totals.annonces}\n`);

  if (dryRun) {
    console.log("── Dry-run terminé ──");
    console.log("  Aucune suppression effectuée.");
    console.log(
      "  Pour lancer la suppression réelle : npm run cleanup:test-data\n"
    );
    return;
  }

  const confirmed = await askConfirmation();
  if (!confirmed) {
    console.log("\n❌ Confirmation absente — opération annulée.\n");
    return;
  }

  console.log("\n🗑️  Suppression en cours…\n");

  const deleted: MosqueeStats[] = [];
  for (const stats of toDelete) {
    // Cascade Prisma : Mosquee → users, classes, eleves, planning, etc.
    await prisma.mosquee.delete({ where: { id: stats.id } });
    deleted.push(stats);
    console.log(`  ✓ Supprimée : ${stats.nom}`);
  }

  const ampAfter = await getAmpCounts();

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║              RÉSUMÉ FINAL                            ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Mosquées supprimées : ${String(deleted.length).padEnd(29)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  AMP — intégrité vérifiée                            ║");
  console.log(
    `║  Élèves  avant/après : ${String(ampBefore.eleves).padEnd(5)} / ${String(ampAfter.eleves).padEnd(18)}║`
  );
  console.log(
    `║  Classes avant/après : ${String(ampBefore.classes).padEnd(5)} / ${String(ampAfter.classes).padEnd(18)}║`
  );
  console.log(
    `║  Profs   avant/après : ${String(ampBefore.profs).padEnd(5)} / ${String(ampAfter.profs).padEnd(18)}║`
  );
  console.log("╚══════════════════════════════════════════════════════╝\n");

  if (
    ampBefore.eleves !== ampAfter.eleves ||
    ampBefore.classes !== ampAfter.classes ||
    ampBefore.profs !== ampAfter.profs
  ) {
    throw new Error(
      "ALERTE : les compteurs AMP ont changé après le nettoyage — vérifiez la base immédiatement."
    );
  }

  console.log("✅ Mosquée AMP intacte.\n");

  console.log("Détail par mosquée supprimée :\n");
  for (const stats of deleted) {
    printMosqueeStats(stats);
    console.log("");
  }
}

main()
  .catch((error) => {
    console.error("❌ Erreur cleanup :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
