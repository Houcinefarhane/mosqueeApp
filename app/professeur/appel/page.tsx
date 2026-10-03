"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/layout/PageHeader";
import AppelCompactList, {
  AppelListSkeleton,
  type StatutPresence,
} from "@/components/professeur/AppelCompactList";
import { TOUCH_DATE_FIELD, TOUCH_FIELD } from "@/lib/ui/touch-styles";
import { CheckCircle, XCircle, Clock, AlertCircle, ClipboardList } from "lucide-react";
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

export default function AppelPage() {
  return (
    <Suspense fallback={<AppelPageSkeleton />}>
      <AppelPageContent />
    </Suspense>
  );
}

function AppelPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse space-y-2 rounded-xl border border-gray-200 p-4">
        <div className="h-6 w-40 rounded bg-gray-200" />
        <div className="h-4 w-56 rounded bg-gray-100" />
      </div>
      <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
      <AppelListSkeleton rows={8} />
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
  const [submitError, setSubmitError] = useState("");
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
      setSubmitError("");
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
          setSubmitError("Impossible de charger la liste des élèves.");
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

  const selectedClasse = classes.find((c) => c.id === selectedClasseId);

  const handleStatutChange = (eleveId: string, statut: StatutPresence) => {
    setPresences((prev) => ({ ...prev, [eleveId]: statut }));
  };

  const handleTogglePresence = (eleveId: string) => {
    setPresences((prev) => {
      const current = prev[eleveId] || "PRESENT";
      if (current === "PRESENT") return { ...prev, [eleveId]: "ABSENT" };
      if (current === "ABSENT") return { ...prev, [eleveId]: "PRESENT" };
      return { ...prev, [eleveId]: "PRESENT" };
    });
  };

  const handleMarkAll = (statut: "PRESENT" | "ABSENT") => {
    setPresences((prev) => {
      const next = { ...prev };
      eleves.forEach((e) => {
        next[e.id] = statut;
      });
      return next;
    });
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
    setSubmitError("");

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

      router.push("/professeur/appel/historique");
    } catch (err: unknown) {
      console.error(err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement de l'appel"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <AppelPageSkeleton />;
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
        showList && "pb-32 md:pb-0"
      )}
    >
      <PageHeader
        title="Faire l'appel"
        description={
          selectedClasse
            ? `${selectedClasse.nom} · ${eleves.length || "…"} élève(s)`
            : "Marquez les présences en un tap"
        }
        breadcrumbs={[
          { label: "Espace professeur", href: "/professeur" },
          { label: "Appel" },
        ]}
      />

      <Card variant="elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">
            Paramètres
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
                className={TOUCH_DATE_FIELD}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedClasseId && (
        <Card variant="elevated">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ClipboardList className="h-7 w-7 text-primary" />
            </div>
            <p className="font-medium text-foreground">
              Choisissez une classe pour commencer
            </p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Tous les élèves seront marqués présents par défaut. Un tap bascule
              absent.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedClasseId && isLoadingEleves && <AppelListSkeleton rows={12} />}

      {selectedClasseId && !isLoadingEleves && eleves.length === 0 && (
        <Card variant="elevated">
          <CardContent className="px-6 py-10 text-center">
            <p className="font-medium text-foreground">Aucun élève dans cette classe</p>
            <p className="mt-1 text-sm text-gray-500">
              Vérifiez l&apos;affectation des élèves dans l&apos;administration.
            </p>
          </CardContent>
        </Card>
      )}

      {showList && (
        <>
          {/* Barre d'actions rapides — mobile */}
          <div className="space-y-3 md:hidden">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full bg-green-100 px-3 text-xs font-semibold text-green-800">
                {counts.presents} présents
              </span>
              <span className="inline-flex min-h-8 items-center rounded-full bg-red-100 px-3 text-xs font-semibold text-red-800">
                {counts.absents} absents
              </span>
              {(counts.retards > 0 || counts.excuses > 0) && (
                <span className="inline-flex min-h-8 items-center rounded-full bg-amber-100 px-3 text-xs font-semibold text-amber-800">
                  {counts.retards + counts.excuses} autres
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="min-h-12 w-full"
                onClick={() => handleMarkAll("PRESENT")}
              >
                Tout présent
              </Button>
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="min-h-12 w-full"
                onClick={() => handleMarkAll("ABSENT")}
              >
                Tout absent
              </Button>
            </div>
            <p className="text-center text-xs text-gray-500">
              Appuyez sur un élève pour basculer présent / absent
            </p>
          </div>

          <AppelCompactList
            eleves={eleves}
            presences={presences}
            commentaires={commentaires}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
            onTogglePresence={handleTogglePresence}
            onStatutChange={handleStatutChange}
            onCommentChange={(id, value) =>
              setCommentaires((prev) => ({ ...prev, [id]: value }))
            }
          />

          <Card variant="elevated" className="md:hidden">
            <button
              type="button"
              onClick={() => setShowCommentaireSeance((v) => !v)}
              className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground"
            >
              Commentaire de séance (optionnel)
              <span className="text-gray-400">{showCommentaireSeance ? "▲" : "▼"}</span>
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
                  <CardContent className="border-t border-gray-100 pt-0">
                    <textarea
                      placeholder="Commentaire général sur la séance"
                      value={commentaireSeance}
                      onChange={(e) => setCommentaireSeance(e.target.value)}
                      className="min-h-12 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Desktop — inchangé structurellement */}
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
                      transition={{ duration: 0.15 }}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${statutColors[statut]}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {eleve.prenom} {eleve.nom}
                          </p>
                          <p className="text-sm text-gray-600">{eleve.classe.nom}</p>
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
                                "min-h-11 rounded-lg text-sm font-medium transition-all duration-150",
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

      {/* Barre fixe mobile */}
      {showList && (
        <div
          className="fixed inset-x-0 z-40 border-t border-gray-200 bg-surface/95 px-3 py-3 backdrop-blur-md md:hidden"
          style={{
            bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <AnimatePresence>
            {submitError && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700"
              >
                {submitError}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="mb-2 text-center text-xs tabular-nums text-gray-600">
            {counts.presents} présents · {counts.absents} absents
            {counts.retards + counts.excuses > 0 &&
              ` · ${counts.retards + counts.excuses} autres`}
          </p>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            size="touch"
            className="min-h-12 w-full text-base font-semibold"
          >
            Enregistrer l&apos;appel · {eleves.length} élèves
          </Button>
        </div>
      )}
    </div>
  );
}
