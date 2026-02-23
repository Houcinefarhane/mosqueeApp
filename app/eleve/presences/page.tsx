import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ElevePresencesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = session.user.id;
  const mosqueeId = session.user.mosqueeId;

  const eleve = await prisma.eleve.findFirst({
    where: {
      userId,
      mosqueeId,
    },
    include: {
      classe: {
        select: {
          nom: true,
        },
      },
      presences: {
        orderBy: { date: "desc" },
        take: 50,
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

  if (!eleve) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes présences</h1>
        </div>
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">
              Votre compte n'est pas encore lié à un dossier élève.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // Calculer les statistiques
  const totalPresences = eleve.presences.length;
  const presents = eleve.presences.filter((p) => p.statut === "PRESENT").length;
  const absents = eleve.presences.filter((p) => p.statut === "ABSENT").length;
  const retards = eleve.presences.filter((p) => p.statut === "RETARD").length;
  const tauxPresence =
    totalPresences > 0 ? Math.round((presents / totalPresences) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes présences</h1>
        <p className="text-gray-600 mt-2">
          {eleve.prenom} {eleve.nom} - {eleve.classe.nom}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de présence</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {tauxPresence}%
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Présents</p>
            <p className="text-3xl font-bold text-foreground mt-2">{presents}</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Absents</p>
            <p className="text-3xl font-bold text-foreground mt-2">{absents}</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Retards</p>
            <p className="text-3xl font-bold text-foreground mt-2">{retards}</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Historique des présences</CardTitle>
        </CardHeader>
        <CardContent>
          {eleve.presences.length > 0 ? (
            <div className="space-y-3">
              {eleve.presences.map((presence) => {
                const Icon = statutIcons[presence.statut];
                return (
                  <div
                    key={presence.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          statutColors[presence.statut]
                        }`}
                      >
                        <Icon className="w-6 h-6" />
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
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Aucune présence enregistrée pour le moment
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
