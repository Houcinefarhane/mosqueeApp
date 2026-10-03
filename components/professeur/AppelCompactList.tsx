"use client";

import { cn } from "@/lib/utils";
import { TOUCH_BADGE, TOUCH_TARGET } from "@/lib/ui/touch-styles";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldAlert,
  X,
} from "lucide-react";

export type StatutPresence = "PRESENT" | "ABSENT" | "RETARD" | "EXCUSE";

const STATUT_LABELS: Record<StatutPresence, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  RETARD: "Retard",
  EXCUSE: "Excusé",
};

const ROW_BG: Record<StatutPresence, string> = {
  PRESENT: "bg-white",
  ABSENT: "bg-red-50/80",
  RETARD: "bg-amber-50/80",
  EXCUSE: "bg-blue-50/80",
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
  onTogglePresence: (eleveId: string) => void;
  onStatutChange: (eleveId: string, statut: StatutPresence) => void;
  onCommentChange: (eleveId: string, value: string) => void;
};

function StatusIcon({ statut }: { statut: StatutPresence }) {
  const base = "h-3.5 w-3.5";
  switch (statut) {
    case "PRESENT":
      return <Check className={base} strokeWidth={2.5} />;
    case "ABSENT":
      return <X className={base} strokeWidth={2.5} />;
    case "RETARD":
      return <Clock className={base} strokeWidth={2.5} />;
    case "EXCUSE":
      return <ShieldAlert className={base} strokeWidth={2.5} />;
  }
}

function StatusBadge({ statut }: { statut: StatutPresence }) {
  const styles: Record<StatutPresence, string> = {
    PRESENT: "bg-green-600 text-white",
    ABSENT: "bg-red-600 text-white",
    RETARD: "bg-amber-500 text-white",
    EXCUSE: "bg-blue-600 text-white",
  };

  return (
    <motion.span
      key={statut}
      initial={{ scale: 0.9, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.12 }}
      className={cn(TOUCH_BADGE, styles[statut])}
      aria-hidden
    >
      <StatusIcon statut={statut} />
    </motion.span>
  );
}

export default function AppelCompactList({
  eleves,
  presences,
  commentaires,
  expandedIds,
  onToggleExpand,
  onTogglePresence,
  onStatutChange,
  onCommentChange,
}: AppelCompactListProps) {
  return (
    <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white md:hidden">
      {eleves.map((eleve, index) => {
        const statut = presences[eleve.id] || "PRESENT";
        const expanded = expandedIds.has(eleve.id);
        const isAdvanced = statut === "RETARD" || statut === "EXCUSE";

        return (
          <motion.li
            key={eleve.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, delay: Math.min(index * 0.01, 0.2) }}
            className={cn(
              "border-b border-gray-100 last:border-b-0",
              ROW_BG[statut]
            )}
          >
            <div className="flex min-h-11 items-stretch">
              <motion.button
                type="button"
                onClick={() => onTogglePresence(eleve.id)}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.08 }}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-2.5 py-1 text-left"
                aria-label={`${eleve.prenom} ${eleve.nom} — ${STATUT_LABELS[statut]}. Appuyer pour changer.`}
              >
                <StatusBadge statut={statut} />
                <p className="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-foreground">
                  {eleve.prenom} {eleve.nom}
                  {isAdvanced && (
                    <span className="ml-1.5 text-[11px] font-normal text-amber-700">
                      · {STATUT_LABELS[statut]}
                    </span>
                  )}
                </p>
              </motion.button>

              <button
                type="button"
                onClick={() => onToggleExpand(eleve.id)}
                className={cn(
                  TOUCH_TARGET,
                  "w-10 min-w-10 shrink-0 text-gray-400 active:bg-black/5"
                )}
                aria-label={
                  expanded
                    ? `Masquer les options pour ${eleve.prenom} ${eleve.nom}`
                    : `Retard, excusé ou commentaire pour ${eleve.prenom} ${eleve.nom}`
                }
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-gray-200/80 bg-white/90"
                >
                  <div className="space-y-2 px-2.5 py-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["RETARD", "EXCUSE"] as StatutPresence[]).map((s) => (
                        <motion.button
                          key={s}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onStatutChange(eleve.id, s)}
                          className={cn(
                            "min-h-10 rounded-lg text-xs font-semibold transition-colors duration-150",
                            statut === s
                              ? "bg-primary text-white"
                              : "border border-gray-200 bg-white text-gray-700 active:bg-gray-50"
                          )}
                          aria-pressed={statut === s}
                        >
                          {STATUT_LABELS[s]}
                        </motion.button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Commentaire (optionnel)"
                      value={commentaires[eleve.id] || ""}
                      onChange={(e) => onCommentChange(eleve.id, e.target.value)}
                      className="min-h-10 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={2}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </ul>
  );
}

export function AppelListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white md:hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex min-h-11 animate-pulse items-center gap-2 border-b border-gray-100 px-2.5 py-1 last:border-b-0"
        >
          <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
          <div className="h-3.5 flex-1 rounded bg-gray-200" />
          <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}
