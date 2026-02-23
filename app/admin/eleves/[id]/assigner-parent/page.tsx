"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";

export default function AssignerParentPage() {
  const router = useRouter();
  const params = useParams();
  const eleveId = params.id as string;

  const [eleve, setEleve] = useState<any>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eleveRes, parentsRes] = await Promise.all([
          fetch(`/api/admin/eleves`).then((res) =>
            res.json().then((eleves) => eleves.find((e: any) => e.id === eleveId))
          ),
          fetch("/api/admin/parents"),
        ]);

        if (!eleveRes) {
          throw new Error("Élève non trouvé");
        }

        const parentsData = await parentsRes.json();

        setEleve(eleveRes);
        setParents(parentsData);
        if (eleveRes.parentId) {
          setSelectedParentId(eleveRes.parentId);
        }
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des données");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [eleveId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/eleves/${eleveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: selectedParentId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l&apos;assignation");
      }

      router.push(`/admin/eleves/${eleveId}`);
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
        <Link href={`/admin/eleves/${eleveId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Assigner un parent
          </h1>
          <p className="text-gray-600 mt-2">
            {eleve && `Élève: ${eleve.prenom} ${eleve.nom}`}
          </p>
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Sélectionner un parent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parent
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Aucun parent (retirer l&apos;assignation)</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.prenom} {parent.nom} ({parent.email})
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
              <Link href={`/admin/eleves/${eleveId}`}>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Annuler
                </Button>
              </Link>
              <Button type="submit" isLoading={isLoading}>
                {selectedParentId ? "Modifier l&apos;assignation" : "Retirer l&apos;assignation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {parents.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun parent disponible</p>
            <p className="text-sm text-gray-500 mt-2">
              Les parents doivent s&apos;inscrire avant de pouvoir être assignés à un élève
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
