import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Calendar, Clock, BookOpen } from "lucide-react";

const joursLabels: Record<string, string> = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
};

export default async function ElevePlanningPage() {
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
          niveau: true,
          planning: {
            orderBy: [
              { jour: "asc" },
              { heureDebut: "asc" },
            ],
          },
        },
      },
    },
  });

  if (!eleve) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mon planning</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mon planning</h1>
        <p className="text-gray-600 mt-2">
          {eleve.prenom} {eleve.nom} - {eleve.classe.nom} ({eleve.classe.niveau})
        </p>
      </div>

      {eleve.classe.planning.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(joursLabels).map(([jour, label]) => {
            const cours = eleve.classe.planning.filter((p) => p.jour === jour);
            if (cours.length === 0) return null;

            return (
              <Card key={jour} variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cours.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{c.matiere}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {c.heureDebut} - {c.heureFin}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Aucun planning défini pour votre classe
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
