"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export type StatutPresence = "PRESENT" | "ABSENT" | "RETARD" | "EXCUSE";

const STATUT_LABELS: Record<StatutPresence, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  RETARD: "Retard",
  EXCUSE: "Excusé",
};

type Eleve = {
  id: string;
  nom: string;
  prenom: string;
};

type AppelCompactListProps = {
  eleves: Eleve[];
  presences: Record<string, StatutPresence>;
  commentaires: Record<string, string>;
  expandedIds: Set<string>;
  onToggleExpand: (eleveId: string) => void;
  onStatutChange: (eleveId: string, statut: StatutPresence) => void;
  onCommentChange: (eleveId: string, value: string) => void;
};

export default function AppelCompactList({
  eleves,
  presences,
  commentaires,
  expandedIds,
  onToggleExpand,
  onStatutChange,
  onCommentChange,
}: AppelCompactListProps) {
  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white md:hidden">
      {eleves.map((eleve) => {
        const statut = presences[eleve.id] || "PRESENT";
        const expanded = expandedIds.has(eleve.id);
        const isAbsent = statut === "ABSENT";
        const isAdvanced = statut === "RETARD" || statut === "EXCUSE";

        return (
          <li key={eleve.id} className="bg-white">
            <div className="flex items-stretch gap-1 p-2">
              <button
                type="button"
                onClick={() => onToggleExpand(eleve.id)}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-gray-400 active:bg-gray-100"
                aria-label={
                  expanded
                    ? `Masquer les options pour ${eleve.prenom} ${eleve.nom}`
                    : `Options pour ${eleve.prenom} ${eleve.nom}`
                }
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center px-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {eleve.prenom} {eleve.nom}
                </p>
                {isAdvanced && (
                  <p className="text-xs font-medium text-amber-700">
                    {STATUT_LABELS[statut]}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 overflow-hidden rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => onStatutChange(eleve.id, "PRESENT")}
                  className={cn(
                    "min-h-11 min-w-[4.25rem] px-3 text-sm font-semibold transition-colors",
                    !isAbsent && !isAdvanced
                      ? "bg-primary text-white"
                      : "bg-gray-50 text-gray-600 active:bg-gray-100"
                  )}
                  aria-pressed={!isAbsent && !isAdvanced}
                >
                  Présent
                </button>
                <button
                  type="button"
                  onClick={() => onStatutChange(eleve.id, "ABSENT")}
                  className={cn(
                    "min-h-11 min-w-[4.25rem] border-l border-gray-200 px-3 text-sm font-semibold transition-colors",
                    isAbsent
                      ? "bg-red-600 text-white"
                      : "bg-gray-50 text-gray-600 active:bg-gray-100"
                  )}
                  aria-pressed={isAbsent}
                >
                  Absent
                </button>
              </div>
            </div>

            {expanded && (
              <div className="space-y-2 border-t border-gray-100 bg-gray-50/80 px-3 pb-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {(["RETARD", "EXCUSE"] as StatutPresence[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onStatutChange(eleve.id, s)}
                      className={cn(
                        "min-h-11 rounded-lg text-sm font-medium transition-colors",
                        statut === s
                          ? "bg-primary text-white"
                          : "border border-gray-200 bg-white text-gray-700 active:bg-gray-100"
                      )}
                      aria-pressed={statut === s}
                    >
                      {STATUT_LABELS[s]}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Commentaire (optionnel)"
                  value={commentaires[eleve.id] || ""}
                  onChange={(e) => onCommentChange(eleve.id, e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
