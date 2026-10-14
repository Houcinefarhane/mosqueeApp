/**
 * Import inscriptions paiement AMP → comptes parents / adultes (sans recréer élèves ni classes).
 *
 * Usage :
 *   npm run import:inscriptions -- --dry-run
 *   npm run import:inscriptions -- --write   (après validation du rapport)
 */

import { randomBytes } from "crypto";
import { config } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { normalizePhoneFR, phoneToLoginEmail } from "../lib/phone/fr";
import { resolveAmpMosquee } from "../lib/import/resolve-amp-mosquee";
import {
  buildEleveIndex,
  isAdultClasse,
  matchFamilyChildren,
  parseExcelDateUtc,
  printReportSection,
  resolveExcelIdentity,
  type MatchOutcome,
} from "../lib/import/inscription-match";

config();

const prisma = new PrismaClient();

const SHEET_NAME = "Inscription Paiement 2026 2027";
const DEFAULT_XLSX = "data/Inscription_Paiement_2026_2027.xlsx";

type ExcelChildRow = {
  excelRow: number;
  repNom: string;
  repPrenom: string;
  tel: string;
  tel2: string;
  enfantNom: string;
  enfantPrenom: string;
  dateNaissance: Date | null;
  montant: string;
  gratuit: string;
  reduit: string;
  emptyLine: boolean;
  inheritedPhone: boolean;
};

type FamilyGroup = {
  familyKey: string;
  repNom: string;
  repPrenom: string;
  phone: string;
  phone2: string | null;
  doubtfulPhone: boolean;
  children: ExcelChildRow[];
};

function cellString(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function normHeader(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function headerIndex(headers: string[], ...needles: string[]): number {
  const h = headers.map(normHeader);
  for (const needle of needles) {
    const n = normHeader(needle);
    const idx = h.findIndex((col) => col.includes(n));
    if (idx >= 0) return idx;
  }
  return -1;
}

function indexRepPrenom(headers: string[]): number {
  const explicit = headerIndex(
    headers,
    "prénom représentant",
    "prenom representant",
    "prenom rep"
  );
  if (explicit >= 0) return explicit;
  return headers.findIndex((col) => {
    const n = normHeader(col);
    return (
      (n === "prenom" || n === "prénom" || n.startsWith("prenom ")) &&
      !n.includes("enfant")
    );
  });
}

function parseSheet(filePath: string): ExcelChildRow[] {
  const wb = XLSX.readFile(filePath);
  const sheet =
    wb.Sheets[SHEET_NAME] ??
    wb.Sheets[wb.SheetNames.find((n) => n.includes("Inscription Paiement")) ?? ""];
  if (!sheet) {
    throw new Error(`Feuille « ${SHEET_NAME} » introuvable.`);
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
  });

  let headerRowIdx = matrix.findIndex((row) =>
    row.some((c) => {
      const s = normHeader(cellString(c));
      return s.includes("nom") && s.includes("representant");
    })
  );
  if (headerRowIdx < 0) {
    headerRowIdx = matrix.findIndex((row) =>
      row.some((c) => /enfant/i.test(cellString(c)))
    );
  }
  if (headerRowIdx < 0) headerRowIdx = 0;

  const headers = (matrix[headerRowIdx] ?? []).map((c) => cellString(c));
  const iRepNom = headerIndex(
    headers,
    "nom représentant",
    "nom representant",
    "représentant légal"
  );
  const iRepPrenom = indexRepPrenom(headers);
  const iTel = headerIndex(headers, "n° tel", "n tel", "telephone", "tél");
  const iTel2 = headerIndex(headers, "tel2", "n° tel2");
  const iEnfantNom = headerIndex(headers, "nom enfant");
  const iEnfantPrenom = headerIndex(headers, "prénom enfant", "prenom enfant");
  const iDob = headerIndex(headers, "date naissance", "naissance");
  const iMontant = headerIndex(headers, "montant");
  const iGratuit = headerIndex(headers, "gratuit");
  const iReduit = headerIndex(headers, "réduit", "reduit");

  const rows: ExcelChildRow[] = [];
  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const line = matrix[r] ?? [];
    const repNom = iRepNom >= 0 ? cellString(line[iRepNom]) : "";
    const repPrenom = iRepPrenom >= 0 ? cellString(line[iRepPrenom]) : "";
    const tel = iTel >= 0 ? cellString(line[iTel]) : "";
    const tel2 = iTel2 >= 0 ? cellString(line[iTel2]) : "";
    const enfantNom = iEnfantNom >= 0 ? cellString(line[iEnfantNom]) : "";
    const enfantPrenom = iEnfantPrenom >= 0 ? cellString(line[iEnfantPrenom]) : "";
    const dateNaissance =
      iDob >= 0 ? parseExcelDateUtc(line[iDob]) : null;
    const montant = iMontant >= 0 ? cellString(line[iMontant]) : "";
    const gratuit = iGratuit >= 0 ? cellString(line[iGratuit]) : "";
    const reduit = iReduit >= 0 ? cellString(line[iReduit]) : "";

    const emptyLine =
      !repNom &&
      !repPrenom &&
      !tel &&
      !tel2 &&
      !enfantNom &&
      !enfantPrenom &&
      !dateNaissance;

    rows.push({
      excelRow: r + 1,
      repNom,
      repPrenom,
      tel,
      tel2,
      enfantNom,
      enfantPrenom,
      dateNaissance,
      montant,
      gratuit,
      reduit,
      emptyLine,
      inheritedPhone: false,
    });
  }
  return rows;
}

