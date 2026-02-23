"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

type StatutPresence = "PRESENT" | "ABSENT" | "RETARD" | "EXCUSE";

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  classe: {
    id: string;
    nom: string;
  };
}

export default function AppelPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [presences, setPresences] = useState<Record<string, StatutPresence>>({});
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [commentaireSeance, setCommentaireSeance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/professeur/classes");
        const data = await response.json();
        setClasses(data);
      } catch (err) {
        console.error(err);
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
          // Initialiser toutes les présences à "PRESENT" par défaut
          const initialPresences: Record<string, StatutPresence> = {};
          data.forEach((eleve: Eleve) => {
            initialPresences[eleve.id] = "PRESENT";
          });
          setPresences(initialPresences);
        } catch (err) {
          console.error(err);
        }
      };

      fetchEleves();
    } else {
      setEleves([]);
      setPresences({});
    }
  }, [selectedClasseId]);

  const handleStatutChange = (eleveId: string, statut: StatutPresence) => {
    setPresences({ ...presences, [eleveId]: statut });
  };

  const handleAbsentToggle = (eleveId: string, checked: boolean) => {
    setPresences({ ...presences, [eleveId]: checked ? "ABSENT" : "PRESENT" });
  };

  const handleSubmit = async () => {
    if (!selectedClasseId || eleves.length === 0) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/professeur/presences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classeId: selectedClasseId,
          date,
          commentaireSeance: commentaireSeance || null,
          presences: eleves.map((eleve) => ({
            eleveId: eleve.id,
            statut: presences[eleve.id] || "PRESENT",
            commentaire: commentaires[eleve.id] || null,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      router.push("/professeur");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur lors de l'enregistrement de l'appel");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const statutIcons = {
    PRESENT: CheckCircle,
    ABSENT: XCircle,
    RETARD: Clock,
    EXCUSE: AlertCircle,
  };

  const statutColors = {
    PRESENT: "text-green-600 bg-green-50",
    ABSENT: "text-red-600 bg-red-50",
    RETARD: "text-yellow-600 bg-yellow-50",
    EXCUSE: "text-blue-600 bg-blue-50",
  };

  const statutLabels = {
    PRESENT: "Présent",
    ABSENT: "Absent",
    RETARD: "Retard",
    EXCUSE: "Excusé",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Faire l'appel</h1>
        <p className="text-gray-600 mt-2">Marquez les présences des élèves</p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Paramètres de l'appel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            </div>
          </CardContent>
        </Card>

      {eleves.length > 0 && (
        <>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Commentaire de la séance</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="Ajoutez un commentaire général sur la séance (optionnel)"
                value={commentaireSeance}
                onChange={(e) => setCommentaireSeance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                rows={3}
              />
            </CardContent>
          </Card>
        </>
      )}

      {eleves.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Liste des élèves ({eleves.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eleves.map((eleve) => {
                const statut = presences[eleve.id] || "PRESENT";
                const Icon = statutIcons[statut];

                return (
                  <motion.div
                    key={eleve.id}
                    className="p-4 border border-gray-200 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${statutColors[statut]}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {eleve.prenom} {eleve.nom}
                          </p>
                          <p className="text-sm text-gray-600">{eleve.classe.nom}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id={`absent-${eleve.id}`}
                          type="checkbox"
                          checked={statut === "ABSENT"}
                          onChange={(e) =>
                            handleAbsentToggle(eleve.id, e.target.checked)
                          }
                          className="h-4 w-4 text-red-600 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`absent-${eleve.id}`}
                          className="text-sm text-gray-700"
                        >
                          Absent
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      {(
                        Object.keys(statutIcons) as StatutPresence[]
                      ).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleStatutChange(eleve.id, s)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            statut === s
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {statutLabels[s]}
                        </button>
                      ))}
                    </div>

                    <textarea
                      placeholder="Commentaire (optionnel)"
                      value={commentaires[eleve.id] || ""}
                      onChange={(e) =>
                        setCommentaires({
                          ...commentaires,
                          [eleve.id]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      rows={2}
                    />
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSubmit} isLoading={isLoading}>
                Enregistrer l'appel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClasseId && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">
              Sélectionnez une classe pour commencer l'appel
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
