/**
 * Import des élèves AMP depuis le fichier Excel liste 2026/2027.
 *
 * Usage :
 *   npm run import:amp
 *
 * Fichier attendu (le premier trouvé) :
 *   - data/liste_des_eleves_2026_2027.xlsx
 *   - data/liste des eleves 2026  2027.xlsx
 *
 * Mosquée cible : AMP — Mosquée de Plaisir (jamais Démo ni TEST-CHARGE).
 * Idempotent : ré-exécuter n'ajoute pas de doublons (classes par nom de groupe,
 * élèves par nom + prénom + classe).
 */

import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import type { JourSemaine } from "../lib/constants/planning";

config();

const prisma = new PrismaClient();

const AMP_MOSQUEE_NOM = "AMP — Mosquée de Plaisir";
const EXCLUDED_MOSQUEE = [/démo/i, /demo/i, /test-charge/i, /mosquée de charge/i];

const EXCEL_CANDIDATES = [
  "data/liste_des_eleves_2026_2027.xlsx",
  "data/liste des eleves 2026  2027.xlsx",
];

const HEADER_ROW_INDEX = 2; // ligne 3 du fichier (0-indexed)
const DATA_START_INDEX = 3; // à partir de la ligne 4

type RawRow = {
  numero: string;
  nom: string;
  prenom: string;
  groupe: string;
  jours: string;
  horaire: string;
  salle: string;
  niveau: string;
};

type FieldConflict = {
  groupe: string;
  field: "niveau" | "salle" | "jours" | "horaire";
  values: Record<string, number>;
  retained: string;
};

type GroupAggregate = {
  groupe: string;
  niveau: string;
  salle: string;
  jour: JourSemaine;
  heureDebut: string;
  heureFin: string;
  rows: RawRow[];
  conflicts: FieldConflict[];
};

function resolveExcelPath(): string {
  for (const relative of EXCEL_CANDIDATES) {
    const full = resolve(process.cwd(), relative);
    if (existsSync(full)) return full;
  }
  throw new Error(
    `Fichier Excel introuvable. Placez-le dans : ${EXCEL_CANDIDATES.join(" ou ")}`
  );
}

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function formatNom(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((part) =>
      part
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join("-")
    )
    .join(" ");
}

function formatPrenom(raw: string): string {
  return formatNom(raw);
}

function parseHoraire(raw: string): { heureDebut: string; heureFin: string } {
  const match = raw.trim().match(/(\d{1,2})H(\d{2})\s*à\s*(\d{1,2})H(\d{2})/i);
  if (!match) {
    throw new Error(`Horaire invalide : "${raw}"`);
  }
  return {
    heureDebut: `${match[1].padStart(2, "0")}:${match[2]}`,
    heureFin: `${match[3].padStart(2, "0")}:${match[4]}`,
  };
}

function normalizeJour(raw: string): JourSemaine {
  const jour = raw.trim().toUpperCase().replace(/\s+/g, "");
  const allowed: JourSemaine[] = [
    "LUNDI",
    "MARDI",
    "MERCREDI",
    "JEUDI",
    "VENDREDI",
    "SAMEDI",
    "DIMANCHE",
  ];
  if (!allowed.includes(jour as JourSemaine)) {
    throw new Error(`Jour invalide : "${raw}"`);
  }
  return jour as JourSemaine;
}

function majorityValue(counts: Record<string, number>): string {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

function matiereFromNiveau(niveau: string): string {
  const n = niveau.toUpperCase();
  if (n.includes("CORAN") || n.includes("NOURANIA")) return "Coran";
  if (n.includes("ARABE")) return "Arabe";
  if (n.includes("ADULTE")) return "Coran";
  if (n.startsWith("NIVEAU")) return "Arabe";
  return "Cours";
}

function parseExcel(filePath: string): RawRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
  });

  const header = matrix[HEADER_ROW_INDEX]?.map((c) => cellString(c).toLowerCase()) ?? [];
  const expected = ["n°", "nom", "prénom", "groupe", "jours", "horaire", "classe", "niveau"];
  const headerOk =
    header[1] === "nom" &&
    header[2]?.includes("pr") &&
    header[3] === "groupe" &&
    header[7] === "niveau";

  if (!headerOk) {
    console.warn("⚠️  En-têtes inattendus à la ligne 3 — lecture par index de colonnes.");
  }

  const rows: RawRow[] = [];
  for (let i = DATA_START_INDEX; i < matrix.length; i++) {
    const line = matrix[i] ?? [];
    const nom = cellString(line[1]);
    const prenom = cellString(line[2]);
    if (!nom && !prenom) continue;

    const groupe = cellString(line[3]);
    const jours = cellString(line[4]);
    const horaire = cellString(line[5]);
    const salle = cellString(line[6]);
    const niveau = cellString(line[7]);

    if (!groupe || !jours || !horaire || !salle || !niveau) {
      throw new Error(
        `Ligne ${i + 1} incomplète pour ${nom} ${prenom} (groupe/jours/horaire/salle/niveau requis)`
      );
    }

    rows.push({
      numero: cellString(line[0]),
      nom,
      prenom,
      groupe,
      jours,
      horaire,
      salle,
      niveau,
    });
  }

  return rows;
}

