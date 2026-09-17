"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function NouvelElevePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    telephone: "",
    email: "",
    classeId: "",
    parentId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, parentsRes] = await Promise.all([
          fetch("/api/admin/classes"),
          fetch("/api/admin/parents"),
        ]);

        const classesData = await classesRes.json();
        const parentsData = await parentsRes.json();

        setClasses(classesData);
        setParents(parentsData);
      } catch (err) {
        setError("Erreur lors du chargement des données");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/eleves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dateNaissance: formData.dateNaissance || null,
          parentId: formData.parentId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      router.push("/admin/eleves");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nouvel élève</h1>
        <p className="text-gray-600 mt-2">Inscrivez un nouvel élève</p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Informations de l&apos;élève</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
              />
              <Input
                label="Nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <Input
              label="Date de naissance"
              type="date"
              value={formData.dateNaissance}
              onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
            />
            <Input
              label="Téléphone"
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Classe *
              </label>
              <select
                value={formData.classeId}
                onChange={(e) => setFormData({ ...formData, classeId: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Sélectionnez une classe</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom} - {classe.niveau}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parent (optionnel)
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Aucun parent</option>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Inscrire l&apos;élève
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