function buildFamilies(rows: ExcelChildRow[]): {
  families: FamilyGroup[];
  emptyLines: number[];
  orphanSiblingRows: number[];
} {
  const emptyLines: number[] = [];
  const orphanSiblingRows: number[] = [];
  const families: FamilyGroup[] = [];
  let current: FamilyGroup | null = null;

  for (const row of rows) {
    if (row.emptyLine) {
      emptyLines.push(row.excelRow);
      continue;
    }
    if (!row.enfantPrenom && !row.enfantNom && !/ADULTE/i.test(row.enfantPrenom)) {
      emptyLines.push(row.excelRow);
      continue;
    }

    const telNorm = row.tel ? normalizePhoneFR(row.tel) : null;
    if (telNorm?.ok) {
      current = {
        familyKey: telNorm.normalized,
        repNom: row.repNom,
        repPrenom: row.repPrenom,
        phone: telNorm.normalized,
        phone2: (() => {
          if (!row.tel2) return null;
          const p2 = normalizePhoneFR(row.tel2);
          return p2.ok ? p2.normalized : null;
        })(),
        doubtfulPhone: telNorm.doubtful,
        children: [],
      };
      families.push(current);
      row.inheritedPhone = false;
      current.children.push(row);
    } else if (current) {
      row.inheritedPhone = true;
      current.children.push(row);
    } else {
      orphanSiblingRows.push(row.excelRow);
    }
  }

  return { families, emptyLines, orphanSiblingRows };
}

function generateFamilyPassword(): string {
  return `Am${randomBytes(9).toString("base64url")}#1`;
}

