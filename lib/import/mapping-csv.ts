import { readFileSync } from "fs";

function normHeader(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function normDecision(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/À/g, "A");
}

export type MappingParseStats = {
  ouiRows: number;
  nonCandidates: number;
  atrancherRows: number;
  conflictRows: number;
  invalidIdRows: number;
};

export type MappingParseResult = {
  byRow: Map<number, string>;
  stats: MappingParseStats;
  conflicts: string[];
  atrancherExcelRows: Set<number>;
};

export function parseMappingCsv(
  mappingPath: string,
  validEleveIds: Set<string>
): MappingParseResult {
  const content = readFileSync(mappingPath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const byRow = new Map<number, string>();
  const stats: MappingParseStats = {
    ouiRows: 0,
    nonCandidates: 0,
    atrancherRows: 0,
    conflictRows: 0,
    invalidIdRows: 0,
  };
  const conflicts: string[] = [];
  const atrancherExcelRows = new Set<number>();

  if (lines.length < 2) {
    return { byRow, stats, conflicts, atrancherExcelRows };
  }

  const header = lines[0].split(";").map((h) => normHeader(h));
  const iRow = header.findIndex((h) => h.includes("ligne"));
  const iCand = header.findIndex((h) => h.includes("candidat_id"));
  const iDecision = header.findIndex((h) => h.includes("decision"));

  const grouped = new Map<
    number,
    Array<{ decision: string; candidatId: string }>
  >();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const excelRow = parseInt(cols[iRow] ?? "", 10);
    if (!excelRow) continue;

    const decisionRaw = (cols[iDecision] ?? "").trim();
    const decision = normDecision(decisionRaw);
    const candidatId = (cols[iCand] ?? "").trim();

    if (!decision) continue;

    if (decision === "NON") {
      stats.nonCandidates++;
      continue;
    }

    const list = grouped.get(excelRow) ?? [];
    list.push({ decision, candidatId });
    grouped.set(excelRow, list);
  }

  for (const [excelRow, decisions] of grouped) {
    const hasAtrancher = decisions.some(
      (d) => d.decision === "A_TRANCHER" || d.decision === "ATRANCHER"
    );
    if (hasAtrancher) {
      stats.atrancherRows++;
      atrancherExcelRows.add(excelRow);
      continue;
    }

    const picks: string[] = [];
    for (const d of decisions) {
      if (d.decision === "OUI" && d.candidatId) {
        picks.push(d.candidatId);
      } else if (/^CM[A-Z0-9]+$/i.test(d.decision)) {
        picks.push(d.decision);
      } else if (/^cm[a-z0-9]+$/i.test(d.decision)) {
        picks.push(d.decision);
      }
    }

    const unique = [...new Set(picks)];
    if (unique.length === 0) continue;

    if (unique.length > 1) {
      stats.conflictRows++;
      conflicts.push(
        `L${excelRow} : plusieurs OUI/id différents (${unique.join(", ")})`
      );
      continue;
    }

    const eleveId = unique[0];
    if (!validEleveIds.has(eleveId)) {
      stats.invalidIdRows++;
      continue;
    }

    byRow.set(excelRow, eleveId);
    stats.ouiRows++;
  }

  return { byRow, stats, conflicts, atrancherExcelRows };
}
