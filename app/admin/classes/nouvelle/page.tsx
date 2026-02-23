"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function NouvelleClassePage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, niveau }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      router.push("/admin/classes");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nouvelle classe</h1>
        <p className="text-gray-600 mt-2">Créez une nouvelle classe pour votre mosquée</p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Informations de la classe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nom de la classe"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              placeholder="Ex: Classe A1, Niveau 1..."
            />
            <Input
              label="Niveau"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              required
              placeholder="Ex: Débutant, Intermédiaire, Avancé..."
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
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Créer la classe
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
