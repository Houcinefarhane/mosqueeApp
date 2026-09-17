import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function PresencesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parentId = session.user.id;
  const mosqueeId = session.user.mosqueeId;

  const eleves = await prisma.eleve.findMany({
    where: {
      mosqueeId,
      parentId,
    },
    include: {
      classe: {
        select: {
          nom: true,
        },
      },
      presences: {
        orderBy: { date: "desc" },
        take: 30,
        include: {
          professeur: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      },
    },
  });

  const statutIcons = {
    PRESENT: CheckCircle,
    ABSENT: XCircle,
    RETARD: Clock,
    EXCUSE: AlertCircle,
  };

  const statutColors = {
    PRESENT: "text-green-600 bg-green-50",
    ABSENT: "text-red-600 bg-red-50",
    RETARD: "text-yellow-600 bg-yellow-50",
    EXCUSE: "text-blue-600 bg-blue-50",
  };

  const statutLabels = {
    PRESENT: "Présent",
    ABSENT: "Absent",
    RETARD: "Retard",
    EXCUSE: "Excusé",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Présences</h1>
        <p className="text-gray-600 mt-2">Consultez les présences de vos enfants</p>
      </div>

      {eleves.map((eleve) => (
        <Card key={eleve.id} variant="elevated">
          <CardHeader>
            <CardTitle>
              {eleve.prenom} {eleve.nom} - {eleve.classe.nom}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eleve.presences.length > 0 ? (
              <div className="space-y-3">
                {eleve.presences.map((presence) => {
                  const Icon = statutIcons[presence.statut];
                  return (
                    <div
                      key={presence.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${statutColors[presence.statut]}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {formatDate(presence.date)} -{" "}
                            {statutLabels[presence.statut]}
                          </p>
                          {presence.commentaire && (
                            <p className="text-sm text-gray-600 mt-1">
                              {presence.commentaire}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Par {presence.professeur.prenom}{" "}
                            {presence.professeur.nom}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Aucune présence enregistrée pour le moment
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {eleves.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Aucun enfant inscrit</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
