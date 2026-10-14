import * as XLSX from "xlsx";
import { normalizePersonName } from "../text-normalize";

/** Retire un numéro de frère/sœur en fin de token (ABAOUI 1 → ABAOUI). */
export function stripTrailingNumber(raw: string): string {
  return raw
    .trim()
    .replace(/\s+\d+\s*$/, "")
    .trim();
}

/** Clé de matching : majuscules, sans accents, espaces/tirets normalisés. */
export function importPersonKey(prenom: string, nom: string): string {
  const p = normalizePersonName(stripTrailingNumber(prenom));
  const n = normalizePersonName(stripTrailingNumber(nom));
  return `${p}|${n}`.toUpperCase();
}

export function isAdultExcelPrenomEnfant(enfantPrenom: string): boolean {
  const u = enfantPrenom.trim().toUpperCase();
  return u === "ADULTE" || u.startsWith("ADULTE ");
}

export type ResolvedIdentity = {
  prenom: string;
  nom: string;
  adult: boolean;
  dob: Date | null;
  matchKey: string;
};

export function resolveExcelIdentity(row: {
  repNom: string;
  repPrenom: string;
  enfantNom: string;
  enfantPrenom: string;
  dateNaissance: Date | null;
}): ResolvedIdentity {
  if (isAdultExcelPrenomEnfant(row.enfantPrenom)) {
    const prenom = stripTrailingNumber(row.repPrenom);
    const nom = stripTrailingNumber(row.repNom);
    return {
      prenom,
      nom,
      adult: true,
      dob: null,
      matchKey: importPersonKey(prenom, nom),
    };
  }

  const nom =
    stripTrailingNumber(row.enfantNom) || stripTrailingNumber(row.repNom);
  const prenom = stripTrailingNumber(row.enfantPrenom);
  const dob = sanitizeImportDob(row.dateNaissance);

  return {
    prenom,
    nom,
    adult: false,
    dob,
    matchKey: importPersonKey(prenom, nom),
  };
}

/** Date calendaire UTC (évite le décalage J-1 des Date Excel). */
export function parseExcelDateUtc(value: unknown): Date | null {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
    );
  }

  const s = String(value).trim();
  if (!s) return null;

  const fr = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (fr) {
    const y =
      fr[3].length === 2 ? 2000 + parseInt(fr[3], 10) : parseInt(fr[3], 10);
    return new Date(
      Date.UTC(y, parseInt(fr[2], 10) - 1, parseInt(fr[1], 10))
    );
  }

  return null;
}

export function sanitizeImportDob(d: Date | null): Date | null {
  if (!d) return null;
  const y = d.getUTCFullYear();
  const nowY = new Date().getUTCFullYear();
  if (y < 1950 || y > nowY) return null;
  const todayUtc = Date.UTC(nowY, new Date().getUTCMonth(), new Date().getUTCDate());
  const t = Date.UTC(y, d.getUTCMonth(), d.getUTCDate());
  if (t > todayUtc) return null;
  return d;
}

export function datesWithinOneDay(
  a: Date | null | undefined,
  b: Date | null | undefined
): boolean {
  if (!a || !b) return false;
  const da = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const db = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.abs(da - db) <= 86400000;
}

export type DbEleve = {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: Date | null;
  classe: { nom: string; niveau: string };
};

export type MatchOutcome =
  | { status: "found"; eleveId: string; label: string; adult: boolean }
  | { status: "not_found" }
  | { status: "ambiguous"; ids: string[]; reason: string };

export function isAdultClasse(classeNom: string, niveau: string): boolean {
  return /ADULTE/i.test(classeNom) || /ADULTE/i.test(niveau);
}

export function buildEleveIndex(eleves: DbEleve[]): Map<string, DbEleve[]> {
  const map = new Map<string, DbEleve[]>();
  for (const e of eleves) {
    const key = importPersonKey(e.prenom, e.nom);
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.id.localeCompare(b.id));
  }
  return map;
}

function rankByDob(candidates: DbEleve[], dob: Date | null): DbEleve[] {
  if (!dob) return candidates;
  return [...candidates].sort((a, b) => {
    const aOk = a.dateNaissance && datesWithinOneDay(dob, a.dateNaissance) ? 0 : 1;
    const bOk = b.dateNaissance && datesWithinOneDay(dob, b.dateNaissance) ? 0 : 1;
    if (aOk !== bOk) return aOk - bOk;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Attribue les élèves pour une famille Excel (ordre des lignes = jumeaux).
 */
export function matchFamilyChildren(
  children: Array<{ excelRow: number; identity: ResolvedIdentity }>,
  index: Map<string, DbEleve[]>
): Map<number, MatchOutcome> {
  const usedInFamily = new Set<string>();
  const outcomes = new Map<number, MatchOutcome>();

  const keyCounts = new Map<string, number>();
  for (const c of children) {
    keyCounts.set(c.identity.matchKey, (keyCounts.get(c.identity.matchKey) ?? 0) + 1);
  }

  const keySeenIndex = new Map<string, number>();

  for (const child of children) {
    const { identity, excelRow } = child;
    const poolAll = index.get(identity.matchKey) ?? [];
    let pool = poolAll.filter((e) => !usedInFamily.has(e.id));

    if (pool.length === 0) {
      outcomes.set(excelRow, { status: "not_found" });
      continue;
    }

    if (identity.dob && pool.length > 1) {
      const dobMatches = pool.filter(
        (e) => e.dateNaissance && datesWithinOneDay(identity.dob, e.dateNaissance)
      );
      if (dobMatches.length >= 1) {
        pool = dobMatches;
      }
    }

    const twinRows = keyCounts.get(identity.matchKey) ?? 1;
    const twinIndex = keySeenIndex.get(identity.matchKey) ?? 0;
    keySeenIndex.set(identity.matchKey, twinIndex + 1);

    if (twinRows > 1) {
      const ordered = rankByDob(pool, identity.dob);
      const pick = ordered[twinIndex];
      if (pick) {
        usedInFamily.add(pick.id);
        outcomes.set(excelRow, {
          status: "found",
          eleveId: pick.id,
          label: `${pick.prenom} ${pick.nom}`,
          adult: isAdultClasse(pick.classe.nom, pick.classe.niveau),
        });
        continue;
      }
      outcomes.set(excelRow, {
        status: "not_found",
      });
      continue;
    }

    if (pool.length === 1) {
      const e = pool[0];
      usedInFamily.add(e.id);
      outcomes.set(excelRow, {
        status: "found",
        eleveId: e.id,
        label: `${e.prenom} ${e.nom}`,
        adult: isAdultClasse(e.classe.nom, e.classe.niveau),
      });
      continue;
    }

    outcomes.set(excelRow, {
      status: "ambiguous",
      ids: pool.map((e) => e.id),
      reason: `${pool.length} élèves MadrasApp pour prénom+nom (familles différentes ou homonymes)`,
    });
  }

  return outcomes;
}

export function printReportSection(
  title: string,
  lines: string[],
  maxExamples = 30
) {
  console.log(`\n${title} (${lines.length}) :`);
  lines.slice(0, maxExamples).forEach((l) => console.log(`   ${l}`));
  if (lines.length > maxExamples) {
    console.log(`   … et ${lines.length - maxExamples} autres`);
  }
}
