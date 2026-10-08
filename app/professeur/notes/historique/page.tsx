"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import PageHeader from "@/components/layout/PageHeader";
import { FileText, MessageSquare, TrendingUp } from "lucide-react";
import { NOTE_SCORE_INLINE_CLASS } from "@/lib/ui/note-score";
import { format } from "date-fns";
import { ListSkeleton } from "@/components/ui/Skeleton";
import HistoriqueDeleteButton from "@/components/professeur/HistoriqueDeleteButton";
import toast from "react-hot-toast";
import { fr } from "date-fns/locale/fr";

interface NoteSession {
  id: string;
  date: string;
  matiere: string;
  noteMax: number;
  commentaireSeance: string | null;
  classe: {
    id: string;
    nom: string;
    niveau: string;
  };
  notes: Array<{
    id: string;
    valeur: number;
    noteMax: number;
    commentaire: string | null;
    eleve: {
      id: string;
      nom: string;
      prenom: string;
    };
  }>;
  _count: {
    notes: number;
  };
}

export default function HistoriqueNotesPage() {
  const [sessions, setSessions] = useState<NoteSession[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [matiere, setMatiere] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<NoteSession | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/professeur/classes");
        const data = await response.json();
        setClasses(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedClasseId) params.append("classeId", selectedClasseId);
        if (matiere) params.append("matiere", matiere);

        const response = await fetch(`/api/professeur/notes-sessions?${params.toString()}`);
        
        if (!response.ok) {
          console.error("Erreur API:", response.status);
          setSessions([]);
          return;
        }
        
        const data = await response.json();
        if (Array.isArray(data)) {
          setSessions(data);
        } else {
          console.error("Les données ne sont pas un tableau:", data);
          setSessions([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [selectedClasseId, matiere]);

  const handleDeleteSession = async (session: NoteSession) => {
    const dateLabel = format(new Date(session.date), "d MMMM yyyy", { locale: fr });
    if (
      !confirm(
        `Supprimer la session ${session.matiere} du ${dateLabel} (${session.classe.nom}) ? Toutes les notes de cette séance seront effacées.`
      )
    ) {
      return;
    }

    setDeletingId(session.id);
    try {
      const response = await fetch(
        `/api/professeur/notes-sessions/${session.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Suppression impossible");
      }
      toast.success("Session de notes supprimée");
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      if (selectedSession?.id === session.id) setSelectedSession(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getMoyenne = (session: NoteSession) => {
    if (session.notes.length === 0) return 0;
    const somme = session.notes.reduce((acc, note) => acc + note.valeur, 0);
    return (somme / session.notes.length).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique des notes"
        description="Consultez l'historique de toutes vos sessions de notes"
        back={{ href: "/professeur/notes", label: "Retour aux notes" }}
      />

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Classe
              </label>
              <select
                value={selectedClasseId}
                onChange={(e) => setSelectedClasseId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Toutes les classes</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom} - {classe.niveau}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Matière
              </label>
              <input
                type="text"
                value={matiere}
                onChange={(e) => setMatiere(e.target.value)}
                placeholder="Ex: Coran, Arabe..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : sessions.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Aucune session de notes trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const moyenne = getMoyenne(session);
            const Icon = FileText;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  variant="elevated"
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {session.matiere} - {session.classe.nom} ({session.classe.niveau})
                            </h3>
                            <p className="text-sm text-gray-600">
                              {format(new Date(session.date), "EEEE d MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        </div>

                        {session.commentaireSeance && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700">{session.commentaireSeance}</p>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-sm text-gray-600">
                              Moyenne: <span className="font-semibold">{moyenne}</span> / {session.noteMax}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {session._count.notes} note{session._count.notes > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <HistoriqueDeleteButton
                        label={`Supprimer la session ${session.matiere}`}
                        disabled={deletingId === session.id}
                        onDelete={() => handleDeleteSession(session)}
                      />
                    </div>

                    {selectedSession?.id === session.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <h4 className="font-semibold mb-3">Détails des notes</h4>
                        <div className="space-y-2">
                          {session.notes.map((note) => (
                              <div
                                key={note.id}
                                className="flex items-center justify-between rounded-2xl bg-sable p-3"
                              >
                                <div className="flex-1">
                                  <span className="font-medium">
                                    {note.eleve.prenom} {note.eleve.nom}
                                  </span>
                                  {note.commentaire && (
                                    <p className="text-xs italic text-brun-doux mt-1">
                                      {note.commentaire}
                                    </p>
                                  )}
                                </div>
                                <span className={NOTE_SCORE_INLINE_CLASS}>
                                  {note.valeur} / {note.noteMax}
                                </span>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
