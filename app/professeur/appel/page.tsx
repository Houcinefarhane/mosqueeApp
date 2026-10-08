"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/layout/PageHeader";
import AppelCompactList, {
  AppelListSkeleton,
} from "@/components/professeur/AppelCompactList";
import { TOUCH_DATE_FIELD, TOUCH_FIELD } from "@/lib/ui/touch-styles";
import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type AppelUiStatut,
  nextAppelStatut,
  toApiStatut,
} from "@/lib/constants/appel-ui";
import { ListSkeleton } from "@/components/ui/Skeleton";

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
      <ListSkeleton rows={1} />
      <div className="h-32 rounded-3xl bg-sable animate-pulse" />
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
  const [uiPresences, setUiPresences] = useState<Record<string, AppelUiStatut>>(
    {}
  );
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [showCommentaireSeance, setShowCommentaireSeance] = useState(false);
  const [commentaireSeance, setCommentaireSeance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
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
      setSubmitSuccess(false);
      const fetchEleves = async () => {
        try {
          const response = await fetch(
            `/api/professeur/classes/${selectedClasseId}/eleves`
          );
          const data = await response.json();
          setEleves(data);
          const initial: Record<string, AppelUiStatut> = {};
          data.forEach((eleve: Eleve) => {
            initial[eleve.id] = "EN_ATTENTE";
          });
          setUiPresences(initial);
          setCommentaires({});
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
      setUiPresences({});
      setIsLoadingEleves(false);
    }
  }, [selectedClasseId]);

  const counts = useMemo(() => {
    const values = Object.values(uiPresences);
    return {
      presents: values.filter((s) => s === "PRESENT").length,
      absents: values.filter((s) => s === "ABSENT").length,
      treated: values.filter((s) => s !== "EN_ATTENTE").length,
    };
  }, [uiPresences]);

  const selectedClasse = classes.find((c) => c.id === selectedClasseId);
  const progress =
    eleves.length > 0 ? counts.treated / eleves.length : 0;

  const sessionSubtitle = useMemo(() => {
    const d = new Date(date + "T12:00:00");
    const jour = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return `${jour} · séance du jour`;
  }, [date]);

  const handleTogglePresence = (eleveId: string) => {
    void import("@/lib/native/haptics").then(({ lightTapHaptic }) =>
      lightTapHaptic()
    );
    setUiPresences((prev) => ({
      ...prev,
      [eleveId]: nextAppelStatut(prev[eleveId] ?? "EN_ATTENTE"),
    }));
    setPulseId(eleveId);
    window.setTimeout(() => setPulseId(null), 320);
  };

  const handleMarkAllPresent = () => {
    setUiPresences((prev) => {
      const next = { ...prev };
      eleves.forEach((e) => {
        next[e.id] = "PRESENT";
      });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedClasseId || eleves.length === 0 || submitSuccess) return;

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
            statut: toApiStatut(uiPresences[eleve.id] ?? "EN_ATTENTE"),
            commentaire: commentaires[eleve.id] || null,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      setSubmitSuccess(true);
      window.setTimeout(() => {
        router.push("/professeur/appel/historique");
      }, 900);
    } catch (err: unknown) {
      const offline =
        typeof navigator !== "undefined" && !navigator.onLine;
      setSubmitError(
        offline
          ? "Appel non enregistré, réessayez dès que le réseau revient."
          : err instanceof Error
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

  const showList = eleves.length > 0 && !isLoadingEleves;

  return (
    <div className={cn("space-y-4 sm:space-y-6", showList && "pb-28 md:pb-0")}>
      <PageHeader
        label={
          selectedClasse
            ? `${selectedClasse.nom} · ${selectedClasse.niveau}`
            : "Appel"
        }
        title="Faire l'appel"
        description={selectedClasse ? sessionSubtitle : "Marquez les présences en un tap"}
        breadcrumbs={[
          { label: "Espace professeur", href: "/professeur" },
          { label: "Appel" },
        ]}
      />

      <Card>
        <CardContent className="grid gap-3 pt-4 md:grid-cols-2">
          <div>
            <label className="label-caps mb-1.5 block">Classe</label>
            <select
              value={selectedClasseId}
              onChange={(e) => setSelectedClasseId(e.target.value)}
              className={TOUCH_FIELD}
            >
              <option value="">Sélectionnez une classe</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom} — {classe.niveau}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={TOUCH_DATE_FIELD}
            />
          </div>
        </CardContent>
      </Card>

      {!selectedClasseId && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sable">
              <ClipboardList className="h-7 w-7 text-or" />
            </div>
            <p className="font-semibold text-brun">Choisissez une classe</p>
            <p className="mt-1 max-w-xs text-sm text-brun-doux">
              Tapez chaque ligne pour faire défiler le statut : en attente, présent, absent…
            </p>
          </CardContent>
        </Card>
      )}

      {selectedClasseId && isLoadingEleves && <AppelListSkeleton rows={12} />}

      {selectedClasseId && !isLoadingEleves && eleves.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-semibold text-brun">Aucun élève dans cette classe</p>
          </CardContent>
        </Card>
      )}

      {showList && (
        <>
          <div className="overflow-hidden rounded-3xl bg-brun p-4 text-blanc sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="label-caps !text-or-clair/90 mb-1">Présents</p>
                <p className="font-display text-4xl font-extrabold tabular-nums leading-none sm:text-5xl">
                  {counts.presents}
                </p>
              </div>
              <div className="text-right">
                <p className="label-caps !text-or-clair/90 mb-1">Absents</p>
                <p className="font-display text-4xl font-extrabold tabular-nums leading-none sm:text-5xl">
                  {counts.absents}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-nuit/40">
              <motion.div
                className="h-full rounded-full bg-or"
                initial={false}
                animate={{ width: `${Math.round(progress * 100)}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-blanc/75 tabular-nums">
              {counts.treated} / {eleves.length} élèves traités
            </p>
          </div>

          <div className="flex justify-end md:hidden">
            <Button type="button" variant="secondary" size="sm" onClick={handleMarkAllPresent}>
              Tous présents
            </Button>
          </div>

          <AppelCompactList
            eleves={eleves}
            uiPresences={uiPresences}
            commentaires={commentaires}
            onTogglePresence={handleTogglePresence}
            onCommentChange={(id, value) =>
              setCommentaires((prev) => ({ ...prev, [id]: value }))
            }
            pulseId={pulseId}
          />

          <Card className="md:hidden">
            <button
              type="button"
              onClick={() => setShowCommentaireSeance((v) => !v)}
              className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-semibold text-brun"
            >
              Commentaire de séance
              <span className="text-brun-doux">{showCommentaireSeance ? "▲" : "▼"}</span>
            </button>
            <AnimatePresence initial={false}>
              {showCommentaireSeance && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-filet px-4 pb-4"
                >
                  <textarea
                    placeholder="Commentaire général (optionnel)"
                    value={commentaireSeance}
                    onChange={(e) => setCommentaireSeance(e.target.value)}
                    className={cn(TOUCH_FIELD, "mt-3 min-h-[5rem] text-sm")}
                    rows={3}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Desktop — liste + enregistrer */}
          <div className="hidden md:block">
            <div className="mb-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleMarkAllPresent}>
                Tous présents
              </Button>
            </div>
            <Card>
              <CardContent className="pt-4">
                <textarea
                  placeholder="Commentaire de séance (optionnel)"
                  value={commentaireSeance}
                  onChange={(e) => setCommentaireSeance(e.target.value)}
                  className={cn(TOUCH_FIELD, "min-h-[5rem]")}
                  rows={3}
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    disabled={submitSuccess}
                    size="lg"
                  >
                    {submitSuccess ? "✓ Appel enregistré" : "Enregistrer l'appel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {showList && (
        <div
          className="fixed inset-x-0 z-40 border-t border-filet bg-blanc/95 px-3 py-2 backdrop-blur-md md:hidden"
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
                className="mb-2 rounded-2xl bg-sable px-3 py-2 text-center text-xs text-brun-doux"
              >
                {submitError}
              </motion.p>
            )}
          </AnimatePresence>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={submitSuccess}
            size="touch"
            className="min-h-[58px] w-full text-base"
          >
            {submitSuccess ? "✓ Appel enregistré" : "Enregistrer l'appel"}
          </Button>
        </div>
      )}
    </div>
  );
}