function buildGroupAggregates(rows: RawRow[]): {
  groups: GroupAggregate[];
  allConflicts: FieldConflict[];
} {
  const byGroupe = new Map<
    string,
    {
      niveaux: Record<string, number>;
      salles: Record<string, number>;
      jours: Record<string, number>;
      horaires: Record<string, number>;
      rows: RawRow[];
    }
  >();

  for (const row of rows) {
    if (!byGroupe.has(row.groupe)) {
      byGroupe.set(row.groupe, {
        niveaux: {},
        salles: {},
        jours: {},
        horaires: {},
        rows: [],
      });
    }
    const bucket = byGroupe.get(row.groupe)!;
    bucket.rows.push(row);
    bucket.niveaux[row.niveau] = (bucket.niveaux[row.niveau] ?? 0) + 1;
    bucket.salles[row.salle] = (bucket.salles[row.salle] ?? 0) + 1;
    bucket.jours[row.jours] = (bucket.jours[row.jours] ?? 0) + 1;
    bucket.horaires[row.horaire] = (bucket.horaires[row.horaire] ?? 0) + 1;
  }

  const allConflicts: FieldConflict[] = [];
  const groups: GroupAggregate[] = [];

  for (const [groupe, bucket] of byGroupe) {
    const conflicts: FieldConflict[] = [];
    const fields = [
      ["niveau", bucket.niveaux] as const,
      ["salle", bucket.salles] as const,
      ["jours", bucket.jours] as const,
      ["horaire", bucket.horaires] as const,
    ];

    const retained: Record<string, string> = {};
    for (const [field, counts] of fields) {
      retained[field] = majorityValue(counts);
      if (Object.keys(counts).length > 1) {
        const conflict: FieldConflict = {
          groupe,
          field: field as FieldConflict["field"],
          values: counts,
          retained: retained[field],
        };
        conflicts.push(conflict);
        allConflicts.push(conflict);
      }
    }

    const horaireParsed = parseHoraire(retained.horaire);
    groups.push({
      groupe,
      niveau: retained.niveau,
      salle: retained.salle,
      jour: normalizeJour(retained.jours),
      heureDebut: horaireParsed.heureDebut,
      heureFin: horaireParsed.heureFin,
      rows: bucket.rows,
      conflicts,
    });
  }

  groups.sort((a, b) => a.groupe.localeCompare(b.groupe, "fr"));
  return { groups, allConflicts };
}

async function resolveAmpMosquee() {
  const envId = process.env.AMP_MOSQUEE_ID?.trim();
  if (envId) {
    const mosquee = await prisma.mosquee.findUnique({ where: { id: envId } });
    if (!mosquee) {
      throw new Error(`AMP_MOSQUEE_ID inconnu : ${envId}`);
    }
    return mosquee;
  }

  const all = await prisma.mosquee.findMany();
  const candidates = all.filter(
    (m) =>
      !EXCLUDED_MOSQUEE.some((re) => re.test(m.nom)) &&
      (/AMP/i.test(m.nom) || /Plaisir/i.test(m.nom))
  );

  if (candidates.length > 1) {
    throw new Error(
      `Plusieurs mosquées AMP candidates : ${candidates.map((m) => m.nom).join(", ")}. Définissez AMP_MOSQUEE_ID.`
    );
  }
  if (candidates.length === 1) {
    return candidates[0];
  }

  console.log(`ℹ️  Mosquée AMP absente — création de « ${AMP_MOSQUEE_NOM} »…`);
  return prisma.mosquee.create({
    data: { nom: AMP_MOSQUEE_NOM },
  });
}

function conflictMessage(conflict: FieldConflict): string {
  const values = Object.entries(conflict.values)
    .map(([value, count]) => `${value} (${count})`)
    .join(", ");
  return `⚠️  ${conflict.groupe} : incohérence détectée entre [${values}], valeur retenue : ${conflict.retained} — à vérifier avec la mosquée`;
}

