"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Calendar, Users, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

interface Appel {
  id: string;
  date: string;
  commentaireSeance: string | null;
  classe: {
    id: string;
    nom: string;
    niveau: string;
  };
  presences: Array<{
    id: string;
    statut: string;
    commentaire: string | null;
    eleve: {
      id: string;
      nom: string;
      prenom: string;
    };
  }>;
  _count: {
    presences: number;
  };
}

export default function HistoriqueAppelPage() {
  const [appels, setAppels] = useState<Appel[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppel, setSelectedAppel] = useState<Appel | null>(null);

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
    const fetchAppels = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedClasseId) params.append("classeId", selectedClasseId);
        if (dateDebut) params.append("dateDebut", dateDebut);
        if (dateFin) params.append("dateFin", dateFin);

        const response = await fetch(`/api/professeur/appels?${params.toString()}`);
        
        if (!response.ok) {
          console.error("Erreur API:", response.status);
          setAppels([]);
          return;
        }
        
        const data = await response.json();
        // S'assurer que data est un tableau
        if (Array.isArray(data)) {
          console.log("Appels reçus:", data.length, data);
          setAppels(data);
        } else {
          console.error("Les données ne sont pas un tableau:", data);
          setAppels([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppels();
  }, [selectedClasseId, dateDebut, dateFin]);

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

  const getStatutCount = (appel: Appel) => {
    const counts = {
      PRESENT: 0,
      ABSENT: 0,
      RETARD: 0,
      EXCUSE: 0,
    };

    appel.presences.forEach((p) => {
      counts[p.statut as keyof typeof counts]++;
    });

    return counts;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historique des appels</h1>
          <p className="text-gray-600 mt-2">Consultez l&apos;historique de tous vos appels</p>
        </div>
        <Link href="/professeur/appel">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l&apos;appel
          </Button>
        </Link>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      ) : appels.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Aucun appel trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appels.map((appel) => {
            const counts = getStatutCount(appel);
            const Icon = Calendar;

            return (
              <motion.div
                key={appel.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  variant="elevated"
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedAppel(selectedAppel?.id === appel.id ? null : appel)}
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
                              {appel.classe.nom} - {appel.classe.niveau}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {format(new Date(appel.date), "EEEE d MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        </div>

                        {appel.commentaireSeance && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700">{appel.commentaireSeance}</p>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">
                              {counts.PRESENT} présent{counts.PRESENT > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-gray-600">
                              {counts.ABSENT} absent{counts.ABSENT > 1 ? "s" : ""}
                            </span>
                          </div>
                          {counts.RETARD > 0 && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm text-gray-600">
                                {counts.RETARD} retard{counts.RETARD > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                          {counts.EXCUSE > 0 && (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">
                                {counts.EXCUSE} excusé{counts.EXCUSE > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedAppel?.id === appel.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <h4 className="font-semibold mb-3">Détails des présences</h4>
                        <div className="space-y-2">
                          {appel.presences.map((presence) => {
                            const StatutIcon = statutIcons[presence.statut as keyof typeof statutIcons];
                            const statutColor = statutColors[presence.statut as keyof typeof statutColors];

                            return (
                              <div
                                key={presence.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded ${statutColor}`}>
                                    <StatutIcon className="w-4 h-4" />
                                  </div>
                                  <span className="font-medium">
                                    {presence.eleve.prenom} {presence.eleve.nom}
                                  </span>
                                </div>
                                {presence.commentaire && (
                                  <span className="text-xs text-gray-500 italic">
                                    {presence.commentaire}
                                  </span>
                                )}
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
