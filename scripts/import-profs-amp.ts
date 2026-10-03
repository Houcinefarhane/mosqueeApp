/**
 * Import des enseignants AMP depuis le fichier groupes 2026/2027
 * et assignation aux 36 classes déjà créées.
 *
 * Usage : npm run import:profs-amp
 *
 * Fichier attendu (le premier trouvé) :
 *   - data/LES_GROUPES__ECOLE_AMP_2026_2027.xlsx
 *   - data/LES GROUPES  ECOLE AMP 2026 2027.xlsx
 *
 * Idempotent : ne crée pas de doublons de comptes professeurs.
 * Ne modifie pas les élèves.
 */

import { config } from "dotenv";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient, Role } from "@prisma/client";

config();

const prisma = new PrismaClient();

const AMP_MOSQUEE_NOM = "AMP — Mosquée de Plaisir";
const EXCLUDED_MOSQUEE = [/démo/i, /demo/i, /test-charge/i, /mosquée de charge/i];
const TEMP_PASSWORD = "ChangeMoi2026!";

const EXCEL_CANDIDATES = [
  "data/LES_GROUPES__ECOLE_AMP_2026_2027.xlsx",
  "data/LES GROUPES  ECOLE AMP 2026 2027.xlsx",
];

const JOURS_RE = /LUNDI|MARDI|MERCREDI|JEUDI|VENDREDI|SAMEDI|DIMANCHE/i;
const HORAIRE_RE = /\d{1,2}H\d{2}\s*-\s*\d{1,2}H\d{2}/i;
const NIVEAU_RE =
  /NIVEAU|CORAN|NOURANIA|ARABE|ADULTE|FEMME|FEMMES|DECOVERTE|LANGUE/i;

/** Incohérences connues du 1er import (import-amp.ts) */
const KNOWN_INCONSISTENCIES: Record<
  number,
  { field: "niveau" | "salle"; retained: string }
> = {
  1: { field: "salle", retained: "CLASSE 4" },
  11: { field: "niveau", retained: "CORAN 2" },
  26: { field: "niveau", retained: "CORAN 2" },
};

type GroupInfo = {
  enseignant_prenom: string;
  salle: string;
  niveau: string;
  jour: string;
  horaire: string;
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

function cellString(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "richText" in value) {
    return (value as ExcelJS.CellRichTextValue).richText
      .map((r) => r.text)
      .join("");
  }
  if (typeof value === "object" && "result" in value) {
    return String((value as ExcelJS.CellFormulaValue).result ?? "");
  }
  return String(value).trim();
}

function colLetterToNum(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function getMergeRange(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number
): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
  for (const merge of ws.model.merges ?? []) {
    const m = merge.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!m) continue;
    const c1 = colLetterToNum(m[1]);
    const r1 = parseInt(m[2], 10);
    const c2 = colLetterToNum(m[3]);
    const r2 = parseInt(m[4], 10);
    if (row >= r1 && row <= r2 && col >= c1 && col <= c2) {
      return { minCol: c1, maxCol: c2, minRow: r1, maxRow: r2 };
    }
  }
  return { minCol: col, maxCol: col, minRow: row, maxRow: row };
}

