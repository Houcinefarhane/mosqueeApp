"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";

const jours = [
  { value: "LUNDI", label: "Lundi" },
  { value: "MARDI", label: "Mardi" },
  { value: "MERCREDI", label: "Mercredi" },
  { value: "JEUDI", label: "Jeudi" },
  { value: "VENDREDI", label: "Vendredi" },
  { value: "SAMEDI", label: "Samedi" },
  { value: "DIMANCHE", label: "Dimanche" },
];

interface Cours {
  jour: string;
  heureDebut: string;
  heureFin: string;
  matiere: string;
}

export default function NouveauPlanningPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState("");
  const [cours, setCours] = useState<Cours[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/admin/classes");
        const data = await response.json();
        setClasses(data);
      } catch (err) {
        setError("Erreur lors du chargement des classes");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchClasses();
  }, []);

  const addCours = () => {
    setCours([
      ...cours,
      {
        jour: "LUNDI",
        heureDebut: "09:00",
        heureFin: "10:00",
        matiere: "",
      },
    ]);
  };

  const removeCours = (index: number) => {
    setCours(cours.filter((_, i) => i !== index));
  };

  const updateCours = (index: number, field: keyof Cours, value: string) => {
    const newCours = [...cours];
    newCours[index] = { ...newCours[index], [field]: value };
    setCours(newCours);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedClasseId) {
      setError("Veuillez sélectionner une classe");
      return;
    }

    if (cours.length === 0) {
      setError("Veuillez ajouter au moins un cours");
      return;
    }

    if (cours.some((c) => !c.matiere || !c.heureDebut || !c.heureFin)) {
      setError("Veuillez remplir tous les champs des cours");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/planning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classeId: selectedClasseId,
          cours,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      router.push("/admin/planning");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/planning">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nouveau planning</h1>
          <p className="text-gray-600 mt-2">Créez un planning pour une classe</p>
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Informations du planning</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="Classe"
              value={selectedClasseId}
              onChange={(e) => setSelectedClasseId(e.target.value)}
              options={[
                { value: "", label: "Sélectionnez une classe" },
                ...classes.map((c) => ({
                  value: c.id,
                  label: `${c.nom} - ${c.niveau}`,
                })),
              ]}
              required
            />

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Cours *
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCours}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un cours
                </Button>
              </div>

              {cours.length > 0 ? (
                <div className="space-y-4">
                  {cours.map((cour, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Cours {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCours(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select
                          value={cour.jour}
                          onChange={(e) =>
                            updateCours(index, "jour", e.target.value)
                          }
                          options={jours}
                          required
                        />
                        <Input
                          type="time"
                          value={cour.heureDebut}
                          onChange={(e) =>
                            updateCours(index, "heureDebut", e.target.value)
                          }
                          required
                          placeholder="09:00"
                        />
                        <Input
                          type="time"
                          value={cour.heureFin}
                          onChange={(e) =>
                            updateCours(index, "heureFin", e.target.value)
                          }
                          required
                          placeholder="10:00"
                        />
                        <Input
                          value={cour.matiere}
                          onChange={(e) =>
                            updateCours(index, "matiere", e.target.value)
                          }
                          required
                          placeholder="Matière"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  Aucun cours ajouté. Cliquez sur &quot;Ajouter un cours&quot; pour commencer.
                </p>
              )}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-600 bg-red-50 p-3 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <div className="flex gap-4">
              <Link href="/admin/planning">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Annuler
                </Button>
              </Link>
              <Button type="submit" isLoading={isLoading}>
                Créer le planning
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
