import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import PageHeader from "@/components/layout/PageHeader";
import WeeklyPlanningGrid from "@/components/planning/WeeklyPlanningGrid";
import { Calendar } from "lucide-react";
import { getJourFromDate, type JourSemaine } from "@/lib/constants/planning";

export default async function PlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const professeurId = session.user.id;
  const mosqueeId = session.user.mosqueeId;
  const today = getJourFromDate();

  const classes = await prisma.classe.findMany({
    where: {
      mosqueeId,
      professeurId,
    },
    include: {
      planning: {
        orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
      },
    },
  });

  const events = classes.flatMap((classe) =>
    classe.planning.map((p) => ({
      id: p.id,
      jour: p.jour as JourSemaine,
      heureDebut: p.heureDebut,
      heureFin: p.heureFin,
      matiere: p.matiere,
      meta: [classe.nom, classe.salle].filter(Boolean).join(" · "),
    }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon planning"
        description="Vue hebdomadaire de tous vos cours"
        breadcrumbs={[
          { label: "Espace professeur", href: "/professeur" },
          { label: "Planning" },
        ]}
      />

      {classes.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-brun-doux/50" />
            <p className="text-brun-doux">Aucune classe assignée</p>
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated">
          <CardContent className="p-3 sm:p-4">
            <WeeklyPlanningGrid
              events={events}
              today={today}
              emptyMessage="Aucun cours planifié pour vos classes"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
