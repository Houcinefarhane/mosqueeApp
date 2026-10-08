"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  APPEL_UI_LABELS,
  type AppelUiStatut,
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
  onTogglePresence: (eleveId: string) => void;
  onCommentChange: (eleveId: string, value: string) => void;
  /** Id élève en flash animation */
  pulseId?: string | null;
};

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function StatusPill({ statut }: { statut: AppelUiStatut }) {
  const styles: Record<AppelUiStatut, string> = {
    EN_ATTENTE: "bg-sable text-brun-doux border border-filet",
    PRESENT: "bg-or text-nuit",
    ABSENT: "bg-brun text-blanc",
    RETARD: "bg-or-clair text-nuit",
    EXCUSE: "bg-brun-doux text-blanc",
  };

  return (
    <span
      className={cn(
        "inline-flex min-w-[5.5rem] items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold",
        styles[statut]
      )}
    >
      {APPEL_UI_LABELS[statut]}
    </span>
  );
}

export default function AppelCompactList({
  eleves,
  uiPresences,
  commentaires,
  onTogglePresence,
  onCommentChange,
  pulseId,
}: AppelCompactListProps) {
  const reduceMotion = useReducedMotion();
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
          const statut = uiPresences[eleve.id] ?? "EN_ATTENTE";
          const isPulsing = pulseId === eleve.id;
          const commentOpen = commentOpenId === eleve.id;

          return (
            <li
              key={eleve.id}
              className={cn(
                "border-b border-filet last:border-b-0",
                isPulsing && !reduceMotion && "bg-or/10"
              )}
            >
              <button
                type="button"
                onClick={() => {
                  onTogglePresence(eleve.id);
                  if (typeof navigator !== "undefined" && navigator.vibrate) {
                    navigator.vibrate(10);
                  }
                }}
                className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left active:bg-sable/80"
              >
                <motion.span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brun text-sm font-bold text-or-clair"
                  animate={
                    isPulsing && !reduceMotion
                      ? { scale: [1, 1.15, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.3 }}
                >
                  {initials(eleve.prenom, eleve.nom)}
                </motion.span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brun">
                  {eleve.prenom} {eleve.nom}
                </span>
                <StatusPill statut={statut} />
              </button>

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
          <div className="h-7 w-20 shrink-0 rounded-full bg-sable" />
        </li>
      ))}
    </ul>
  );
}
