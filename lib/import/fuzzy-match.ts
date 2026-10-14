import {
  datesWithinOneDay,
  importPersonKey,
  stripTrailingNumber,
  type DbEleve,
  type ResolvedIdentity,
} from "./inscription-match";
import { normalizePersonName } from "../text-normalize";

export type FuzzyStatut = "SÛR" | "À VÉRIFIER" | "AUCUN" | "AMBIGU";

export type FuzzyProposal = {
  eleveId: string;
  prenom: string;
  nom: string;
  groupe: string;
  score: number;
};

export type FuzzyRowResult = {
  excelRow: number;
  excelLabel: string;
  statut: FuzzyStatut;
  proposals: FuzzyProposal[];
  reason?: string;
};

function compactToken(s: string): string {
  return normalizePersonName(stripTrailingNumber(s)).replace(/[\s\-'’.]/g, "");
}

function nameTokens(prenom: string, nom: string): string[] {
  const parts = [
    ...normalizePersonName(stripTrailingNumber(prenom)).split(/\s+/),
    ...normalizePersonName(stripTrailingNumber(nom)).split(/\s+/),
  ].filter(Boolean);
  return parts.map((p) => p.replace(/[\-'’.]/g, ""));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) row[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

function stringsMatchFuzzy(a: string, b: string): { ok: boolean; score: number } {
  if (!a || !b) return { ok: false, score: 99 };
  if (a === b) return { ok: true, score: 0 };
  const dist = levenshtein(a, b);
  if (dist <= 2) return { ok: true, score: dist };
  const minLen = Math.min(a.length, b.length);
  if (minLen >= 4 && (a.startsWith(b) || b.startsWith(a))) {
    return { ok: true, score: 1 };
  }
  return { ok: false, score: dist };
}

function compositeNameScore(
  excelPrenom: string,
  excelNom: string,
  dbPrenom: string,
  dbNom: string
): number {
  const eTokens = nameTokens(excelPrenom, excelNom);
  const dTokens = nameTokens(dbPrenom, dbNom);
  const eJoin = eTokens.join("");
  const dJoin = dTokens.join("");
  const eRev = [...eTokens].reverse().join("");
  const dRev = [...dTokens].reverse().join("");

  const variants = [
    stringsMatchFuzzy(eJoin, dJoin),
    stringsMatchFuzzy(eRev, dJoin),
    stringsMatchFuzzy(eJoin, dRev),
    stringsMatchFuzzy(
      compactToken(excelPrenom) + compactToken(excelNom),
      compactToken(dbPrenom) + compactToken(dbNom)
    ),
    stringsMatchFuzzy(
      compactToken(excelNom) + compactToken(excelPrenom),
      compactToken(dbPrenom) + compactToken(dbNom)
    ),
  ];

  let best = 99;
  for (const v of variants) {
    if (v.ok && v.score < best) best = v.score;
  }

  const eNomParts = normalizePersonName(excelNom).split(/\s+/).filter(Boolean);
  const dNomParts = normalizePersonName(dbNom).split(/\s+/).filter(Boolean);
  if (eNomParts.length > 1 || dNomParts.length > 1) {
    const eFirst = compactToken(eNomParts[0] ?? excelNom);
    const dFirst = compactToken(dNomParts[0] ?? dbNom);
    const eFull = compactToken(excelNom);
    const dFull = compactToken(dbNom);
    for (const pair of [
      stringsMatchFuzzy(eFirst, dFull),
      stringsMatchFuzzy(eFull, dFirst),
      stringsMatchFuzzy(eFirst, dFirst),
    ]) {
      if (pair.ok && pair.score < best) best = pair.score;
    }
  }

  const ePrenomParts = normalizePersonName(excelPrenom).split(/\s+/);
  const dPrenomParts = normalizePersonName(dbPrenom).split(/\s+/);
  if (ePrenomParts.length > 1 || dPrenomParts.length > 1) {
    const eP = compactToken(excelPrenom);
    const dP = compactToken(dbPrenom);
    const pair = stringsMatchFuzzy(eP, dP);
    if (pair.ok && pair.score < best) best = pair.score;
  }

  return best;
}

export function scoreEleveForIdentity(
  identity: ResolvedIdentity,
  eleve: DbEleve
): number {
  if (importPersonKey(identity.prenom, identity.nom) === importPersonKey(eleve.prenom, eleve.nom)) {
    return 0;
  }
  let score = compositeNameScore(identity.prenom, identity.nom, eleve.prenom, eleve.nom);
  if (identity.dob && eleve.dateNaissance) {
    if (datesWithinOneDay(identity.dob, eleve.dateNaissance)) {
      score = Math.max(0, score - 1);
    } else {
      score += 3;
    }
  }
  return score;
}

export function fuzzyMatchUnmatched(
  rows: Array<{ excelRow: number; identity: ResolvedIdentity; excelLabel: string }>,
  unmatchedEleves: DbEleve[]
): FuzzyRowResult[] {
  const results: FuzzyRowResult[] = [];

  const proposalsByExcel = new Map<number, FuzzyProposal[]>();

  for (const row of rows) {
    const props: FuzzyProposal[] = [];
    for (const e of unmatchedEleves) {
      const score = scoreEleveForIdentity(row.identity, e);
      if (score <= 2) {
        props.push({
          eleveId: e.id,
          prenom: e.prenom,
          nom: e.nom,
          groupe: e.classe.nom,
          score,
        });
      }
    }
    props.sort((a, b) => a.score - b.score || a.eleveId.localeCompare(b.eleveId));
    proposalsByExcel.set(row.excelRow, props.slice(0, 5));
  }

  const bestExcelForEleve = new Map<string, { excelRow: number; score: number }>();
  for (const row of rows) {
    const props = proposalsByExcel.get(row.excelRow) ?? [];
    if (props.length === 0) continue;
    const top = props[0];
    const prev = bestExcelForEleve.get(top.eleveId);
    if (!prev || top.score < prev.score) {
      bestExcelForEleve.set(top.eleveId, { excelRow: row.excelRow, score: top.score });
    }
  }

  for (const row of rows) {
    const props = proposalsByExcel.get(row.excelRow) ?? [];
    if (props.length === 0) {
      results.push({
        excelRow: row.excelRow,
        excelLabel: row.excelLabel,
        statut: "AUCUN",
        proposals: [],
      });
      continue;
    }

    const top = props[0];
    const reciprocal =
      bestExcelForEleve.get(top.eleveId)?.excelRow === row.excelRow;
    const uniqueTop = props.filter((p) => p.score === top.score).length === 1;

    if (top.score === 0 && uniqueTop) {
      results.push({
        excelRow: row.excelRow,
        excelLabel: row.excelLabel,
        statut: "SÛR",
        proposals: props,
      });
      continue;
    }

    if (reciprocal && uniqueTop && top.score <= 1) {
      results.push({
        excelRow: row.excelRow,
        excelLabel: row.excelLabel,
        statut: "SÛR",
        proposals: props,
      });
      continue;
    }

    results.push({
      excelRow: row.excelRow,
      excelLabel: row.excelLabel,
      statut: "À VÉRIFIER",
      proposals: props,
    });
  }

  return results;
}

export function fuzzyResultFromAmbiguous(
  excelRow: number,
  excelLabel: string,
  eleves: DbEleve[],
  ids: string[]
): FuzzyRowResult {
  const proposals = ids
    .map((id) => eleves.find((e) => e.id === id))
    .filter((e): e is DbEleve => Boolean(e))
    .map((e) => ({
      eleveId: e.id,
      prenom: e.prenom,
      nom: e.nom,
      groupe: e.classe.nom,
      score: 0,
    }));
  return {
    excelRow,
    excelLabel,
    statut: "AMBIGU",
    proposals,
    reason: "Homonymes exacts en base",
  };
}

export function csvEscape(value: string): string {
  if (/[;"\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
