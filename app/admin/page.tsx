import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PresenceChart from "@/components/dashboard/PresenceChart";
import MosqueeBanner from "@/components/dashboard/MosqueeBanner";
import { Users, BookOpen, UserCheck, Calendar, AlertTriangle, Bell } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { PRESENCE_STATUS } from "@/lib/constants/status";
import { subDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDate } from "@/lib/utils";
import { getPresenceStatsToday } from "@/lib/dashboard/presence-today";

export const metadata = {
  title: "Tableau de bord",
};

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thirtyDaysAgo = subDays(today, 30);

  const [
    elevesCount,
    classesCount,
    professeursCount,
    presenceToday,
    presences30j,
    planningProchain,
    annoncesRecentes,
    mosquee,
  ] = await Promise.all([
    prisma.eleve.count({ where: { mosqueeId } }),
    prisma.classe.count({ where: { mosqueeId } }),
    prisma.user.count({ where: { mosqueeId, role: "PROFESSEUR" } }),
    getPresenceStatsToday(mosqueeId, today, tomorrow),
    prisma.presence.findMany({
      where: { mosqueeId, date: { gte: thirtyDaysAgo } },
      select: { date: true, statut: true },
    }),
    prisma.planning.findMany({
      where: { mosqueeId },
      include: { classe: { select: { nom: true } } },
      take: 6,
    }),
    prisma.annonce.findMany({
      where: { mosqueeId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.mosquee.findUnique({
      where: { id: mosqueeId },
      select: { id: true, nom: true },
    }),
  ]);

  const absencesAujourdhui =
    presenceToday.classeIds.length > 0
      ? await prisma.presence.findMany({
          where: {
            mosqueeId,
            date: { gte: today, lt: tomorrow },
            statut: { in: ["ABSENT", "RETARD", "EXCUSE"] },
            classeId: { in: presenceToday.classeIds },
          },
          include: {
            eleve: { select: { prenom: true, nom: true } },
            classe: { select: { nom: true } },
          },
          take: 8,
          orderBy: { date: "desc" },
        })
      : [];

  const presenceStatValue =
    presenceToday.coursCount === 0
      ? "—"
      : `${presenceToday.presents}/${presenceToday.attendus}`;

  const presenceStatTrend =
    presenceToday.coursCount === 0
      ? `Aucun cours le ${presenceToday.jourLabel.toLowerCase()}`
      : `${presenceToday.taux ?? 0} % · ${presenceToday.coursCount} cours · ${presenceToday.attendus} attendus`;

  const presenceTrendDirection =
    presenceToday.taux === null
      ? "neutral"
      : presenceToday.taux >= 80
        ? "up"
        : presenceToday.taux >= 50
          ? "neutral"
          : "down";

  const presenceByDay = new Map<
    string,
    { day: Date; presents: number; absents: number }
  >();
  for (let i = 29; i >= 0; i--) {
    const day = subDays(today, i);
    presenceByDay.set(format(day, "yyyy-MM-dd"), {
      day,
      presents: 0,
      absents: 0,
    });
  }
  for (const p of presences30j) {
    const key = format(new Date(p.date), "yyyy-MM-dd");
    const entry = presenceByDay.get(key);
    if (!entry) continue;
    if (p.statut === "PRESENT") entry.presents++;
    else if (p.statut === "ABSENT" || p.statut === "RETARD") entry.absents++;
  }
  const chartData = Array.from(presenceByDay.values()).map(
    ({ day, presents, absents }) => ({
      date: format(day, "d MMM", { locale: fr }),
      dateFull: format(day, "EEEE d MMMM yyyy", { locale: fr }),
      presents,
      absents,
    })
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue, ${session.user.name}`}
        breadcrumbs={[{ label: "Administration" }, { label: "Tableau de bord" }]}
      />

      {mosquee && (
        <MosqueeBanner nom={mosquee.nom} code={mosquee.id} />
      )}

      <div className="grid grid-cols-2 gap-1.5 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Élèves"
          value={elevesCount}
          icon={Users}
          variant="green"
          trend="Effectif inscrit"
          href="/admin/eleves"
        />
        <StatCard
          title="Classes"
          value={classesCount}
          icon={BookOpen}
          variant="gold"
          trend="Groupes actifs"
          href="/admin/classes"
        />
        <StatCard
          title="Professeurs"
          value={professeursCount}
          icon={UserCheck}
          variant="blue"
          trend="Équipe pédagogique"
          href="/admin/professeurs"
        />
        <StatCard
          title="Taux de présence"
          value={presenceStatValue}
          trend={presenceStatTrend}
          trendDirection={presenceTrendDirection}
          icon={Calendar}
          variant="purple"
        />
      </div>

      <PresenceChart data={chartData} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger" />
              Absences du jour
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {absencesAujourdhui.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune absence aujourd&apos;hui</p>
            ) : (
              absencesAujourdhui.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 ring-1 ring-primary/5">
                  <div>
                    <p className="text-sm font-medium">{a.eleve.prenom} {a.eleve.nom}</p>
                    <p className="text-xs text-gray-500">{a.classe.nom}</p>
                  </div>
                  <Badge className={PRESENCE_STATUS[a.statut].color}>
                    {PRESENCE_STATUS[a.statut].label}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {planningProchain.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun créneau planifié</p>
            ) : (
              planningProchain.map((p) => (
                <div key={p.id} className="rounded-lg bg-surface-muted px-3 py-2 ring-1 ring-primary/5">
                  <p className="text-sm font-medium">{p.matiere}</p>
                  <p className="text-xs text-gray-500">
                    {p.jour} · {p.heureDebut}–{p.heureFin} · {p.classe.nom}
                  </p>
                </div>
              ))
            )}
            <Link href="/admin/planning">
              <Button variant="outline" size="sm" className="w-full">Gérer le planning</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Annonces récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {annoncesRecentes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune annonce</p>
            ) : (
              annoncesRecentes.map((a) => (
                <div key={a.id} className="rounded-lg bg-surface-muted px-3 py-2 ring-1 ring-primary/5">
                  <p className="text-sm font-medium">{a.titre}</p>
                  <p className="text-xs text-gray-500">{formatDate(a.createdAt)}</p>
                </div>
              ))
            )}
            <Link href="/admin/annonces">
              <Button variant="outline" size="sm" className="w-full">Voir les annonces</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
