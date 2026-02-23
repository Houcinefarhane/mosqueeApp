import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { CreditCard, CheckCircle, Clock, XCircle, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function PaiementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;

  const paiements = await prisma.paiement.findMany({
    where: { mosqueeId },
    include: {
      eleve: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          classe: {
            select: {
              nom: true,
            },
          },
        },
      },
      parent: {
        select: {
          nom: true,
          prenom: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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

  const totalPaye = paiements
    .filter((p) => p.statut === "PAYE")
    .reduce((sum, p) => sum + p.montant, 0);

  const totalEnAttente = paiements
    .filter((p) => p.statut === "EN_ATTENTE" || p.statut === "EN_RETARD")
    .reduce((sum, p) => sum + p.montant, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paiements</h1>
          <p className="text-gray-600 mt-2">Gérez les paiements de cotisation</p>
        </div>
        <Link href="/admin/paiements/nouveau">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau paiement
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total payé</p>
                <p className="text-xl font-semibold">{totalPaye.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-xl font-semibold">{totalEnAttente.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Tous les paiements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Élève
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paiements.map((paiement) => {
                  const Icon = statutIcons[paiement.statut as keyof typeof statutIcons];
                  return (
                    <tr key={paiement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paiement.eleve.prenom} {paiement.eleve.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {paiement.eleve.classe.nom}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {paiement.parent ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {paiement.parent.prenom} {paiement.parent.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              {paiement.parent.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Aucun</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {paiement.montant}€
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              statutColors[paiement.statut as keyof typeof statutColors]
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm text-gray-900">
                            {statutLabels[paiement.statut as keyof typeof statutLabels]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {paiement.datePaiement
                            ? formatDate(paiement.datePaiement)
                            : paiement.dateEcheance
                            ? `Échéance: ${formatDate(paiement.dateEcheance)}`
                            : formatDate(paiement.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {paiements.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun paiement enregistré</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
