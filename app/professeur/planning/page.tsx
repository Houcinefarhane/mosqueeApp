import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Calendar, Clock } from "lucide-react";

const jours = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
  "DIMANCHE",
];

const joursLabels: Record<string, string> = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
};

export default async function PlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const professeurId = session.user.id;
  const mosqueeId = session.user.mosqueeId;

  const classes = await prisma.classe.findMany({
    where: {
      mosqueeId,
      professeurId,
    },
    include: {
      planning: {
        orderBy: [
          { jour: "asc" },
          { heureDebut: "asc" },
        ],
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mon planning</h1>
        <p className="text-gray-600 mt-2">Consultez votre planning</p>
      </div>

      {classes.map((classe) => (
        <Card key={classe.id} variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {classe.nom} - {classe.niveau}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classe.planning.length > 0 ? (
              <div className="space-y-4">
                {jours.map((jour) => {
                  const cours = classe.planning.filter((p) => p.jour === jour);
                  if (cours.length === 0) return null;

                  return (
                    <div key={jour} className="border-l-4 border-primary pl-4">
                      <h3 className="font-semibold text-lg mb-2">
                        {joursLabels[jour]}
                      </h3>
                      <div className="space-y-2">
                        {cours.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">{c.matiere}</p>
                              <p className="text-sm text-gray-600">
                                {c.heureDebut} - {c.heureFin}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Aucun planning défini pour cette classe
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {classes.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune classe assignée</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
