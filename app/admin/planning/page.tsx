import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Plus, Calendar, Edit, Trash2 } from "lucide-react";

export default async function PlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;

  const classes = await prisma.classe.findMany({
    where: { mosqueeId },
    include: {
      planning: {
        orderBy: [
          { jour: "asc" },
          { heureDebut: "asc" },
        ],
      },
    },
  });

  const joursLabels: Record<string, string> = {
    LUNDI: "Lundi",
    MARDI: "Mardi",
    MERCREDI: "Mercredi",
    JEUDI: "Jeudi",
    VENDREDI: "Vendredi",
    SAMEDI: "Samedi",
    DIMANCHE: "Dimanche",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planning</h1>
          <p className="text-gray-600 mt-2">Gérez le planning des classes</p>
        </div>
        <Link href="/admin/planning/nouveau">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau planning
          </Button>
        </Link>
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
                {Object.entries(joursLabels).map(([jour, label]) => {
                  const cours = classe.planning.filter((p) => p.jour === jour);
                  if (cours.length === 0) return null;

                  return (
                    <div key={jour} className="border-l-4 border-primary pl-4">
                      <h3 className="font-semibold text-lg mb-2">{label}</h3>
                      <div className="space-y-2">
                        {cours.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
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
            <p className="text-gray-600">Aucune classe créée pour le moment</p>
            <Link href="/admin/classes/nouvelle">
              <Button className="mt-4">Créer votre première classe</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
