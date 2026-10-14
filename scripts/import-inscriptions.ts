/**
 * Import inscriptions paiement AMP → comptes parents / adultes (sans recréer élèves ni classes).
 *
 * Usage :
 *   npm run import:inscriptions -- --dry-run
 *   npm run import:inscriptions -- --mapping data/import-output/rapprochement-....csv
 *   npm run import:inscriptions -- --mapping ... --write
 */

import { randomBytes } from "crypto";
import { config } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { normalizePhoneFR, phoneToLoginEmail } from "../lib/phone/fr";
import { resolveAmpMosquee } from "../lib/import/resolve-amp-mosquee";
import {
  csvEscape,
  fuzzyMatchUnmatched,
  fuzzyResultFromAmbiguous,
  type FuzzyRowResult,
} from "../lib/import/fuzzy-match";
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

type ConfirmedMatch = {
  eleveId: string;
  adult: boolean;
  label: string;
  source: "exact" | "mapping" | "fuzzy_sur";
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
    const dateNaissance = iDob >= 0 ? parseExcelDateUtc(line[iDob]) : null;
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

function parseArgValue(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return null;
  return process.argv[idx + 1] ?? null;
}

function timestampForFile(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function exportRapprochementCsv(
  outDir: string,
  rows: FuzzyRowResult[],
  typeByRow: Map<number, string>
): string {
  const path = resolve(outDir, `rapprochement-${timestampForFile()}.csv`);
  const header =
    "ligne_excel;nom_excel;candidat_id;candidat_prenom;candidat_nom;groupe;score;statut;type;decision";
  const lines = [header];

  for (const r of rows) {
    const type = typeByRow.get(r.excelRow) ?? "FUZZY";
    if (r.proposals.length === 0) {
      lines.push(
        [
          r.excelRow,
          csvEscape(r.excelLabel),
          "",
          "",
          "",
          "",
          "",
          r.statut,
          type,
          "",
        ].join(";")
      );
      continue;
    }
    for (const p of r.proposals) {
      lines.push(
        [
          r.excelRow,
          csvEscape(r.excelLabel),
          p.eleveId,
          csvEscape(p.prenom),
          csvEscape(p.nom),
          csvEscape(p.groupe),
          String(p.score),
          r.statut,
          type,
          "",
        ].join(";")
      );
    }
  }

  writeFileSync(path, lines.join("\n"), "utf8");
  return path;
}

function exportElevesACreerCsv(
  outDir: string,
  items: Array<{
    excelRow: number;
    prenom: string;
    nom: string;
    dob: string;
    rep: string;
    phone: string;
  }>
): string {
  const path = resolve(outDir, `eleves-a-creer-${timestampForFile()}.csv`);
  const header =
    "ligne_excel;prenom;nom;date_naissance;representant;telephone_famille;groupe";
  const lines = [header];
  for (const it of items) {
    lines.push(
      [
        it.excelRow,
        csvEscape(it.prenom),
        csvEscape(it.nom),
        it.dob,
        csvEscape(it.rep),
        it.phone,
        "",
      ].join(";")
    );
  }
  writeFileSync(path, lines.join("\n"), "utf8");
  return path;
}

function parseMappingCsv(
  mappingPath: string,
  eleves: Array<{ id: string; prenom: string; nom: string; classe: { nom: string } }>
): Map<number, string> {
  const content = readFileSync(mappingPath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return new Map();

  const header = lines[0].split(";").map((h) => normHeader(h));
  const iRow = header.findIndex((h) => h.includes("ligne"));
  const iCand = header.findIndex((h) => h.includes("candidat_id"));
  const iDecision = header.findIndex((h) => h.includes("decision"));

  const byRow = new Map<number, string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const excelRow = parseInt(cols[iRow] ?? "", 10);
    if (!excelRow) continue;

    const decision = (cols[iDecision] ?? "").trim();
    if (!decision || decision.toUpperCase() === "NON") continue;

    let eleveId = "";
    if (/^cm[a-z0-9]+$/i.test(decision)) {
      eleveId = decision;
    } else if (decision.toUpperCase() === "OUI") {
      eleveId = (cols[iCand] ?? "").trim();
    }

    if (!eleveId) continue;
    if (!eleves.some((e) => e.id === eleveId)) continue;

    if (!byRow.has(excelRow)) {
      byRow.set(excelRow, eleveId);
    }
  }

  return byRow;
}

async function main() {
  const write = process.argv.includes("--write");
  const mappingPath = parseArgValue("--mapping");

  const xlsxPath = resolve(
    process.cwd(),
    process.env.INSCRIPTIONS_XLSX?.trim() || DEFAULT_XLSX
  );
  if (!existsSync(xlsxPath)) {
    throw new Error(`Excel introuvable : ${xlsxPath}`);
  }

  console.log(`📄 Fichier : ${xlsxPath}`);
  if (write) console.log("✍️  Mode ÉCRITURE");
  else console.log("🔍 Mode dry-run (aucune écriture)");
  if (mappingPath) console.log(`📎 Mapping : ${mappingPath}`);
  console.log("");

  const mosquee = await resolveAmpMosquee(prisma);
  console.log(`🕌 Mosquée cible : ${mosquee.nom} (${mosquee.id})\n`);

  const excelRows = parseSheet(xlsxPath);
  const { families, emptyLines, orphanSiblingRows } = buildFamilies(excelRows);

  const eleves = await prisma.eleve.findMany({
    where: { mosqueeId: mosquee.id },
    include: { classe: { select: { nom: true, niveau: true } }, user: true, parent: true },
  });

  const index = buildEleveIndex(eleves);
  const confirmed = new Map<number, ConfirmedMatch>();
  const outcomeByRow = new Map<number, MatchOutcome>();

  const found: string[] = [];
  const notFoundRows: Array<{
    excelRow: number;
    identity: ReturnType<typeof resolveExcelIdentity>;
    excelLabel: string;
    raw: ExcelChildRow;
  }> = [];
  const ambiguousRows: Array<{
    excelRow: number;
    excelLabel: string;
    ids: string[];
  }> = [];
  const doubtfulPhones: string[] = [];

  for (const fam of families) {
    if (fam.doubtfulPhone) {
      doubtfulPhones.push(`${fam.phone} (famille ${fam.repPrenom} ${fam.repNom})`);
    }

    const childInputs = fam.children.map((child) => {
      return {
        excelRow: child.excelRow,
        identity: resolveExcelIdentity(child),
        raw: child,
      };
    });

    const familyOutcomes = matchFamilyChildren(childInputs, index);

    for (const { excelRow, identity, raw } of childInputs) {
      const m = familyOutcomes.get(excelRow) ?? { status: "not_found" as const };
      outcomeByRow.set(excelRow, m);

      const excelLabel = `${identity.prenom} ${identity.nom}${identity.dob ? ` (${formatDob(identity.dob)})` : ""}`;

      if (m.status === "found") {
        confirmed.set(excelRow, {
          eleveId: m.eleveId,
          adult: m.adult,
          label: m.label,
          source: "exact",
        });
        found.push(
          `L${excelRow} → ${m.label} (${m.adult ? "ADULTE" : "enfant"}) [${m.eleveId}] ← Excel: ${excelLabel}`
        );
      } else if (m.status === "ambiguous") {
        ambiguousRows.push({ excelRow, excelLabel, ids: m.ids });
      } else {
        notFoundRows.push({ excelRow, identity, excelLabel, raw });
      }
    }
  }

  const matchedEleveIds = new Set([...confirmed.values()].map((c) => c.eleveId));
  const unmatchedEleves = eleves.filter((e) => !matchedEleveIds.has(e.id));

  const fuzzyInput = notFoundRows.map((r) => ({
    excelRow: r.excelRow,
    identity: r.identity,
    excelLabel: r.excelLabel,
  }));
  const fuzzyResults = fuzzyMatchUnmatched(fuzzyInput, unmatchedEleves);

  const rapprochementRows: FuzzyRowResult[] = [];
  const typeByRow = new Map<number, string>();

  for (const a of ambiguousRows) {
    rapprochementRows.push(
      fuzzyResultFromAmbiguous(a.excelRow, a.excelLabel, eleves, a.ids)
    );
    typeByRow.set(a.excelRow, "EXACT_AMBIGU");
  }
  for (const f of fuzzyResults) {
    rapprochementRows.push(f);
    typeByRow.set(f.excelRow, "FUZZY");
  }

  rapprochementRows.sort((a, b) => a.excelRow - b.excelRow);

  const countByStatut = {
    SUR: 0,
    A_VERIFIER: 0,
    AUCUN: 0,
    AMBIGU: 0,
  };
  const seenExcelStatut = new Set<number>();
  for (const r of rapprochementRows) {
    if (seenExcelStatut.has(r.excelRow)) continue;
    seenExcelStatut.add(r.excelRow);
    if (r.statut === "SÛR") countByStatut.SUR++;
    else if (r.statut === "À VÉRIFIER") countByStatut.A_VERIFIER++;
    else if (r.statut === "AMBIGU") countByStatut.AMBIGU++;
    else countByStatut.AUCUN++;
  }

  const outDir = resolve(process.cwd(), "data/import-output");
  mkdirSync(outDir, { recursive: true });

  const rapprochementPath = exportRapprochementCsv(outDir, rapprochementRows, typeByRow);

  if (mappingPath) {
    if (!existsSync(mappingPath)) {
      throw new Error(`Fichier mapping introuvable : ${mappingPath}`);
    }
    const decisions = parseMappingCsv(mappingPath, eleves);
    for (const [excelRow, eleveId] of decisions) {
      const e = eleves.find((x) => x.id === eleveId);
      if (!e) continue;
      if (confirmed.has(excelRow)) continue;
      confirmed.set(excelRow, {
        eleveId,
        adult: isAdultClasse(e.classe.nom, e.classe.niveau),
        label: `${e.prenom} ${e.nom}`,
        source: "mapping",
      });
      matchedEleveIds.add(eleveId);
    }
    console.log(`📎 Décisions mapping appliquées : ${decisions.size} ligne(s)\n`);
  }

  const elevesACreer: Array<{
    excelRow: number;
    prenom: string;
    nom: string;
    dob: string;
    rep: string;
    phone: string;
  }> = [];

  for (const fam of families) {
    for (const child of fam.children) {
      if (confirmed.has(child.excelRow)) continue;
      const id = resolveExcelIdentity(child);
      elevesACreer.push({
        excelRow: child.excelRow,
        prenom: id.prenom,
        nom: id.nom,
        dob: formatDob(id.dob),
        rep: `${child.repPrenom} ${child.repNom}`.trim(),
        phone: fam.phone,
      });
    }
  }

  const elevesACreerPath = exportElevesACreerCsv(outDir, elevesACreer);

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

  printReportSection("✅ Passe 1 — trouvés (exact)", found);
  printReportSection("📋 MadrasApp → absents Excel", madrasappNotInExcel);
  printReportSection("☎️  Numéros douteux", doubtfulPhones);

  console.log("\n── Passe 2 — rapprochement flou (lignes Excel) ──");
  console.log(`   SÛR           : ${countByStatut.SUR}`);
  console.log(`   À VÉRIFIER    : ${countByStatut.A_VERIFIER}`);
  console.log(`   AUCUN         : ${countByStatut.AUCUN}`);
  console.log(`   AMBIGU        : ${countByStatut.AMBIGU}`);

  const confirmedExact = [...confirmed.values()].filter((c) => c.source === "exact").length;
  const confirmedMapping = [...confirmed.values()].filter((c) => c.source === "mapping").length;

  console.log("\n── Confirmés (prêt import comptes) ──");
  console.log(`   Exact (passe 1)     : ${confirmedExact}`);
  console.log(`   Via mapping CSV     : ${confirmedMapping}`);
  console.log(`   Total confirmés     : ${confirmed.size} / ${totalChildRows}`);
  console.log(`   À créer en base     : ${elevesACreer.length} (non créés par le script)`);

  console.log(`\n📁 Export rapprochement : ${rapprochementPath}`);
  console.log(`📁 Export à créer       : ${elevesACreerPath}`);

  if (!write) {
    console.log(
      "\n➡️  Dry-run : remplissez « decision » (OUI / NON / id élève), puis :\n" +
        "    npm run import:inscriptions -- --mapping <csv> --write\n"
    );
    return;
  }

  if (!mappingPath) {
    console.error("\n❌ --write exige --mapping <rapprochement.csv> rempli.\n");
    process.exit(1);
  }

  if (orphanSiblingRows.length > 0) {
    console.error("\n❌ Écriture refusée : lignes orphelines sans téléphone.\n");
    process.exit(1);
  }

  const credentialsLines = [
    "telephone;role;nom;prenom;mot_de_passe_provisoire;family_key;eleves_lies",
  ];
  const passwordByFamily = new Map<string, string>();

  for (const fam of families) {
    const confirmedChildren = fam.children.filter((c) => confirmed.has(c.excelRow));
    if (confirmedChildren.length === 0) continue;

    if (!passwordByFamily.has(fam.familyKey)) {
      passwordByFamily.set(fam.familyKey, generateFamilyPassword());
    }
    const plainPassword = passwordByFamily.get(fam.familyKey)!;
    const hash = await bcrypt.hash(plainPassword, 12);

    const minors = confirmedChildren.filter((c) => {
      const m = confirmed.get(c.excelRow)!;
      return !m.adult;
    });
    const adults = confirmedChildren.filter((c) => confirmed.get(c.excelRow)!.adult);

    if (minors.length > 0) {
      const email = phoneToLoginEmail(fam.phone);
      let parent = await prisma.user.findFirst({
        where: { OR: [{ telephoneNormalized: fam.phone }, { email }] },
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
        const m = confirmed.get(child.excelRow)!;
        await prisma.eleve.update({
          where: { id: m.eleveId },
          data: { parentId: parent.id },
        });
      }

      credentialsLines.push(
        `${fam.phone};PARENT;${fam.repNom};${fam.repPrenom};${plainPassword};${fam.familyKey};${minors.map((c) => `${c.enfantPrenom} ${c.enfantNom}`.trim()).join("|")}`
      );
    }

    for (const child of adults) {
      const m = confirmed.get(child.excelRow)!;
      const eleve = eleves.find((e) => e.id === m.eleveId)!;
      const id = resolveExcelIdentity(child);
      const email = phoneToLoginEmail(fam.phone);

      let user = eleve.user;
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            password: hash,
            nom: id.nom,
            prenom: id.prenom,
            telephone: fam.phone,
            telephoneNormalized: fam.phone,
            role: "ELEVE",
            mosqueeId: mosquee.id,
            mustChangePassword: true,
            familyKey: fam.familyKey,
          },
        });
        await prisma.eleve.update({
          where: { id: eleve.id },
          data: { userId: user.id, telephone: fam.phone },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            telephone: fam.phone,
            telephoneNormalized: fam.phone,
            password: hash,
            mustChangePassword: true,
            familyKey: fam.familyKey,
          },
        });
      }

      credentialsLines.push(
        `${fam.phone};ELEVE (ADULTE);${id.nom};${id.prenom};${plainPassword};${fam.familyKey};${m.label}`
      );
    }
  }

  const csvPath = resolve(
    outDir,
    `inscriptions-credentials-${timestampForFile()}.csv`
  );
  writeFileSync(csvPath, credentialsLines.join("\n"), "utf8");
  console.log(`\n✅ Écriture terminée. Identifiants : ${csvPath}\n`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
