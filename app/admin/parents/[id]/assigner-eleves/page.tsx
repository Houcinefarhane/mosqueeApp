"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Users, Check } from "lucide-react";

export default function AssignerElevesPage() {
  const router = useRouter();
  const params = useParams();
  const parentId = params.id as string;

  const [parent, setParent] = useState<any>(null);
  const [eleves, setEleves] = useState<any[]>([]);
  const [selectedEleveIds, setSelectedEleveIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [parentRes, elevesRes] = await Promise.all([
          fetch("/api/admin/parents").then((res) =>
            res.json().then((parents) => parents.find((p: any) => p.id === parentId))
          ),
          fetch("/api/admin/eleves"),
        ]);

        if (!parentRes) {
          throw new Error("Parent non trouvé");
        }

        const elevesData = await elevesRes.json();

        setParent(parentRes);
        setEleves(elevesData);

        // Pré-sélectionner les élèves déjà assignés à ce parent
        const alreadyAssigned = elevesData
          .filter((e: any) => e.parentId === parentId)
          .map((e: any) => e.id);
        setSelectedEleveIds(alreadyAssigned);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des données");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [parentId]);

  const handleToggleEleve = (eleveId: string) => {
    setSelectedEleveIds((prev) =>
      prev.includes(eleveId)
        ? prev.filter((id) => id !== eleveId)
        : [...prev, eleveId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEleveIds.length === eleves.length) {
      setSelectedEleveIds([]);
    } else {
      setSelectedEleveIds(eleves.map((e) => e.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/parents/${parentId}/eleves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eleveIds: selectedEleveIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l&apos;assignation");
      }

      router.push(`/admin/parents/${parentId}`);
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
        <Link href={`/admin/parents/${parentId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Assigner des élèves
          </h1>
          <p className="text-gray-600 mt-2">
            {parent && `Parent: ${parent.prenom} ${parent.nom}`}
          </p>
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sélectionner les élèves</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedEleveIds.length === eleves.length
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {eleves.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun élève disponible</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {eleves.map((eleve) => (
                  <motion.label
                    key={eleve.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEleveIds.includes(eleve.id)}
                      onChange={() => handleToggleEleve(eleve.id)}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {eleve.prenom} {eleve.nom}
                      </p>
                      <p className="text-sm text-gray-600">
                        {eleve.classe.nom} - {eleve.classe.niveau}
                      </p>
                    </div>
                    {selectedEleveIds.includes(eleve.id) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </motion.label>
                ))}
              </div>
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

            <div className="flex gap-4 pt-4 border-t">
              <Link href={`/admin/parents/${parentId}`}>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Annuler
                </Button>
              </Link>
              <Button type="submit" isLoading={isLoading} disabled={selectedEleveIds.length === 0}>
                Assigner {selectedEleveIds.length} élève(s)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
