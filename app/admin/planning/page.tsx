import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import PlanningTimetable from "@/components/planning/PlanningTimetable";
import {
  getJourFromDate,
  JOURS_LABELS,
  JOURS_SEMAINE,
} from "@/lib/constants/planning";

export default async function PlanningPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;
  const today = getJourFromDate();

  const plannings = await prisma.planning.findMany({
    where: { mosqueeId },
    include: {
      classe: {
        select: {
          id: true,
          nom: true,
          niveau: true,
          salle: true,
          professeur: {
            select: { prenom: true, nom: true },
          },
        },
      },
    },
    orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
  });

  const classesAvecCours = new Set(plannings.map((p) => p.classeId)).size;
  const joursActifs = JOURS_SEMAINE.filter((j) =>
    plannings.some((p) => p.jour === j)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Emploi du temps</h1>
          <p className="mt-2 text-gray-600">
            {plannings.length} cours · {classesAvecCours} classes ·{" "}
            {joursActifs} jour{joursActifs > 1 ? "s" : ""} actif
            {joursActifs > 1 ? "s" : ""}
            {plannings.length > 0 && (
              <span className="text-primary">
                {" "}
                · Aujourd&apos;hui : {JOURS_LABELS[today]}
              </span>
            )}
          </p>
        </div>
        <Link href="/admin/planning/nouveau">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un cours
          </Button>
        </Link>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Planning hebdomadaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plannings.length > 0 ? (
            <PlanningTimetable entries={plannings} today={today} />
          ) : (
            <div className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-gray-600">Aucun cours planifié pour le moment</p>
              <Link href="/admin/planning/nouveau">
                <Button className="mt-4">Ajouter un premier cours</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
