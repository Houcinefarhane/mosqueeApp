"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NouveauPaiementPage() {
  const router = useRouter();
  const [eleves, setEleves] = useState<any[]>([]);
  const [selectedEleveId, setSelectedEleveId] = useState("");
  const [montant, setMontant] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEleves = async () => {
      try {
        const response = await fetch("/api/admin/eleves");
        const data = await response.json();
        setEleves(data);
      } catch (err) {
        setError("Erreur lors du chargement des élèves");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchEleves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedEleveId || !montant || !dateEcheance) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      setError("Le montant doit être un nombre positif");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eleveId: selectedEleveId,
          montant: montantNum,
          dateEcheance: dateEcheance,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      router.push("/admin/paiements");
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
        <Link href="/admin/paiements">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nouveau paiement</h1>
          <p className="text-gray-600 mt-2">Créez un nouveau paiement pour un élève</p>
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Informations du paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="Élève"
              value={selectedEleveId}
              onChange={(e) => setSelectedEleveId(e.target.value)}
              options={[
                { value: "", label: "Sélectionnez un élève" },
                ...eleves.map((e) => ({
                  value: e.id,
                  label: `${e.prenom} ${e.nom} - ${e.classe.nom}`,
                })),
              ]}
              required
            />

            <Input
              type="number"
              label="Montant (€)"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
              min="0"
              step="0.01"
              placeholder="50.00"
            />

            <Input
              type="date"
              label="Date d&apos;échéance"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              required
            />

            <Input
              label="Description (optionnel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cotisation mensuelle, frais d'inscription, etc."
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
              <Link href="/admin/paiements">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Annuler
                </Button>
              </Link>
              <Button type="submit" isLoading={isLoading}>
                Créer le paiement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
