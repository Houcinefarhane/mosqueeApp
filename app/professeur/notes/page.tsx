"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface NoteEleve {
  valeur: string;
  commentaire: string;
}

export default function NotesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [eleves, setEleves] = useState<any[]>([]);
  const [matiere, setMatiere] = useState("");
  const [noteMax, setNoteMax] = useState("20");
  const [commentaireSeance, setCommentaireSeance] = useState("");
  const [notesParEleve, setNotesParEleve] = useState<Record<string, NoteEleve>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
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
      const fetchEleves = async () => {
        try {
          const response = await fetch(
            `/api/professeur/classes/${selectedClasseId}/eleves`
          );
          const data = await response.json();
          setEleves(data);

          // Initialiser les notes à vide
          const initial: Record<string, NoteEleve> = {};
          data.forEach((eleve: any) => {
            initial[eleve.id] = { valeur: "", commentaire: "" };
          });
          setNotesParEleve(initial);
        } catch (err) {
          console.error(err);
          setError("Erreur lors du chargement des élèves");
        }
      };

      fetchEleves();
    } else {
      setEleves([]);
      setNotesParEleve({});
    }
  }, [selectedClasseId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Réinitialiser les valeurs
      setNotesParEleve((prev) =>
        Object.fromEntries(
          Object.keys(prev).map((id) => [id, { valeur: "", commentaire: "" }])
        )
      );
      setMatiere("");
      setNoteMax("20");
      setCommentaireSeance("");
      alert("Notes enregistrées avec succès !");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de l'enregistrement des notes");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ajouter des notes</h1>
        <p className="text-gray-600 mt-2">
          Saisissez les notes de toute la classe en une seule fois
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Nouvelle série de notes</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Classe
                </label>
                <select
                  value={selectedClasseId}
                  onChange={(e) => setSelectedClasseId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
              />
              <Input
                label="Note max"
                type="number"
                step="0.1"
                min="0"
                value={noteMax}
                onChange={(e) => setNoteMax(e.target.value)}
                required
              />
            </div>

            {eleves.length > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Commentaire de la séance (optionnel)
                  </label>
                  <textarea
                    value={commentaireSeance}
                    onChange={(e) => setCommentaireSeance(e.target.value)}
                    placeholder="Ajoutez un commentaire général sur la séance de notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    rows={3}
                  />
                </div>
              </>
            )}

            {eleves.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {eleves.length} élève(s) dans cette classe
                  </p>
                  <p className="text-xs text-gray-500">
                    Laissez vide la note d'un élève si vous ne voulez pas la
                    saisir maintenant
                  </p>
                </div>

                <div className="space-y-3">
                  {eleves.map((eleve) => {
                    const note = notesParEleve[eleve.id] || {
                      valeur: "",
                      commentaire: "",
                    };

                    return (
                      <motion.div
                        key={eleve.id}
                        className="p-4 border border-gray-200 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4"
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
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            label="Note"
                            type="number"
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
                          />
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-600 bg-red-50 p-3 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full md:w-auto"
            >
              Enregistrer les notes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
