"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import NotesCompactList from "@/components/professeur/NotesCompactList";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface NoteEleve {
  valeur: string;
  commentaire: string;
}

const TOUCH_FIELD =
  "min-h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

export default function NotesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [eleves, setEleves] = useState<any[]>([]);
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
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des classes");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClasseId) {
      setIsLoadingEleves(true);
      const fetchEleves = async () => {
        try {
          const response = await fetch(
            `/api/professeur/classes/${selectedClasseId}/eleves`
          );
          const data = await response.json();
          setEleves(data);

          const initial: Record<string, NoteEleve> = {};
          data.forEach((eleve: any) => {
            initial[eleve.id] = { valeur: "", commentaire: "" };
          });
          setNotesParEleve(initial);
          setExpandedIds(new Set());
        } catch (err) {
          console.error(err);
          setError("Erreur lors du chargement des élèves");
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

    if (!matiere) {
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
          matiere,
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
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const showList = eleves.length > 0 && !isLoadingEleves;

  return (
    <div
      className={cn(
        "space-y-4 sm:space-y-6",
        showList && "pb-28 md:pb-0"
      )}
    >
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Ajouter des notes
        </h1>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Saisissez les notes de toute la classe en une seule fois
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">
            Nouvelle série de notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitNotes();
            }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
              <Input
                label="Matière"
                value={matiere}
                onChange={(e) => setMatiere(e.target.value)}
                required
                placeholder="Ex: Coran, Arabe, Fiqh..."
                className="min-h-11 text-base"
              />
              <Input
                label="Note max"
                type="number"
                inputMode="numeric"
                step="0.1"
                min="0"
                value={noteMax}
                onChange={(e) => setNoteMax(e.target.value)}
                required
                className="min-h-11 text-base"
              />
            </div>

            {isLoadingEleves && <ListSkeleton rows={8} />}

            {showList && (
              <>
                <div className="md:hidden">
                  <p className="text-sm text-gray-600">
                    {eleves.length} élève(s) · {notesSaisies} note(s) saisie(s)
                  </p>
                  <p className="text-xs text-gray-500">
                    Laissez vide si pas de note
                  </p>
                </div>

                <NotesCompactList
                  eleves={eleves}
                  notesParEleve={notesParEleve}
                  noteMax={noteMax}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                  onNoteChange={handleNoteChange}
                />

                <Card variant="elevated" className="md:hidden">
                  <button
                    type="button"
                    onClick={() => setShowCommentaireSeance((v) => !v)}
                    className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
                  >
                    Commentaire de séance (optionnel)
                    <span className="text-gray-400">
                      {showCommentaireSeance ? "▲" : "▼"}
                    </span>
                  </button>
                  {showCommentaireSeance && (
                    <CardContent className="border-t border-gray-100 pt-0">
                      <textarea
                        value={commentaireSeance}
                        onChange={(e) => setCommentaireSeance(e.target.value)}
                        placeholder="Commentaire général sur la séance"
                        className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                      />
                    </CardContent>
                  )}
                </Card>

                <div className="hidden md:block space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Commentaire de la séance (optionnel)
                    </label>
                    <textarea
                      value={commentaireSeance}
                      onChange={(e) => setCommentaireSeance(e.target.value)}
                      placeholder="Ajoutez un commentaire général sur la séance de notes"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-sm text-gray-600">
                      {eleves.length} élève(s) dans cette classe
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
                            className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div>
                              <p className="font-semibold">
                                {eleve.prenom} {eleve.nom}
                              </p>
                              {eleve.classe && (
                                <p className="text-sm text-gray-600">
                                  {eleve.classe.nom}
                                </p>
                              )}
                            </div>
                            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                              <Input
                                label="Note"
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                min="0"
                                value={note.valeur}
                                onChange={(e) =>
                                  handleNoteChange(
                                    eleve.id,
                                    "valeur",
                                    e.target.value
                                  )
                                }
                                className="min-h-11 text-base"
                              />
                              <div className="md:col-span-2">
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
                  </div>

                  {error && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    size="lg"
                    className="min-h-11"
                  >
                    Enregistrer les notes
                  </Button>
                </div>
              </>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-red-50 p-3 text-sm text-red-600 md:hidden"
              >
                {error}
              </motion.p>
            )}
          </form>
        </CardContent>
      </Card>

      {showList && (
        <div
          className="fixed inset-x-0 z-40 border-t border-gray-200 bg-surface/95 p-3 backdrop-blur-md md:hidden"
          style={{
            bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <p className="mb-2 text-center text-xs text-gray-600">
            {notesSaisies} note{notesSaisies > 1 ? "s" : ""} saisie
            {notesSaisies !== 1 ? "s" : ""} sur {eleves.length}
          </p>
          <Button
            type="button"
            onClick={submitNotes}
            isLoading={isLoading}
            size="touch"
            className="w-full"
          >
            Enregistrer les notes
          </Button>
        </div>
      )}
    </div>
  );
}
