import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import PageHeader from "@/components/layout/PageHeader";
import WeeklyPlanningGrid from "@/components/planning/WeeklyPlanningGrid";
import { getJourFromDate, type JourSemaine } from "@/lib/constants/planning";

export default async function ElevePlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = session.user.id;
  const mosqueeId = session.user.mosqueeId;
  const today = getJourFromDate();

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
          salle: true,
          planning: {
            orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
          },
        },
      },
    },
  });

  if (!eleve) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mon planning" />
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <p className="text-brun-doux">
              Votre compte n&apos;est pas encore lié à un dossier élève.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const events = eleve.classe.planning.map((p) => ({
    id: p.id,
    jour: p.jour as JourSemaine,
    heureDebut: p.heureDebut,
    heureFin: p.heureFin,
    matiere: p.matiere,
    meta: [eleve.classe.nom, eleve.classe.salle].filter(Boolean).join(" · "),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon planning"
        description={`${eleve.prenom} ${eleve.nom} · ${eleve.classe.nom} (${eleve.classe.niveau})`}
        breadcrumbs={[
          { label: "Espace élève", href: "/eleve" },
          { label: "Planning" },
        ]}
      />

      <Card variant="elevated">
        <CardContent className="p-3 sm:p-4">
          <WeeklyPlanningGrid
            events={events}
            today={today}
            emptyMessage="Aucun cours planifié pour votre classe"
          />
        </CardContent>
      </Card>
    </div>
  );
}
