"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AppelCompactList, {
  type StatutPresence,
} from "@/components/professeur/AppelCompactList";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  classe: {
    id: string;
    nom: string;
  };
}

const TOUCH_FIELD =
  "min-h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

const DATE_FIELD =
  "min-h-11 w-[9.75rem] max-w-[42vw] rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent md:w-full md:max-w-none";

export default function AppelPage() {
  return (
    <Suspense fallback={<AppelLoadingSkeleton />}>
      <AppelPageContent />
    </Suspense>
  );
}

function AppelLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-gray-200" />
      <div className="h-24 rounded-xl bg-gray-100" />
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

function AppelPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classeIdFromUrl = searchParams.get("classeId") ?? "";
  const [classes, setClasses] = useState<
    { id: string; nom: string; niveau: string }[]
  >([]);
  const [selectedClasseId, setSelectedClasseId] = useState(classeIdFromUrl);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [presences, setPresences] = useState<Record<string, StatutPresence>>({});
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showCommentaireSeance, setShowCommentaireSeance] = useState(false);
  const [commentaireSeance, setCommentaireSeance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingEleves, setIsLoadingEleves] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/professeur/classes");
        const data = (await response.json()) as {
          id: string;
          nom: string;
          niveau: string;
        }[];
        setClasses(data);
        if (classeIdFromUrl && data.some((c) => c.id === classeIdFromUrl)) {
          setSelectedClasseId(classeIdFromUrl);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchClasses();
  }, [classeIdFromUrl]);

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
          const initialPresences: Record<string, StatutPresence> = {};
          data.forEach((eleve: Eleve) => {
            initialPresences[eleve.id] = "PRESENT";
          });
          setPresences(initialPresences);
          setCommentaires({});
          setExpandedIds(new Set());
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingEleves(false);
        }
      };

      fetchEleves();
    } else {
      setEleves([]);
      setPresences({});
      setIsLoadingEleves(false);
    }
  }, [selectedClasseId]);

  const counts = useMemo(() => {
    const values = Object.values(presences);
    return {
      presents: values.filter((s) => s === "PRESENT").length,
      absents: values.filter((s) => s === "ABSENT").length,
      retards: values.filter((s) => s === "RETARD").length,
      excuses: values.filter((s) => s === "EXCUSE").length,
    };
  }, [presences]);

  const handleStatutChange = (eleveId: string, statut: StatutPresence) => {
    setPresences((prev) => ({ ...prev, [eleveId]: statut }));
  };

  const handleToggleExpand = (eleveId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eleveId)) next.delete(eleveId);
      else next.add(eleveId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedClasseId || eleves.length === 0) return;

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
    } catch (err: unknown) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement de l'appel"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <AppelLoadingSkeleton />;
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
          Faire l&apos;appel
        </h1>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Marquez les présences des élèves
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">
            Paramètres de l&apos;appel
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 overflow-hidden">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
            <div className="min-w-0">
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
            <div className="shrink-0 md:min-w-0">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={DATE_FIELD}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoadingEleves && (
        <div className="space-y-2 md:hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      )}

      {showList && (
        <>
          {/* Résumé mobile */}
          <div className="flex flex-wrap gap-2 md:hidden">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              {counts.presents} présents
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              {counts.absents} absents
            </span>
            {(counts.retards > 0 || counts.excuses > 0) && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {counts.retards + counts.excuses} autres
              </span>
            )}
          </div>

          {/* Liste compacte — mobile */}
          <AppelCompactList
            eleves={eleves}
            presences={presences}
            commentaires={commentaires}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
            onStatutChange={handleStatutChange}
            onCommentChange={(id, value) =>
              setCommentaires((prev) => ({ ...prev, [id]: value }))
            }
          />

          {/* Commentaire séance — replié sur mobile */}
          <Card variant="elevated" className="md:hidden">
            <button
              type="button"
              onClick={() => setShowCommentaireSeance((v) => !v)}
              className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground"
            >
              Commentaire de séance (optionnel)
              {showCommentaireSeance ? (
                <ChevronUpIcon />
              ) : (
                <ChevronDownIcon />
              )}
            </button>
            {showCommentaireSeance && (
              <CardContent className="border-t border-gray-100 pt-0">
                <textarea
                  placeholder="Commentaire général sur la séance"
                  value={commentaireSeance}
                  onChange={(e) => setCommentaireSeance(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </CardContent>
            )}
          </Card>

          {/* Vue détaillée — desktop */}
          <Card variant="elevated" className="hidden md:block">
            <CardHeader>
              <CardTitle>Commentaire de la séance</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="Ajoutez un commentaire général sur la séance (optionnel)"
                value={commentaireSeance}
                onChange={(e) => setCommentaireSeance(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </CardContent>
          </Card>

          <Card variant="elevated" className="hidden md:block">
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
                      className="rounded-lg border border-gray-200 p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${statutColors[statut]}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {eleve.prenom} {eleve.nom}
                          </p>
                          <p className="text-sm text-gray-600">
                            {eleve.classe.nom}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {(Object.keys(statutIcons) as StatutPresence[]).map(
                          (s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleStatutChange(eleve.id, s)}
                              className={cn(
                                "min-h-11 rounded-lg text-sm font-medium transition-all",
                                statut === s
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              )}
                            >
                              {statutLabels[s]}
                            </button>
                          )
                        )}
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSubmit} isLoading={isLoading} size="lg">
                  Enregistrer l&apos;appel
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedClasseId && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">
              Sélectionnez une classe pour commencer l&apos;appel
            </p>
          </CardContent>
        </Card>
      )}

      {/* Barre fixe mobile — enregistrement */}
      {showList && (
        <div
          className="fixed inset-x-0 z-40 border-t border-gray-200 bg-surface/95 p-3 backdrop-blur-md md:hidden"
          style={{
            bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <p className="mb-2 text-center text-xs text-gray-600">
            {counts.presents} présents · {counts.absents} absents
            {counts.retards + counts.excuses > 0 &&
              ` · ${counts.retards + counts.excuses} autres`}
          </p>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            className="min-h-11 w-full text-base"
            size="lg"
          >
            Enregistrer l&apos;appel ({eleves.length})
          </Button>
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    </svg>
  );
}
