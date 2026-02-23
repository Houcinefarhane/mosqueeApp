"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FileText, MessageSquare, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
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
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<NoteSession | null>(null);

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
        if (dateDebut) params.append("dateDebut", dateDebut);
        if (dateFin) params.append("dateFin", dateFin);

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
  }, [selectedClasseId, matiere, dateDebut, dateFin]);

  const getMoyenne = (session: NoteSession) => {
    if (session.notes.length === 0) return 0;
    const somme = session.notes.reduce((acc, note) => acc + note.valeur, 0);
    return (somme / session.notes.length).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historique des notes</h1>
          <p className="text-gray-600 mt-2">Consultez l&apos;historique de toutes vos sessions de notes</p>
        </div>
        <Link href="/professeur/notes">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux notes
          </Button>
        </Link>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Classe
              </label>
              <select
                value={selectedClasseId}
                onChange={(e) => setSelectedClasseId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Matière
              </label>
              <input
                type="text"
                value={matiere}
                onChange={(e) => setMatiere(e.target.value)}
                placeholder="Ex: Coran, Arabe..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date début
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date fin
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
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
                          {session.notes.map((note) => {
                            const pourcentage = (note.valeur / note.noteMax) * 100;
                            const couleur = pourcentage >= 80 ? "text-green-600" : pourcentage >= 60 ? "text-yellow-600" : "text-red-600";

                            return (
                              <div
                                key={note.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <span className="font-medium">
                                    {note.eleve.prenom} {note.eleve.nom}
                                  </span>
                                  {note.commentaire && (
                                    <p className="text-xs text-gray-500 italic mt-1">
                                      {note.commentaire}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className={`font-bold ${couleur}`}>
                                    {note.valeur} / {note.noteMax}
                                  </span>
                                  <span className="text-xs text-gray-500 block">
                                    ({pourcentage.toFixed(0)}%)
                                  </span>
                                </div>
                              </div>
                            );
                          })}
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