function normalizeSpaces(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function cleanNiveau(raw: string): string {
  let t = normalizeSpaces(raw);
  t = t.replace(HORAIRE_RE, "").trim();
  t = t.replace(/^\(+|\)+$/g, "").trim();
  t = t.replace(/^niveau\s+niveau\s+/i, "NIVEAU ");
  if (/^FEMMES?$/i.test(t)) return "FEMMES";
  return t;
}

function parseEnseignant(raw: string): { prenom: string; salle: string } {
  const text = normalizeSpaces(raw);
  let prenom = "";
  let salleNum = "";

  const standard = text.match(
    /ENSEIGNANT\s*:\s*([A-Za-zÀ-ÿ\-]+).*?CLASSE\s*(\d+)/i
  );
  if (standard) {
    prenom = standard[1];
    salleNum = standard[2];
  } else {
    const reversed = text.match(
      /ENSEIGNANT\s*:?\s*CLASSE\s*(\d+)\s*([A-Za-zÀ-ÿ\-]+)/i
    );
    if (reversed) {
      salleNum = reversed[1];
      prenom = reversed[2];
    } else {
      const loosePrenom = text.match(/ENSEIGNANT\s*:\s*([A-Za-zÀ-ÿ\-]+)/i);
      const looseSalle = text.match(/CLASSE\s*(\d+)/i);
      if (loosePrenom) prenom = loosePrenom[1];
      if (looseSalle) salleNum = looseSalle[1];
    }
  }

  if (prenom.toUpperCase() === "CLASSE") prenom = "";

  return {
    prenom,
    salle: salleNum ? `CLASSE ${salleNum}` : "",
  };
}

function extractNiveau(text: string): string {
  const t = normalizeSpaces(text);
  if (!NIVEAU_RE.test(t) || /ENSEIGNANT/i.test(t)) return "";

  const patterns = [
    /COURS\s+CORAN\s*\d+/i,
    /COURS\s+NOURANIA\s*\d+/i,
    /NOURANIA\s*\d+/i,
    /CORAN\s*\d+/i,
    /NIVEAU\s*DECOVERTE[^]*/i,
    /NIVEAU\s*\d+/i,
    /FEMME\s+(CORAN|ARABE)/i,
    /FEMMES/i,
    /ADULTE[^]*/i,
    /ARABE[^]*/i,
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (m) return cleanNiveau(m[0]);
  }

  if (NIVEAU_RE.test(t)) return cleanNiveau(t);
  return "";
}

function findStudentHeaderRow(
  ws: ExcelJS.Worksheet,
  groupeRow: number,
  nomCol: number
): number {
  const colStart = nomCol - 1;
  const colEnd = nomCol + 1;

  for (let rr = groupeRow + 1; rr <= groupeRow + 15 && rr <= ws.rowCount; rr++) {
    const nCol = cellString(ws.getCell(rr, colStart).value);
    const nomColVal = cellString(ws.getCell(rr, nomCol).value);
    const prenomCol = cellString(ws.getCell(rr, colEnd).value);
    if (
      /^N°$/i.test(nCol) &&
      /^NOM$/i.test(nomColVal) &&
      /PRÉNOM|PRENOM/i.test(prenomCol)
    ) {
      return rr;
    }
  }
  return -1;
}

function getCell(ws: ExcelJS.Worksheet, row: number, col: number): string {
  return cellString(ws.getCell(row, col).value);
}

async function parseGroupesExcelAsync(
  filePath: string
): Promise<Map<number, GroupInfo>> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];
  const results = new Map<number, GroupInfo>();

  for (let r = 1; r <= ws.rowCount; r++) {
    for (let c = 1; c <= ws.columnCount; c++) {
      const v = getCell(ws, r, c);
      const match = v.match(/^GROUPE\s*(\d+)/i);
      if (!match) continue;

      const num = parseInt(match[1], 10);
      const merge = getMergeRange(ws, r, c);

      // Le libellé GROUPE est en général sur la colonne NOM (colStart+1)
      const nomCol =
        merge.minCol === merge.maxCol ? c : Math.min(c, merge.maxCol - 1);
      const colStart = nomCol - 1;
      const colEnd = nomCol + 1;
      const scanStart = Math.max(1, colStart - 1);

      const headerRow = findStudentHeaderRow(ws, r, nomCol);
      const scanEnd = headerRow > 0 ? headerRow - 1 : r + 8;

      let enseignant_prenom = "";
      let salle = "";
      let niveau = "";
      let jour = "";
      let horaire = "";

      for (let rr = r; rr <= scanEnd; rr++) {
        for (let cc = scanStart; cc <= colEnd; cc++) {
          const t = normalizeSpaces(getCell(ws, rr, cc));
          if (!t) continue;

          if (/ENSEIGNANT/i.test(t)) {
            const parsed = parseEnseignant(t);
            if (parsed.prenom) enseignant_prenom = parsed.prenom;
            if (parsed.salle) salle = parsed.salle;
          }

          const niveauCandidate = extractNiveau(t);
          if (niveauCandidate) niveau = niveauCandidate;

          if (JOURS_RE.test(t)) {
            jour = (t.match(JOURS_RE) ?? [""])[0].toUpperCase();
          }
          const hm = t.match(HORAIRE_RE);
          if (hm) horaire = hm[0].replace(/\s+/g, "");
        }
      }

      results.set(num, {
        enseignant_prenom,
        salle,
        niveau,
        jour,
        horaire,
      });
    }
  }

  return results;
}