function formatDob(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

async function main() {
  const write = process.argv.includes("--write");

  const xlsxPath = resolve(
    process.cwd(),
    process.env.INSCRIPTIONS_XLSX?.trim() || DEFAULT_XLSX
  );
  if (!existsSync(xlsxPath)) {
    throw new Error(`Excel introuvable : ${xlsxPath}`);
  }

  console.log(`📄 Fichier : ${xlsxPath}`);
  console.log(write ? "✍️  Mode ÉCRITURE" : "🔍 Mode dry-run (aucune écriture)\n");

  const mosquee = await resolveAmpMosquee(prisma);
  console.log(`🕌 Mosquée cible : ${mosquee.nom} (${mosquee.id})\n`);

  const excelRows = parseSheet(xlsxPath);
  const { families, emptyLines, orphanSiblingRows } = buildFamilies(excelRows);

  const eleves = await prisma.eleve.findMany({
    where: { mosqueeId: mosquee.id },
    include: { classe: { select: { nom: true, niveau: true } }, user: true, parent: true },
  });

  const index = buildEleveIndex(eleves);

  const found: string[] = [];
  const notFound: string[] = [];
  const ambiguous: string[] = [];
  const doubtfulPhones: string[] = [];
  const matchedEleveIds = new Set<string>();
  const outcomeByRow = new Map<number, MatchOutcome>();

  for (const fam of families) {
    if (fam.doubtfulPhone) {
      doubtfulPhones.push(`${fam.phone} (famille ${fam.repPrenom} ${fam.repNom})`);
    }

    const childInputs = fam.children.map((child) => ({
      excelRow: child.excelRow,
      identity: resolveExcelIdentity(child),
      raw: child,
    }));

    const familyOutcomes = matchFamilyChildren(childInputs, index);

    for (const { excelRow, identity, raw } of childInputs) {
      const m = familyOutcomes.get(excelRow) ?? { status: "not_found" as const };
      outcomeByRow.set(excelRow, m);

      const labelExtra = `${identity.prenom} ${identity.nom}${identity.dob ? ` (${formatDob(identity.dob)})` : ""}`;

      if (m.status === "found") {
        found.push(
          `L${excelRow} → ${m.label} (${m.adult ? "ADULTE" : "enfant"}) [${m.eleveId}] ← Excel: ${labelExtra}`
        );
        matchedEleveIds.add(m.eleveId);
      } else if (m.status === "ambiguous") {
        ambiguous.push(
          `L${excelRow} ${labelExtra} → ${m.ids.join(", ")} — ${m.reason}`
        );
      } else {
        notFound.push(`L${excelRow} ${labelExtra} (rep: ${raw.repPrenom} ${raw.repNom})`);
      }
    }
  }

  const madrasappNotInExcel = eleves
    .filter((e) => !matchedEleveIds.has(e.id))
    .map(
      (e) =>
        `${e.prenom} ${e.nom}${e.dateNaissance ? ` (${formatDob(e.dateNaissance)})` : ""} — ${e.classe.nom} [${e.id}]`
    );

  const totalChildRows = families.reduce((s, f) => s + f.children.length, 0);

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║              RAPPORT IMPORT INSCRIPTIONS                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`Familles (téléphone) : ${families.length}`);
  console.log(`Lignes Excel (enfants) : ${totalChildRows}`);
  console.log(`Élèves MadrasApp (AMP) : ${eleves.length}`);
  console.log(`Lignes vides ignorées : ${emptyLines.length}`);
  console.log(`Frères/sœurs sans téléphone au-dessus : ${orphanSiblingRows.length}`);

  printReportSection("✅ Élèves trouvés", found);
  printReportSection("❌ Excel → introuvable MadrasApp", notFound);
  printReportSection("⚠️  Correspondances ambiguës", ambiguous);
  printReportSection("📋 MadrasApp → absents Excel", madrasappNotInExcel);
  printReportSection("☎️  Numéros douteux", doubtfulPhones);

  console.log("\n── Synthèse ──");
  console.log(`   Trouvés      : ${found.length} / ${totalChildRows}`);
  console.log(`   Introuvables : ${notFound.length}`);
  console.log(`   Ambigus      : ${ambiguous.length}`);
  console.log(`   Absents Excel: ${madrasappNotInExcel.length}`);

  if (!write) {
    console.log("\n➡️  Aucune écriture (dry-run). Relancez avec --write après validation.\n");
    return;
  }

  if (ambiguous.length > 0 || orphanSiblingRows.length > 0) {
    console.error("\n❌ Écriture refusée : corrigez les ambiguïtés / lignes orphelines d’abord.\n");
    process.exit(1);
  }

  const outDir = resolve(process.cwd(), "data/import-output");
  mkdirSync(outDir, { recursive: true });
  const csvLines = [
    "telephone;role;nom;prenom;mot_de_passe_provisoire;family_key;eleves_lies",
  ];

  const passwordByFamily = new Map<string, string>();

  for (const fam of families) {
    if (!passwordByFamily.has(fam.familyKey)) {
      passwordByFamily.set(fam.familyKey, generateFamilyPassword());
    }
    const plainPassword = passwordByFamily.get(fam.familyKey)!;
    const hash = await bcrypt.hash(plainPassword, 12);

    const minors: ExcelChildRow[] = [];
    const adults: ExcelChildRow[] = [];

    for (const child of fam.children) {
      const m = outcomeByRow.get(child.excelRow);
      if (!m || m.status !== "found") continue;
      if (m.adult) adults.push(child);
      else minors.push(child);
    }

    if (minors.length > 0) {
      const email = phoneToLoginEmail(fam.phone);
      let parent = await prisma.user.findFirst({
        where: {
          OR: [{ telephoneNormalized: fam.phone }, { email }],
        },
      });

      if (!parent) {
        parent = await prisma.user.create({
          data: {
            email,
            password: hash,
            nom: fam.repNom || "Parent",
            prenom: fam.repPrenom || "Famille",
            telephone: fam.phone,
            telephoneNormalized: fam.phone,
            role: "PARENT",
            mosqueeId: mosquee.id,
            mustChangePassword: true,
            familyKey: fam.familyKey,
          },
        });
      } else {
        parent = await prisma.user.update({
          where: { id: parent.id },
          data: {
            telephone: fam.phone,
            telephoneNormalized: fam.phone,
            password: hash,
            mustChangePassword: true,
            familyKey: fam.familyKey,
          },
        });
      }

      for (const child of minors) {
        const m = outcomeByRow.get(child.excelRow);
        if (!m || m.status !== "found") continue;
        await prisma.eleve.update({
          where: { id: m.eleveId },
          data: { parentId: parent.id },
        });
      }

      csvLines.push(
        `${fam.phone};PARENT;${fam.repNom};${fam.repPrenom};${plainPassword};${fam.familyKey};${minors.map((c) => `${c.enfantPrenom} ${c.enfantNom}`.trim()).join("|")}`
      );
    }

    for (const child of adults) {
      const m = outcomeByRow.get(child.excelRow);
      if (!m || m.status !== "found") continue;
      const eleve = eleves.find((e) => e.id === m.eleveId)!;
      const id = resolveExcelIdentity(child);
      const adultPhone = fam.phone;
      const email = phoneToLoginEmail(adultPhone);

      let user = eleve.user;
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            password: hash,
            nom: id.nom,
            prenom: id.prenom,
            telephone: adultPhone,
            telephoneNormalized: adultPhone,
            role: "ELEVE",
            mosqueeId: mosquee.id,
            mustChangePassword: true,
            familyKey: fam.familyKey,
          },
        });
        await prisma.eleve.update({
          where: { id: eleve.id },
          data: { userId: user.id, telephone: adultPhone },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            telephone: adultPhone,
            telephoneNormalized: adultPhone,
            password: hash,
            mustChangePassword: true,
            familyKey: fam.familyKey,
          },
        });
      }

      csvLines.push(
        `${adultPhone};ELEVE (ADULTE);${id.nom};${id.prenom};${plainPassword};${fam.familyKey};${m.label}`
      );
    }
  }

  const csvPath = resolve(
    outDir,
    `inscriptions-credentials-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`
  );
  writeFileSync(csvPath, csvLines.join("\n"), "utf8");
  console.log(`\n✅ Écriture terminée. CSV : ${csvPath}\n`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
