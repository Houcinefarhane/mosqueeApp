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
              Votre compte n&apos;est pas encore lié à un dossier élève.
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes présences</h1>
        <p className="text-sm text-gray-600 mt-1">
          {eleve.prenom} {eleve.nom} - {eleve.classe.nom}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Card variant="elevated">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-600">Taux de présence</p>
            <p className="text-xl font-semibold text-foreground mt-1">
              {tauxPresence}%
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-600">Présents</p>
            <p className="text-xl font-semibold text-foreground mt-1">{presents}</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-600">Absents</p>
            <p className="text-xl font-semibold text-foreground mt-1">{absents}</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-gray-600">Retards</p>
            <p className="text-xl font-semibold text-foreground mt-1">{retards}</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-base">Historique des présences</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {eleve.presences.length > 0 ? (
            <div className="space-y-2">
              {eleve.presences.map((presence) => {
                const Icon = statutIcons[presence.statut];
                return (
                  <div
                    key={presence.id}
                    className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          statutColors[presence.statut]
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          {formatDate(presence.date)} -{" "}
                          {statutLabels[presence.statut]}
                        </p>
                        {presence.commentaire && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            {presence.commentaire}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
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
