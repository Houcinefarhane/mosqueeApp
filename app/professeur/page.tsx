import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { BookOpen, Users, TrendingUp, ClipboardList, Calendar, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getJourFromDate, JOURS_LABELS, getMonthStart } from "@/lib/constants/planning";

export const metadata = { title: "Tableau de bord" };

export default async function ProfesseurDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const professeurId = session.user.id;
  const mosqueeId = session.user.mosqueeId;
  const todayJour = getJourFromDate();
  const monthStart = getMonthStart();

  const [classes, appelsRecents, presencesMois] = await Promise.all([
    prisma.classe.findMany({
      where: { mosqueeId, professeurId },
      include: {
        _count: { select: { eleves: true } },
        planning: {
          where: { jour: todayJour },
          orderBy: { heureDebut: "asc" },
        },
      },
      orderBy: { nom: "asc" },
    }),
    prisma.appel.findMany({
      where: { mosqueeId, professeurId },
      include: {
        classe: { select: { nom: true } },
        _count: { select: { presences: true } },
      },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.presence.findMany({
      where: {
        mosqueeId,
        professeurId,
        date: { gte: monthStart },
      },
      select: { statut: true },
    }),
  ]);

  const totalEleves = classes.reduce((s, c) => s + c._count.eleves, 0);
  const totalPresences = presencesMois.length;
  const presents = presencesMois.filter((p) => p.statut === "PRESENT").length;
  const tauxPresenceMois =
    totalPresences > 0 ? Math.round((presents / totalPresences) * 100) : 0;

  const classesDuJour = classes.filter((c) => c.planning.length > 0);

  const prochainsCours = classes
    .flatMap((c) =>
      c.planning.map((p) => ({
        ...p,
        classeNom: c.nom,
        classeId: c.id,
      }))
    )
    .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue, ${session.user.name}`}
        breadcrumbs={[{ label: "Espace professeur" }, { label: "Tableau de bord" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Mes classes"
          value={classes.length}
          icon={BookOpen}
          variant="gold"
          trend="Groupes assignés"
          href="/professeur/classes"
        />
        <StatCard
          title="Mes élèves"
          value={totalEleves}
          icon={Users}
          variant="green"
          trend="Total suivis"
        />
        <StatCard
          title="Taux de présence (mois)"
          value={`${tauxPresenceMois}%`}
          trend={`${presents}/${totalPresences} séances`}
          trendDirection={tauxPresenceMois >= 80 ? "up" : tauxPresenceMois >= 50 ? "neutral" : "down"}
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Classes du jour — raccourci appel */}
      {classesDuJour.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Cours du jour — {JOURS_LABELS[todayJour]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classesDuJour.map((classe) => (
              <div
                key={classe.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{classe.nom}</p>
                  <p className="text-sm text-gray-500">
                    {classe._count.eleves} élève(s) ·{" "}
                    {classe.planning
                      .map((p) => `${p.heureDebut}–${p.heureFin} (${p.matiere})`)
                      .join(", ")}
                  </p>
                </div>
                <Link href={`/professeur/appel?classeId=${classe.id}`}>
                  <Button size="sm">
                    <ClipboardList className="h-4 w-4" />
                    Faire l&apos;appel
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mes classes */}
        <Card>
          <CardHeader>
            <CardTitle>Mes classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {classes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune classe assignée</p>
            ) : (
              classes.map((classe) => (
                <Link
                  key={classe.id}
                  href="/professeur/classes"
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium">{classe.nom}</p>
                    <p className="text-xs text-gray-500">{classe.niveau}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {classe._count.eleves} élève(s)
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Derniers appels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Derniers appels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {appelsRecents.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun appel enregistré</p>
            ) : (
              appelsRecents.map((appel) => (
                <div
                  key={appel.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{appel.classe.nom}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(appel.date)} · {appel._count.presences} élève(s)
                    </p>
                  </div>
                  <Link href="/professeur/appel/historique">
                    <Button variant="ghost" size="sm">
                      Voir
                    </Button>
                  </Link>
                </div>
              ))
            )}
            <Link href="/professeur/appel/historique">
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Historique complet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Prochains cours ({JOURS_LABELS[todayJour]})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {prochainsCours.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun cours prévu aujourd&apos;hui</p>
          ) : (
            prochainsCours.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{c.matiere}</p>
                  <p className="text-xs text-gray-500">{c.classeNom}</p>
                </div>
                <span className="text-sm font-medium text-primary">
                  {c.heureDebut}–{c.heureFin}
                </span>
              </div>
            ))
          )}
          <Link href="/professeur/planning">
            <Button variant="outline" size="sm" className="mt-2 w-full">
              Voir mon planning
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
