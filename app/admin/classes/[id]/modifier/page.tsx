"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ModifierClassePage() {
  const router = useRouter();
  const params = useParams();
  const classeId = params.id as string;

  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClasse = async () => {
      try {
        const response = await fetch(`/api/admin/classes/${classeId}`);
        if (!response.ok) {
          throw new Error("Classe non trouvée");
        }
        const data = await response.json();
        setNom(data.nom);
        setNiveau(data.niveau);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (classeId) {
      fetchClasse();
    }
  }, [classeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nom || !niveau) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/classes/${classeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, niveau }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la modification");
      }

      router.push(`/admin/classes/${classeId}`);
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
        <Link href={`/admin/classes/${classeId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Modifier la classe</h1>
          <p className="text-gray-600 mt-2">Modifiez les informations de la classe</p>
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Informations de la classe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nom de la classe"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              placeholder="Ex: Classe A"
            />

            <Input
              label="Niveau"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              required
              placeholder="Ex: Débutant, Intermédiaire, Avancé"
            />

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
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
