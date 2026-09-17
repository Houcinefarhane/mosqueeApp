"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { DevoirCard, type DevoirItem } from "@/components/devoirs/DevoirCard";
import { MATIERES } from "@/lib/constants/devoirs";
import { BookOpen, Plus, Trash2 } from "lucide-react";

interface ClasseOption {
  id: string;
  nom: string;
  niveau: string;
}

export default function ProfDevoirsPage() {
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [devoirs, setDevoirs] = useState<DevoirItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [classeId, setClasseId] = useState("");
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [matiere, setMatiere] = useState("Coran");
  const [type, setType] = useState<"DEVOIR" | "CAHIER_TEXTE">("CAHIER_TEXTE");
  const [dateLimite, setDateLimite] = useState("");

  const loadData = async () => {
    try {
      const [classesRes, devoirsRes] = await Promise.all([
        fetch("/api/professeur/classes"),
        fetch("/api/professeur/devoirs"),
      ]);
      if (!classesRes.ok || !devoirsRes.ok) throw new Error("Erreur de chargement");
      const classesData = (await classesRes.json()) as ClasseOption[];
      const devoirsData = (await devoirsRes.json()) as DevoirItem[];
      setClasses(classesData);
      setDevoirs(devoirsData);
    } catch {
      toast.error("Impossible de charger les données");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setTitre("");
    setContenu("");
    setMatiere("Coran");
    setType("CAHIER_TEXTE");
    setDateLimite("");
    setClasseId("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classeId || !titre.trim() || !contenu.trim()) {
      toast.error("Remplissez les champs obligatoires");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/professeur/devoirs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classeId,
          titre: titre.trim(),
          contenu: contenu.trim(),
          matiere,
          type,
          dateLimite: dateLimite || null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Erreur lors de la publication");
      }

      toast.success("Publié avec succès");
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce devoir ?")) return;

    try {
      const response = await fetch(`/api/professeur/devoirs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Suppression impossible");
      toast.success("Devoir supprimé");
      setDevoirs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoadingData) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoirs & cahier de texte"
        description="Publiez les travaux à faire pour vos classes"
        breadcrumbs={[
          { label: "Espace professeur", href: "/professeur" },
          { label: "Devoirs" },
        ]}
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Annuler" : "Publier"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle publication</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
              <Select
                label="Classe"
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
                required
                options={[
                  { value: "", label: "Sélectionnez une classe" },
                  ...classes.map((c) => ({
                    value: c.id,
                    label: `${c.nom} — ${c.niveau}`,
                  })),
                ]}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Type"
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "DEVOIR" | "CAHIER_TEXTE")
                  }
                  options={[
                    { value: "CAHIER_TEXTE", label: "Cahier de texte" },
                    { value: "DEVOIR", label: "Devoir" },
                  ]}
                />
                <Select
                  label="Matière"
                  value={matiere}
                  onChange={(e) => setMatiere(e.target.value)}
                  options={MATIERES.map((m) => ({ value: m, label: m }))}
                />
              </div>
              <Input
                label="Titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex : Mémoriser sourate Al-Fatiha"
                required
              />
              <Textarea
                label="Consignes"
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                rows={5}
                placeholder="Décrivez le travail à effectuer..."
                required
              />
              <Input
                type="date"
                label="Date limite (optionnel)"
                value={dateLimite}
                onChange={(e) => setDateLimite(e.target.value)}
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Publier
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Publications ({devoirs.length})
        </h2>
        {devoirs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">
                Aucun devoir publié. Cliquez sur « Publier » pour commencer.
              </p>
            </CardContent>
          </Card>
        ) : (
          devoirs.map((devoir) => (
            <DevoirCard
              key={devoir.id}
              devoir={devoir}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(devoir.id)}
                  className="text-danger hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          ))
        )}
      </section>
    </div>
  );
}