function formatPrenom(raw: string): string {
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

function removeAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function profEmail(prenom: string): string {
  const slug = removeAccents(prenom)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `${slug}.amp@madrasaapp.local`;
}

function normalizeCompare(value: string): string {
  return normalizeSpaces(value).toUpperCase();
}

function groupeNom(num: number): string {
  return `GROUPE ${num}`;
}

async function resolveAmpMosquee() {
  const envId = process.env.AMP_MOSQUEE_ID?.trim();
  if (envId) {
    const mosquee = await prisma.mosquee.findUnique({ where: { id: envId } });
    if (!mosquee) throw new Error(`AMP_MOSQUEE_ID inconnu : ${envId}`);
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
  if (candidates.length === 1) return candidates[0];

  console.log(`ℹ️  Mosquée AMP absente — création de « ${AMP_MOSQUEE_NOM} »…`);
  return prisma.mosquee.create({ data: { nom: AMP_MOSQUEE_NOM } });
}

async function findOrCreateProf(
  mosqueeId: string,
  prenomRaw: string,
  passwordHash: string
): Promise<{ user: { id: string; email: string; prenom: string }; created: boolean }> {
  const prenom = formatPrenom(prenomRaw);
  const email = profEmail(prenom);

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    return { user: { id: byEmail.id, email: byEmail.email, prenom: byEmail.prenom }, created: false };
  }

  const existingProfs = await prisma.user.findMany({
    where: {
      mosqueeId,
      role: Role.PROFESSEUR,
      prenom: { equals: prenom, mode: "insensitive" },
    },
  });

  if (existingProfs.length === 1) {
    return {
      user: {
        id: existingProfs[0].id,
        email: existingProfs[0].email,
        prenom: existingProfs[0].prenom,
      },
      created: false,
    };
  }

  if (existingProfs.length > 1) {
    console.warn(
      `⚠️  Ambiguïté : plusieurs profs « ${prenom} » en base — utilisation du premier (${existingProfs[0].email})`
    );
    return {
      user: {
        id: existingProfs[0].id,
        email: existingProfs[0].email,
        prenom: existingProfs[0].prenom,
      },
      created: false,
    };
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      nom: "Enseignant",
      prenom,
      role: Role.PROFESSEUR,
      mosqueeId,
    },
  });

  return { user: { id: user.id, email: user.email, prenom: user.prenom }, created: true };
}

