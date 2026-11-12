"use client";

import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  APPEL_UI_LABELS,
  type AppelUiStatut,
  type StatutPresence,
} from "@/lib/constants/appel-ui";
import SearchInput from "@/components/ui/SearchInput";
import { TOUCH_CONTROL } from "@/lib/ui/touch-styles";

export type { StatutPresence } from "@/lib/constants/appel-ui";

type Eleve = {
  id: string;
  nom: string;
  prenom: string;
};

type AppelCompactListProps = {
  eleves: Eleve[];
  uiPresences: Record<string, AppelUiStatut>;
  commentaires: Record<string, string>;
  onSetPresence: (eleveId: string, statut: StatutPresence) => void;
  onCommentChange: (eleveId: string, value: string) => void;
};

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

const MAIN_STATUTS: StatutPresence[] = ["PRESENT", "ABSENT"];
const EXTRA_STATUTS: StatutPresence[] = ["RETARD", "EXCUSE"];

function PresenceToggle({
  statut,
  onSelect,
}: {
  statut: AppelUiStatut;
  onSelect: (s: StatutPresence) => void;
}) {
  const current: StatutPresence =
    statut === "EN_ATTENTE" ? "PRESENT" : statut;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div
        className="flex rounded-2xl border border-filet bg-sable/50 p-0.5"
        role="group"
        aria-label="Présence"
      >
        {MAIN_STATUTS.map((s) => {
          const selected = current === s;
          return (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(s);
              }}
              className={cn(
                "min-h-10 min-w-[4.5rem] rounded-xl px-2.5 text-xs font-bold transition-colors",
                selected && s === "PRESENT" && "bg-or text-nuit shadow-sm",
                selected && s === "ABSENT" && "bg-brun text-blanc shadow-sm",
                !selected && "text-brun-doux hover:bg-blanc/80"
              )}
              aria-pressed={selected}
            >
              {s === "PRESENT" ? "Présent" : "Absent"}
            </button>
          );
        })}
      </div>
      {(current === "RETARD" || current === "EXCUSE" || statut === "RETARD" || statut === "EXCUSE") && (
        <span className="text-[10px] font-semibold text-or">
          {APPEL_UI_LABELS[current]}
        </span>
      )}
      <div className="flex gap-1">
        {EXTRA_STATUTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(s);
            }}
            className={cn(
              "rounded-lg px-2 py-0.5 text-[10px] font-semibold",
              current === s
                ? "bg-or-clair text-nuit"
                : "text-brun-doux underline-offset-2 hover:underline"
            )}
          >
            {APPEL_UI_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AppelCompactList({
  eleves,
  uiPresences,
  commentaires,
  onSetPresence,
  onCommentChange,
}: AppelCompactListProps) {
  const [search, setSearch] = useState("");
  const [commentOpenId, setCommentOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eleves;
    return eleves.filter(
      (e) =>
        e.prenom.toLowerCase().includes(q) ||
        e.nom.toLowerCase().includes(q) ||
        `${e.prenom} ${e.nom}`.toLowerCase().includes(q)
    );
  }, [eleves, search]);

  const showSearch = eleves.length > 15;

  return (
    <div className="space-y-3">
      {showSearch && (
        <SearchInput
          placeholder="Rechercher un élève…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher un élève"
        />
      )}

      <ul className="overflow-hidden rounded-3xl border border-filet bg-blanc">
        {filtered.map((eleve) => {
          const statut = uiPresences[eleve.id] ?? "PRESENT";
          const commentOpen = commentOpenId === eleve.id;

          return (
            <li key={eleve.id} className="border-b border-filet last:border-b-0">
              <div className="flex min-h-14 items-center gap-3 px-3 py-2">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brun text-sm font-bold text-or-clair">
                  {initials(eleve.prenom, eleve.nom)}
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-brun">
                  {eleve.prenom} {eleve.nom}
                </span>
                <PresenceToggle
                  statut={statut}
                  onSelect={(s) => onSetPresence(eleve.id, s)}
                />
              </div>

              <div className="flex items-center gap-2 border-t border-filet/80 bg-sable/30 px-3 py-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCommentOpenId(commentOpen ? null : eleve.id)
                  }
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-brun-doux hover:bg-blanc"
                  aria-label={`Commentaire pour ${eleve.prenom} ${eleve.nom}`}
                  aria-expanded={commentOpen}
                >
                  <MessageSquare
                    className={cn(
                      "h-4 w-4",
                      commentaires[eleve.id]?.trim() && "text-or"
                    )}
                  />
                </button>
                {commentOpen && (
                  <input
                    type="text"
                    placeholder="Commentaire (optionnel)"
                    value={commentaires[eleve.id] || ""}
                    onChange={(e) => onCommentChange(eleve.id, e.target.value)}
                    className={cn(TOUCH_CONTROL, "min-h-11 flex-1 text-sm")}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AppelListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <ul className="overflow-hidden rounded-3xl border border-filet bg-blanc">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex min-h-14 animate-pulse items-center gap-3 border-b border-filet px-3 py-2 last:border-b-0"
        >
          <div className="h-11 w-11 shrink-0 rounded-full bg-sable" />
          <div className="h-3.5 flex-1 rounded bg-sable" />
          <div className="h-9 w-28 shrink-0 rounded-2xl bg-sable" />
        </li>
      ))}
    </ul>
  );
}
