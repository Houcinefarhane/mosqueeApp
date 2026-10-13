/**
 * Import inscriptions paiement AMP → comptes parents / adultes (sans recréer élèves ni classes).
 *
 * Usage :
 *   npm run import:inscriptions -- --dry-run
 *   npm run import:inscriptions -- --write   (après validation du rapport)
 *
 * Fichier : data/Inscription_Paiement_2026_2027.xlsx (ou chemin via INSCRIPTIONS_XLSX)
 * Feuille : « Inscription Paiement 2026 2027 »
 */

import { randomBytes } from "crypto";
import { config } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { normalizePhoneFR, phoneToLoginEmail } from "../lib/phone/fr";
import { normalizePersonName, samePersonName } from "../lib/text-normalize";
import { resolveAmpMosquee } from "../lib/import/resolve-amp-mosquee";

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

function parseExcelDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  }
  const s = cellString(value);
  if (!s) return null;
  const fr = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (fr) {
    const y = fr[3].length === 2 ? 2000 + parseInt(fr[3], 10) : parseInt(fr[3], 10);
    return new Date(y, parseInt(fr[2], 10) - 1, parseInt(fr[1], 10));
  }
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) {
    const d = new Date(iso);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return null;
}

function sameDate(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isAdultClasse(classeNom: string, niveau: string): boolean {
  return /ADULTE/i.test(classeNom) || /ADULTE/i.test(niveau);
}

function headerIndex(headers: string[], ...needles: string[]): number {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase();
  const h = headers.map(norm);
  for (const needle of needles) {
    const n = norm(needle);
    const idx = h.findIndex((col) => col.includes(n));
    if (idx >= 0) return idx;
  }
  return -1;
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
    row.some((c) => cellString(c).toLowerCase().includes("nom") && cellString(c).toLowerCase().includes("repr"))
  );
  if (headerRowIdx < 0) {
    headerRowIdx = matrix.findIndex((row) =>
      row.some((c) => /enfant/i.test(cellString(c)))
    );
  }
  if (headerRowIdx < 0) headerRowIdx = 0;

  const headers = (matrix[headerRowIdx] ?? []).map((c) => cellString(c));
  const iRepNom = headerIndex(headers, "nom représentant", "nom representant", "nom rep");
  const iRepPrenom = headerIndex(headers, "prénom", "prenom");
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
    const dateNaissance = iDob >= 0 ? parseExcelDate(line[iDob]) : null;
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
    if (!row.enfantNom && !row.enfantPrenom) {
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

async function main() {
  const write = process.argv.includes("--write");
  const dryRun = !write || process.argv.includes("--dry-run");

  if (write && dryRun && !process.argv.includes("--write")) {
    /* dry-run only */
  }

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

  type MatchResult =
    | { status: "found"; eleveId: string; label: string; adult: boolean }
    | { status: "not_found" }
    | { status: "ambiguous"; ids: string[] };

  function matchEleve(
    nom: string,
    prenom: string,
    dob: Date | null
  ): MatchResult {
    const byName = eleves.filter(
      (e) => samePersonName(e.nom, nom) && samePersonName(e.prenom, prenom)
    );
    if (byName.length === 0) return { status: "not_found" };
    if (dob) {
      const withDob = byName.filter((e) => sameDate(e.dateNaissance, dob));
      if (withDob.length === 1) {
        const e = withDob[0];
        return {
          status: "found",
          eleveId: e.id,
          label: `${e.prenom} ${e.nom}`,
          adult: isAdultClasse(e.classe.nom, e.classe.niveau),
        };
      }
      if (withDob.length > 1) {
        return { status: "ambiguous", ids: withDob.map((e) => e.id) };
      }
    }
    if (byName.length === 1 && !dob) {
      const e = byName[0];
      return {
        status: "found",
        eleveId: e.id,
        label: `${e.prenom} ${e.nom}`,
        adult: isAdultClasse(e.classe.nom, e.classe.niveau),
      };
    }
    return { status: "ambiguous", ids: byName.map((e) => e.id) };
  }

  const found: string[] = [];
  const notFound: string[] = [];
  const ambiguous: string[] = [];
  const doubtfulPhones: string[] = [];
  const matchedEleveIds = new Set<string>();

  for (const fam of families) {
    if (fam.doubtfulPhone) {
      doubtfulPhones.push(`${fam.phone} (famille ${fam.repPrenom} ${fam.repNom})`);
    }
    for (const child of fam.children) {
      const m = matchEleve(child.enfantNom, child.enfantPrenom, child.dateNaissance);
      if (m.status === "found") {
        found.push(
          `L${child.excelRow} → ${m.label} (${m.adult ? "ADULTE" : "enfant"}) [${m.eleveId}]`
        );
        matchedEleveIds.add(m.eleveId);
      } else if (m.status === "ambiguous") {
        ambiguous.push(
          `L${child.excelRow} ${child.enfantPrenom} ${child.enfantNom} → ${m.ids.join(", ")}`
        );
      } else {
        notFound.push(
          `L${child.excelRow} ${child.enfantPrenom} ${child.enfantNom}${child.dateNaissance ? ` (${child.dateNaissance.toISOString().slice(0, 10)})` : ""}`
        );
      }
    }
  }

  const madrasappNotInExcel = eleves
    .filter((e) => !matchedEleveIds.has(e.id))
    .map(
      (e) =>
        `${e.prenom} ${e.nom}${e.dateNaissance ? ` (${e.dateNaissance.toISOString().slice(0, 10)})` : ""} — ${e.classe.nom} [${e.id}]`
    );

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║              RAPPORT IMPORT INSCRIPTIONS                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`Familles (téléphone) : ${families.length}`);
  console.log(`Lignes Excel (enfants) : ${families.reduce((s, f) => s + f.children.length, 0)}`);
  console.log(`Lignes vides ignorées : ${emptyLines.length}`);
  console.log(`Frères/sœurs sans téléphone au-dessus : ${orphanSiblingRows.length}\n`);

  console.log(`✅ Élèves trouvés (${found.length}) :`);
  found.forEach((l) => console.log(`   ${l}`));
  console.log(`\n❌ Excel → introuvable MadrasApp (${notFound.length}) :`);
  notFound.forEach((l) => console.log(`   ${l}`));
  console.log(`\n⚠️  Correspondances ambiguës (${ambiguous.length}) :`);
  ambiguous.forEach((l) => console.log(`   ${l}`));
  console.log(`\n📋 MadrasApp → absents Excel (${madrasappNotInExcel.length}) :`);
  madrasappNotInExcel.slice(0, 50).forEach((l) => console.log(`   ${l}`));
  if (madrasappNotInExcel.length > 50) {
    console.log(`   … et ${madrasappNotInExcel.length - 50} autres`);
  }
  console.log(`\n☎️  Numéros douteux (${doubtfulPhones.length}) :`);
  doubtfulPhones.forEach((l) => console.log(`   ${l}`));

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

    const minors = fam.children.filter((c) => {
      const m = matchEleve(c.enfantNom, c.enfantPrenom, c.dateNaissance);
      return m.status === "found" && !m.adult;
    });
    const adults = fam.children.filter((c) => {
      const m = matchEleve(c.enfantNom, c.enfantPrenom, c.dateNaissance);
      return m.status === "found" && m.adult;
    });

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
        const m = matchEleve(child.enfantNom, child.enfantPrenom, child.dateNaissance);
        if (m.status !== "found") continue;
        await prisma.eleve.update({
          where: { id: m.eleveId },
          data: { parentId: parent.id },
        });
      }

      csvLines.push(
        `${fam.phone};PARENT;${fam.repNom};${fam.repPrenom};${plainPassword};${fam.familyKey};${minors.map((c) => `${c.enfantPrenom} ${c.enfantNom}`).join("|")}`
      );
    }

    for (const child of adults) {
      const m = matchEleve(child.enfantNom, child.enfantPrenom, child.dateNaissance);
      if (m.status !== "found") continue;
      const eleve = eleves.find((e) => e.id === m.eleveId)!;
      const adultPhone = fam.phone;
      const email = phoneToLoginEmail(adultPhone);

      let user = eleve.user;
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            password: hash,
            nom: child.enfantNom,
            prenom: child.enfantPrenom,
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
        `${adultPhone};ELEVE (ADULTE);${child.enfantNom};${child.enfantPrenom};${plainPassword};${fam.familyKey};${m.label}`
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
