"use client";

import { cn } from "@/lib/utils";
import { TOUCH_TARGET } from "@/lib/ui/touch-styles";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

type Eleve = {
  id: string;
  nom: string;
  prenom: string;
};

type NoteEleve = {
  valeur: string;
  commentaire: string;
};

type NotesCompactListProps = {
  eleves: Eleve[];
  notesParEleve: Record<string, NoteEleve>;
  noteMax: string;
  expandedIds: Set<string>;
  onToggleExpand: (eleveId: string) => void;
  onNoteChange: (eleveId: string, field: keyof NoteEleve, value: string) => void;
};

export default function NotesCompactList({
  eleves,
  notesParEleve,
  noteMax,
  expandedIds,
  onToggleExpand,
  onNoteChange,
}: NotesCompactListProps) {
  return (
    <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white md:hidden">
      {eleves.map((eleve, index) => {
        const note = notesParEleve[eleve.id] || { valeur: "", commentaire: "" };
        const expanded = expandedIds.has(eleve.id);
        const hasNote = note.valeur.trim() !== "";

        return (
          <motion.li
            key={eleve.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, delay: Math.min(index * 0.01, 0.2) }}
            className={cn(
              "border-b border-gray-100 last:border-b-0",
              hasNote ? "bg-primary/[0.04]" : "bg-white"
            )}
          >
            <div className="flex min-h-11 items-stretch">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1">
                <p className="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-foreground">
                  {eleve.prenom} {eleve.nom}
                </p>

                <div className="relative shrink-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    autoComplete="off"
                    value={note.valeur}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".");
                      if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
                        onNoteChange(eleve.id, "valeur", raw);
                      }
                    }}
                    placeholder="—"
                    aria-label={`Note de ${eleve.prenom} ${eleve.nom} sur ${noteMax}`}
                    className={cn(
                      "min-h-10 w-[3.75rem] rounded-lg border py-1.5 pl-1.5 pr-6 text-center text-base font-semibold tabular-nums transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary",
                      hasNote
                        ? "border-primary/40 bg-white text-primary-dark"
                        : "border-gray-300 bg-gray-50/80 text-foreground"
                    )}
                  />
                  <span
                    className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400"
                    aria-hidden
                  >
                    /{noteMax}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleExpand(eleve.id)}
                className={cn(
                  TOUCH_TARGET,
                  "w-10 min-w-10 shrink-0 text-gray-400 active:bg-black/5",
                  note.commentaire.trim() && !expanded && "text-primary"
                )}
                aria-label={
                  expanded
                    ? `Masquer le commentaire pour ${eleve.prenom} ${eleve.nom}`
                    : `Commentaire pour ${eleve.prenom} ${eleve.nom}`
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
                  <div className="px-2.5 py-2">
                    <textarea
                      placeholder="Commentaire (optionnel)"
                      value={note.commentaire}
                      onChange={(e) =>
                        onNoteChange(eleve.id, "commentaire", e.target.value)
                      }
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

export function NotesListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white md:hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex min-h-11 animate-pulse items-center gap-2 border-b border-gray-100 px-2.5 py-1 last:border-b-0"
        >
          <div className="h-3.5 flex-1 rounded bg-gray-200" />
          <div className="h-10 w-[3.75rem] shrink-0 rounded-lg bg-gray-200" />
          <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}
