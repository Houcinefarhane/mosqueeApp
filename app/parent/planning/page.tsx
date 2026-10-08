import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import PageHeader from "@/components/layout/PageHeader";
import WeeklyPlanningGrid from "@/components/planning/WeeklyPlanningGrid";
import { Calendar } from "lucide-react";
import { getJourFromDate, type JourSemaine } from "@/lib/constants/planning";

export default async function PlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parentId = session.user.id;
  const mosqueeId = session.user.mosqueeId;
  const today = getJourFromDate();

  const eleves = await prisma.eleve.findMany({
    where: {
      mosqueeId,
      parentId,
    },
    include: {
      classe: {
        include: {
          planning: {
            orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning"
        description="Vue hebdomadaire des cours de vos enfants"
        breadcrumbs={[
          { label: "Espace parent", href: "/parent" },
          { label: "Planning" },
        ]}
      />

      {eleves.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-brun-doux/50" />
            <p className="text-brun-doux">Aucun enfant inscrit</p>
          </CardContent>
        </Card>
      ) : (
        eleves.map((eleve) => {
          const events = eleve.classe.planning.map((p) => ({
            id: p.id,
            jour: p.jour as JourSemaine,
            heureDebut: p.heureDebut,
            heureFin: p.heureFin,
            matiere: p.matiere,
            meta: eleve.classe.nom,
          }));

          return (
            <Card key={eleve.id} variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle>
                  {eleve.prenom} {eleve.nom} · {eleve.classe.nom}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <WeeklyPlanningGrid
                  events={events}
                  today={today}
                  emptyMessage="Aucun cours planifié pour cette classe"
                />
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