async function main() {
  const excelPath = resolveExcelPath();
  console.log(`\n📂 Lecture : ${excelPath}\n`);

  const groupes = await parseGroupesExcelAsync(excelPath);

  if (groupes.size !== 36) {
    console.warn(`⚠️  ${groupes.size} groupes extraits (attendu : 36)`);
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("DICTIONNAIRE EXTRAIT (vérification avant écriture DB)");
  console.log("═══════════════════════════════════════════════════════\n");
  const sortedNums = [...groupes.keys()].sort((a, b) => a - b);
  for (const num of sortedNums) {
    console.log(`GROUPE ${num}:`, groupes.get(num));
  }
  console.log("");

  const missingEnseignant = sortedNums.filter(
    (n) => !groupes.get(n)?.enseignant_prenom
  );
  if (missingEnseignant.length > 0) {
    console.warn(
      `⚠️  Groupes sans enseignant extrait : ${missingEnseignant.join(", ")}`
    );
  }

  const mosquee = await resolveAmpMosquee();
  console.log(`🕌 Mosquée cible : ${mosquee.nom} (${mosquee.id})\n`);

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
  console.log("🔐 Hash mot de passe calculé (1 seul bcrypt)\n");

  const profsCreated: Array<{ prenom: string; email: string }> = [];
  const profIdByPrenomKey = new Map<string, string>();
  const prenomVariants = new Map<string, Set<string>>();
  const assignments: Array<{
    groupe: number;
    enseignant: string;
    profEmail: string;
    salle: string;
  }> = [];
  const inconsistencyResults: Array<{
    groupe: number;
    field: string;
    status: "confirmé" | "corrigé";
    avant?: string;
    apres?: string;
  }> = [];
  const warnings: string[] = [];

  // Détecter variantes de prénom (MANENA / MANANA)
  for (const num of sortedNums) {
    const info = groupes.get(num)!;
    if (!info.enseignant_prenom) continue;
    const key = removeAccents(info.enseignant_prenom).toLowerCase();
    if (!prenomVariants.has(key)) prenomVariants.set(key, new Set());
    prenomVariants.get(key)!.add(formatPrenom(info.enseignant_prenom));
  }
  for (const [key, variants] of prenomVariants) {
    if (variants.size > 1) {
      warnings.push(
        `Prénom ambigu « ${key} » : variantes ${[...variants].join(" / ")} — vérifier avec la mosquée`
      );
    }
  }

  // Créer / retrouver les profs
  const uniquePrenoms = new Set<string>();
  for (const num of sortedNums) {
    const prenom = groupes.get(num)?.enseignant_prenom;
    if (prenom) uniquePrenoms.add(prenom);
  }

  const prenomList = [...uniquePrenoms].map((p) => formatPrenom(p));
  if (prenomList.includes("Manena") && prenomList.includes("Manana")) {
    warnings.push(
      "Manena (GROUPE 3) et Manana (GROUPE 28) : probablement la même personne — deux comptes distincts créés, à fusionner si confirmé par la mosquée"
    );
  }

  for (const prenomRaw of uniquePrenoms) {
    const { user, created } = await findOrCreateProf(
      mosquee.id,
      prenomRaw,
      passwordHash
    );
    const key = removeAccents(prenomRaw).toLowerCase();
    profIdByPrenomKey.set(key, user.id);
    if (created) {
      profsCreated.push({ prenom: user.prenom, email: user.email });
    }
  }

  // Assignation + résolution incohérences
  for (const num of sortedNums) {
    const info = groupes.get(num)!;
    const nomClasse = groupeNom(num);

    const classe = await prisma.classe.findFirst({
      where: { mosqueeId: mosquee.id, nom: nomClasse },
    });

    if (!classe) {
      warnings.push(`${nomClasse} : classe introuvable en base — ignorée`);
      continue;
    }

    const known = KNOWN_INCONSISTENCIES[num];
    if (known) {
      const fileValue =
        known.field === "salle" ? info.salle : info.niveau;
      const dbValue = known.field === "salle" ? classe.salle : classe.niveau;

      if (!fileValue) {
        warnings.push(
          `${nomClasse} : incohérence ${known.field} — valeur fichier vide, DB conservée (${dbValue})`
        );
      } else if (normalizeCompare(fileValue) === normalizeCompare(known.retained)) {
        inconsistencyResults.push({
          groupe: num,
          field: known.field,
          status: "confirmé",
          apres: dbValue ?? fileValue,
        });
      } else if (normalizeCompare(fileValue) === normalizeCompare(dbValue ?? "")) {
        inconsistencyResults.push({
          groupe: num,
          field: known.field,
          status: "confirmé",
          apres: dbValue ?? fileValue,
        });
      } else {
        const updateData =
          known.field === "salle"
            ? { salle: fileValue }
            : { niveau: fileValue };
        await prisma.classe.update({
          where: { id: classe.id },
          data: updateData,
        });
        inconsistencyResults.push({
          groupe: num,
          field: known.field,
          status: "corrigé",
          avant: dbValue ?? "(vide)",
          apres: fileValue,
        });
      }
    }

    let profEmailStr = "";
    if (info.enseignant_prenom) {
      const key = removeAccents(info.enseignant_prenom).toLowerCase();
      const profId = profIdByPrenomKey.get(key);
      if (profId) {
        await prisma.classe.update({
          where: { id: classe.id },
          data: { professeurId: profId },
        });
        profEmailStr = profEmail(formatPrenom(info.enseignant_prenom));
      }
    }

    assignments.push({
      groupe: num,
      enseignant: info.enseignant_prenom
        ? formatPrenom(info.enseignant_prenom)
        : "(non extrait)",
      profEmail: profEmailStr || "—",
      salle: info.salle || classe.salle || "—",
    });
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║        IMPORT PROFS AMP — RÉSUMÉ                     ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Mosquée              : ${mosquee.nom.slice(0, 29).padEnd(29)}║`);
  console.log(`║  Groupes traités      : ${String(sortedNums.length).padEnd(29)}║`);
  console.log(`║  Profs créés          : ${String(profsCreated.length).padEnd(29)}║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log("── Assignation des 36 groupes ──\n");
  for (const a of assignments) {
    console.log(
      `  GROUPE ${String(a.groupe).padStart(2)} → ${a.enseignant.padEnd(12)} (${a.profEmail})  salle fichier: ${a.salle}`
    );
  }

  console.log("\n── Comptes professeurs créés ──\n");
  if (profsCreated.length === 0) {
    console.log("  (aucun — tous existaient déjà)");
  } else {
    for (const p of profsCreated) {
      console.log(`  ${p.prenom.padEnd(12)} → ${p.email}  (MDP: ${TEMP_PASSWORD})`);
    }
  }

  console.log("\n── Incohérences du 1er import ──\n");
  for (const num of [1, 11, 26]) {
    const r = inconsistencyResults.find((x) => x.groupe === num);
    if (!r) {
      console.log(`  GROUPE ${num} : non traité`);
      continue;
    }
    if (r.status === "confirmé") {
      console.log(
        `  GROUPE ${num} (${r.field}) : confirmé → ${r.apres}`
      );
    } else {
      console.log(
        `  GROUPE ${num} (${r.field}) : corrigé ${r.avant} → ${r.apres}`
      );
    }
  }

  if (warnings.length > 0) {
    console.log("\n── À vérifier manuellement ──\n");
    for (const w of warnings) console.log(`  ⚠️  ${w}`);
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("❌ Erreur import profs AMP :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
