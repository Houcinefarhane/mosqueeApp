"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { CreditCard, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Paiement {
  id: string;
  montant: number;
  statut: string;
  dateEcheance: string | null;
  datePaiement: string | null;
  eleve: {
    id: string;
    prenom: string;
    nom: string;
    classe: {
      nom: string;
    };
  };
}

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPaiements = async () => {
      try {
        const response = await fetch("/api/parent/paiements");
        const data = await response.json();
        setPaiements(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaiements();
  }, []);

  const handlePayer = async (paiementId: string) => {
    try {
      const response = await fetch(`/api/parent/paiements/${paiementId}/payer`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Erreur lors du paiement");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'initiation du paiement");
    }
  };

  const statutIcons = {
    PAYE: CheckCircle,
    EN_ATTENTE: Clock,
    EN_RETARD: XCircle,
    ANNULE: XCircle,
  };

  const statutColors = {
    PAYE: "text-green-600 bg-green-50",
    EN_ATTENTE: "text-yellow-600 bg-yellow-50",
    EN_RETARD: "text-red-600 bg-red-50",
    ANNULE: "text-gray-600 bg-gray-50",
  };

  const statutLabels = {
    PAYE: "Payé",
    EN_ATTENTE: "En attente",
    EN_RETARD: "En retard",
    ANNULE: "Annulé",
  };

  if (isLoading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const paiementsEnAttente = paiements.filter(
    (p) => p.statut === "EN_ATTENTE" || p.statut === "EN_RETARD"
  );
  const paiementsPayes = paiements.filter((p) => p.statut === "PAYE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paiements</h1>
        <p className="text-gray-600 mt-2">Gérez les paiements de cotisation</p>
      </div>

      {paiementsEnAttente.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Paiements en attente</h2>
          <div className="space-y-4">
            {paiementsEnAttente.map((paiement) => {
              const Icon = statutIcons[paiement.statut as keyof typeof statutIcons];
              return (
                <Card key={paiement.id} variant="elevated">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            statutColors[paiement.statut as keyof typeof statutColors]
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {paiement.eleve.prenom} {paiement.eleve.nom} -{" "}
                            {paiement.eleve.classe.nom}
                          </p>
                          <p className="text-sm text-gray-600">
                            {statutLabels[paiement.statut as keyof typeof statutLabels]} -{" "}
                            {paiement.montant}€
                          </p>
                          {paiement.dateEcheance && (
                            <p className="text-xs text-gray-500 mt-1">
                              Échéance: {formatDate(paiement.dateEcheance)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => handlePayer(paiement.id)}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Payer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {paiementsPayes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Historique des paiements</h2>
          <div className="space-y-4">
            {paiementsPayes.map((paiement) => {
              const Icon = statutIcons.PAYE;
              return (
                <Card key={paiement.id} variant="outlined">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-50 text-green-600">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {paiement.eleve.prenom} {paiement.eleve.nom} -{" "}
                            {paiement.eleve.classe.nom}
                          </p>
                          <p className="text-sm text-gray-600">
                            Payé - {paiement.montant}€
                          </p>
                          {paiement.datePaiement && (
                            <p className="text-xs text-gray-500 mt-1">
                              Payé le: {formatDate(paiement.datePaiement)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {paiements.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun paiement pour le moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