async function main() {
  const excelPath = resolveExcelPath();
  console.log(`\n📂 Lecture : ${excelPath}\n`);

  const rawRows = parseExcel(excelPath);
  console.log(`📋 ${rawRows.length} élèves lus dans le fichier`);

  const { groups, allConflicts } = buildGroupAggregates(rawRows);
  console.log(`📚 ${groups.length} groupes pédagogiques uniques\n`);

  const mosquee = await resolveAmpMosquee();
  console.log(`🕌 Mosquée cible : ${mosquee.nom} (${mosquee.id})\n`);

  let classesCreated = 0;
  let classesUpdated = 0;
  let planningCreated = 0;
  let elevesCreated = 0;
  let elevesSkipped = 0;

  const classeIdByGroupe = new Map<string, string>();

  for (const group of groups) {
    let classe = await prisma.classe.findFirst({
      where: { mosqueeId: mosquee.id, nom: group.groupe },
    });

    if (classe) {
      const needsUpdate =
        classe.niveau !== group.niveau || classe.salle !== group.salle;
      if (needsUpdate) {
        classe = await prisma.classe.update({
          where: { id: classe.id },
          data: { niveau: group.niveau, salle: group.salle },
        });
        classesUpdated++;
      }
    } else {
      classe = await prisma.classe.create({
        data: {
          nom: group.groupe,
          niveau: group.niveau,
          salle: group.salle,
          mosqueeId: mosquee.id,
        },
      });
      classesCreated++;
    }

    classeIdByGroupe.set(group.groupe, classe.id);

    const existingPlanning = await prisma.planning.findFirst({
      where: {
        mosqueeId: mosquee.id,
        classeId: classe.id,
        jour: group.jour,
        heureDebut: group.heureDebut,
        heureFin: group.heureFin,
      },
    });

    if (!existingPlanning) {
      await prisma.planning.create({
        data: {
          jour: group.jour,
          heureDebut: group.heureDebut,
          heureFin: group.heureFin,
          matiere: matiereFromNiveau(group.niveau),
          classeId: classe.id,
          mosqueeId: mosquee.id,
        },
      });
      planningCreated++;
    }
  }

  for (const row of rawRows) {
    const classeId = classeIdByGroupe.get(row.groupe);
    if (!classeId) {
      throw new Error(`Classe introuvable pour ${row.groupe}`);
    }

    const nom = formatNom(row.nom);
    const prenom = formatPrenom(row.prenom);

    const existing = await prisma.eleve.findFirst({
      where: {
        mosqueeId: mosquee.id,
        classeId,
        nom,
        prenom,
      },
    });

    if (existing) {
      elevesSkipped++;
      continue;
    }

    await prisma.eleve.create({
      data: {
        nom,
        prenom,
        classeId,
        mosqueeId: mosquee.id,
        parentId: null,
      },
    });
    elevesCreated++;
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║           IMPORT AMP — RÉSUMÉ                        ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Mosquée         : ${mosquee.nom.slice(0, 36).padEnd(36)}║`);
  console.log(`║  Classes créées  : ${String(classesCreated).padEnd(36)}║`);
  console.log(`║  Classes MAJ     : ${String(classesUpdated).padEnd(36)}║`);
  console.log(`║  Plannings créés : ${String(planningCreated).padEnd(36)}║`);
  console.log(`║  Élèves importés : ${String(elevesCreated).padEnd(36)}║`);
  console.log(`║  Élèves ignorés  : ${String(elevesSkipped).padEnd(36)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");

  if (allConflicts.length === 0) {
    console.log("║  Aucune incohérence détectée entre les groupes       ║");
  } else {
    console.log(`║  Incohérences    : ${String(allConflicts.length).padEnd(36)}║`);
    console.log("╠══════════════════════════════════════════════════════╣");
    for (const conflict of allConflicts) {
      const line = conflictMessage(conflict);
      console.log(`║  ${line.slice(0, 52).padEnd(52)}║`);
      if (line.length > 52) {
        console.log(`║  ${line.slice(52, 104).padEnd(52)}║`);
      }
    }
  }

  console.log("╚══════════════════════════════════════════════════════╝\n");

  if (allConflicts.length > 0) {
    console.log("Détail des incohérences :\n");
    for (const conflict of allConflicts) {
      console.log(conflictMessage(conflict));
    }
    console.log("");
  }
}

main()
  .catch((error) => {
    console.error("❌ Erreur import AMP :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
