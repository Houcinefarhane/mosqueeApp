"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/layout/PageHeader";
import { HeaderOutlineLink } from "@/components/layout/HeaderActions";
import { History } from "lucide-react";
import NotesCompactList, {
  NotesListSkeleton,
} from "@/components/professeur/NotesCompactList";
import {
  TOUCH_FIELD,
  TOUCH_NUMERIC_COMPACT,
} from "@/lib/ui/touch-styles";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface NoteEleve {
  valeur: string;
  commentaire: string;
}

interface Classe {
  id: string;
  nom: string;
  niveau: string;
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  classe?: { nom: string };
}

function NotesPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse space-y-2 rounded-xl border border-gray-200 p-4">
        <div className="h-6 w-44 rounded bg-gray-200" />
        <div className="h-4 w-64 rounded bg-gray-100" />
      </div>
      <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
      <NotesListSkeleton rows={8} />
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<NotesPageSkeleton />}>
      <NotesPageContent />
    </Suspense>
  );
}

function NotesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classeIdFromUrl = searchParams.get("classeId") ?? "";
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState(classeIdFromUrl);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [matiere, setMatiere] = useState("");
  const [noteMax, setNoteMax] = useState("20");
  const [commentaireSeance, setCommentaireSeance] = useState("");
  const [notesParEleve, setNotesParEleve] = useState<Record<string, NoteEleve>>(
    {}
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showCommentaireSeance, setShowCommentaireSeance] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingEleves, setIsLoadingEleves] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/professeur/classes");
        const data = await response.json();
        setClasses(data);
        if (classeIdFromUrl && data.some((c: Classe) => c.id === classeIdFromUrl)) {
          setSelectedClasseId(classeIdFromUrl);
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger vos classes.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchClasses();
  }, [classeIdFromUrl]);

  useEffect(() => {
    if (selectedClasseId) {
      setIsLoadingEleves(true);
      setError("");
      const fetchEleves = async () => {
        try {
          const response = await fetch(
            `/api/professeur/classes/${selectedClasseId}/eleves`
          );
          const data = await response.json();
          setEleves(data);

          const initial: Record<string, NoteEleve> = {};
          data.forEach((eleve: Eleve) => {
            initial[eleve.id] = { valeur: "", commentaire: "" };
          });
          setNotesParEleve(initial);
          setExpandedIds(new Set());
        } catch (err) {
          console.error(err);
          setError("Impossible de charger la liste des élèves.");
        } finally {
          setIsLoadingEleves(false);
        }
      };

      fetchEleves();
    } else {
      setEleves([]);
      setNotesParEleve({});
      setIsLoadingEleves(false);
    }
  }, [selectedClasseId]);

  const notesSaisies = Object.values(notesParEleve).filter(
    (n) => n.valeur.trim() !== ""
  ).length;

  const selectedClasse = classes.find((c) => c.id === selectedClasseId);

  const handleNoteChange = (
    eleveId: string,
    field: keyof NoteEleve,
    value: string
  ) => {
    setNotesParEleve((prev) => ({
      ...prev,
      [eleveId]: {
        ...prev[eleveId],
        [field]: value,
      },
    }));
  };

  const handleToggleExpand = (eleveId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eleveId)) next.delete(eleveId);
      else next.add(eleveId);
      return next;
    });
  };

  const submitNotes = async () => {
    setError("");

    if (!selectedClasseId) {
      setError("Veuillez sélectionner une classe");
      return;
    }

    if (!matiere.trim()) {
      setError("Veuillez saisir la matière");
      return;
    }

    const notesPayload = Object.entries(notesParEleve)
      .filter(([_, valeur]) => valeur.valeur.trim() !== "")
      .map(([eleveId, valeur]) => ({
        eleveId,
        valeur: parseFloat(valeur.valeur),
        commentaire: valeur.commentaire || null,
      }));

    if (notesPayload.length === 0) {
      setError("Veuillez saisir au moins une note");
      return;
    }

    const noteMaxNumber = parseFloat(noteMax);
    if (isNaN(noteMaxNumber) || noteMaxNumber <= 0) {
      setError("La note maximale doit être un nombre positif");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/professeur/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classeId: selectedClasseId,
          matiere: matiere.trim(),
          noteMax: noteMaxNumber,
          commentaireSeance: commentaireSeance || null,
          notes: notesPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      router.push("/professeur/notes/historique");
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement des notes"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <NotesPageSkeleton />;
  }

  const showList = eleves.length > 0 && !isLoadingEleves;

  return (
    <div
      className={cn(
        "space-y-3 sm:space-y-6",
        showList && "pb-24 md:pb-0"
      )}
    >
      <PageHeader
        title="Ajouter des notes"
        description={
          selectedClasse && matiere
            ? `${matiere} · ${selectedClasse.nom} · sur ${noteMax}`
            : selectedClasse
              ? `${selectedClasse.nom} · saisie rapide`
              : "Saisissez les notes de la classe"
        }
        breadcrumbs={[
          { label: "Espace professeur", href: "/professeur" },
          { label: "Notes" },
        ]}
        action={
          <HeaderOutlineLink href="/professeur/notes/historique" icon={History}>
            Historique
          </HeaderOutlineLink>
        }
      />

      <Card variant="elevated">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-sm sm:text-lg">Paramètres</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitNotes();
            }}
            className="space-y-3"
          >
            <div className="space-y-2.5 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm sm:text-gray-700">
                  Classe
                </label>
                <select
                  value={selectedClasseId}
                  onChange={(e) => setSelectedClasseId(e.target.value)}
                  className={TOUCH_FIELD}
                >
                  <option value="">Sélectionnez une classe</option>
                  {classes.map((classe) => (
                    <option key={classe.id} value={classe.id}>
                      {classe.nom} - {classe.niveau}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 md:contents">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm sm:text-gray-700">
                    Matière
                  </label>
                  <input
                    type="text"
                    value={matiere}
                    onChange={(e) => setMatiere(e.target.value)}
                    required
                    placeholder="Coran, Arabe…"
                    autoCapitalize="words"
                    className={TOUCH_FIELD}
                  />
                </div>
                <div className="shrink-0 md:min-w-0">
                  <label className="mb-1 block text-xs font-medium text-gray-600 sm:text-sm sm:text-gray-700">
                    / max
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={noteMax}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".");
                      if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
                        setNoteMax(raw);
                      }
                    }}
                    required
                    aria-label="Note maximale"
                    className={cn(TOUCH_NUMERIC_COMPACT, "md:w-full")}
                  />
                </div>
              </div>
            </div>

            {!selectedClasseId && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 text-center md:hidden">
                <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">
                  Sélectionnez une classe pour afficher la liste
                </p>
              </div>
            )}

            {selectedClasseId && isLoadingEleves && (
              <NotesListSkeleton rows={12} />
            )}

            {selectedClasseId && !isLoadingEleves && eleves.length === 0 && (
              <div className="rounded-xl border border-gray-200 px-4 py-8 text-center">
                <p className="font-medium text-foreground">Aucun élève dans cette classe</p>
                <p className="mt-1 text-sm text-gray-500">
                  Vérifiez l&apos;affectation dans l&apos;administration.
                </p>
              </div>
            )}

            {showList && (
              <>
                <p className="text-[11px] text-gray-500 md:hidden">
                  {notesSaisies}/{eleves.length} notes · vide = ignoré
                </p>

                <NotesCompactList
                  eleves={eleves}
                  notesParEleve={notesParEleve}
                  noteMax={noteMax}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                  onNoteChange={handleNoteChange}
                />

                <div className="md:hidden">
                  <button
                    type="button"
                    onClick={() => setShowCommentaireSeance((v) => !v)}
                    className="flex min-h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-foreground"
                  >
                    Commentaire de séance (optionnel)
                    <span className="text-gray-400">
                      {showCommentaireSeance ? "▲" : "▼"}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {showCommentaireSeance && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <textarea
                          value={commentaireSeance}
                          onChange={(e) => setCommentaireSeance(e.target.value)}
                          placeholder="Commentaire général sur la séance"
                          className="mt-2 min-h-10 w-full rounded-lg border border-gray-300 px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={3}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Desktop */}
                <div className="hidden space-y-4 md:block">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Commentaire de la séance (optionnel)
                    </label>
                    <textarea
                      value={commentaireSeance}
                      onChange={(e) => setCommentaireSeance(e.target.value)}
                      placeholder="Commentaire général sur la séance"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                  </div>

                  <p className="text-sm text-gray-600">
                    {eleves.length} élève(s) · {notesSaisies} note(s) saisie
                    {notesSaisies !== 1 ? "s" : ""}
                  </p>

                  <div className="space-y-3">
                    {eleves.map((eleve) => {
                      const note = notesParEleve[eleve.id] || {
                        valeur: "",
                        commentaire: "",
                      };

                      return (
                        <motion.div
                          key={eleve.id}
                          className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-start"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="min-w-[10rem] shrink-0">
                            <p className="font-semibold">
                              {eleve.prenom} {eleve.nom}
                            </p>
                            {eleve.classe && (
                              <p className="text-sm text-gray-600">
                                {eleve.classe.nom}
                              </p>
                            )}
                          </div>
                          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                            <Input
                              label={`Note / ${noteMax}`}
                              type="text"
                              inputMode="decimal"
                              value={note.valeur}
                              onChange={(e) => {
                                const raw = e.target.value.replace(",", ".");
                                if (
                                  raw === "" ||
                                  /^[0-9]*\.?[0-9]*$/.test(raw)
                                ) {
                                  handleNoteChange(eleve.id, "valeur", raw);
                                }
                              }}
                              className="min-h-11 text-base"
                            />
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">
                                Commentaire (optionnel)
                              </label>
                              <textarea
                                value={note.commentaire}
                                onChange={(e) =>
                                  handleNoteChange(
                                    eleve.id,
                                    "commentaire",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={2}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {error && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  <Button type="submit" isLoading={isLoading} size="lg">
                    Enregistrer les notes
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {showList && (
        <div
          className="fixed inset-x-0 z-40 border-t border-gray-200 bg-surface/95 px-3 py-2 backdrop-blur-md md:hidden"
          style={{
            bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="mb-1.5 text-center text-[11px] tabular-nums text-gray-500">
            {notesSaisies}/{eleves.length}
            {matiere ? ` · ${matiere}` : ""}
          </p>
          <Button
            type="button"
            onClick={submitNotes}
            isLoading={isLoading}
            size="touch"
            className="w-full font-semibold"
          >
            Enregistrer les notes
          </Button>
        </div>
      )}
    </div>
  );
}
