"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";

export default function AssignerProfesseurPage() {
  const router = useRouter();
  const params = useParams();
  const classeId = params.id as string;

  const [professeurs, setProfesseurs] = useState<any[]>([]);
  const [classe, setClasse] = useState<any>(null);
  const [selectedProfesseurId, setSelectedProfesseurId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classeRes, professeursRes] = await Promise.all([
          fetch(`/api/admin/classes/${classeId}`),
          fetch("/api/admin/professeurs"),
        ]);

        if (!classeRes.ok || !professeursRes.ok) {
          throw new Error("Erreur lors du chargement");
        }

        const classeData = await classeRes.json();
        const professeursData = await professeursRes.json();

        setClasse(classeData);
        setProfesseurs(professeursData);
        if (classeData.professeurId) {
          setSelectedProfesseurId(classeData.professeurId);
        }
      } catch (err) {
        setError("Erreur lors du chargement des données");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [classeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/classes/${classeId}/assigner-professeur`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professeurId: selectedProfesseurId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'assignation");
      }

      router.push(`/admin/classes/${classeId}`);
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
        <Link href={`/admin/classes/${classeId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Assigner un professeur
          </h1>
          <p className="text-gray-600 mt-2">
            {classe && `Classe: ${classe.nom}`}
          </p>
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Sélectionner un professeur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Professeur
              </label>
              <select
                value={selectedProfesseurId}
                onChange={(e) => setSelectedProfesseurId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Aucun professeur (retirer l&apos;assignation)</option>
                {professeurs.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.prenom} {prof.nom} ({prof.email})
                  </option>
                ))}
              </select>
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
              <Link href={`/admin/classes/${classeId}`}>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Annuler
                </Button>
              </Link>
              <Button type="submit" isLoading={isLoading}>
                {selectedProfesseurId ? "Modifier l&apos;assignation" : "Retirer l&apos;assignation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {professeurs.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun professeur disponible</p>
            <Link href="/admin/professeurs/nouveau">
              <Button className="mt-4">Créer un professeur</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
