"use client";

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
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white md:hidden">
      {eleves.map((eleve) => {
        const note = notesParEleve[eleve.id] || { valeur: "", commentaire: "" };
        const expanded = expandedIds.has(eleve.id);

        return (
          <li key={eleve.id}>
            <div className="flex items-stretch gap-1 p-2">
              <button
                type="button"
                onClick={() => onToggleExpand(eleve.id)}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-gray-400 active:bg-gray-100"
                aria-label={
                  expanded
                    ? `Masquer le commentaire pour ${eleve.prenom} ${eleve.nom}`
                    : `Commentaire pour ${eleve.prenom} ${eleve.nom}`
                }
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              <div className="flex min-h-11 min-w-0 flex-1 items-center px-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {eleve.prenom} {eleve.nom}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max={noteMax || undefined}
                  value={note.valeur}
                  onChange={(e) => onNoteChange(eleve.id, "valeur", e.target.value)}
                  placeholder="—"
                  aria-label={`Note de ${eleve.prenom} ${eleve.nom}`}
                  className="min-h-11 w-16 rounded-lg border border-gray-300 px-2 text-center text-base focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="pr-1 text-xs text-gray-500">/{noteMax}</span>
              </div>
            </div>

            {expanded && (
              <div className="border-t border-gray-100 bg-gray-50/80 px-3 pb-3 pt-2">
                <textarea
                  placeholder="Commentaire (optionnel)"
                  value={note.commentaire}
                  onChange={(e) =>
                    onNoteChange(eleve.id, "commentaire", e.target.value)
                  }
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
