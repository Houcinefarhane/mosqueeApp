"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check } from "lucide-react";

export default function AssignerClassesPage() {
  const router = useRouter();
  const params = useParams();
  const professeurId = params.id as string;

  const [classes, setClasses] = useState<any[]>([]);
  const [professeur, setProfesseur] = useState<any>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [professeurRes, classesRes] = await Promise.all([
          fetch(`/api/admin/professeurs/${professeurId}`),
          fetch("/api/admin/classes"),
        ]);

        if (!professeurRes.ok || !classesRes.ok) {
          throw new Error("Erreur lors du chargement");
        }

        const professeurData = await professeurRes.json();
        const classesData = await classesRes.json();

        setProfesseur(professeurData);
        setClasses(classesData);
        
        // Pré-sélectionner les classes déjà assignées
        const classesAssignees = classesData
          .filter((c: any) => c.professeurId === professeurId)
          .map((c: any) => c.id);
        setSelectedClasses(classesAssignees);
      } catch (err) {
        setError("Erreur lors du chargement des données");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [professeurId]);

  const toggleClasse = (classeId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classeId)
        ? prev.filter((id) => id !== classeId)
        : [...prev, classeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/professeurs/${professeurId}/assigner-classes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classesIds: selectedClasses,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'assignation");
      }

      router.push(`/admin/professeurs/${professeurId}`);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="text-center py-12">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/professeurs/${professeurId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Assigner des classes
          </h1>
          <p className="text-gray-600 mt-2">
            {professeur && `Professeur: ${professeur.prenom} ${professeur.nom}`}
          </p>
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Sélectionner les classes</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {classes.length > 0 ? (
              <div className="space-y-2">
                {classes.map((classe) => (
                  <label
                    key={classe.id}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedClasses.includes(classe.id)
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(classe.id)}
                      onChange={() => toggleClasse(classe.id)}
                      className="w-5 h-5 text-primary rounded focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <p className="font-semibold">{classe.nom}</p>
                        {selectedClasses.includes(classe.id) && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{classe.niveau}</p>
                      {classe.professeurId && classe.professeurId !== professeurId && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Déjà assignée à un autre professeur
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Aucune classe disponible
              </p>
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

            <div className="flex gap-4 pt-4">
              <Link href={`/admin/professeurs/${professeurId}`}>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Annuler
                </Button>
              </Link>
              <Button type="submit" isLoading={isLoading}>
                Enregistrer les assignations
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
