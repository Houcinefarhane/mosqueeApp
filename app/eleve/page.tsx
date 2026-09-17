import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PresenceCalendar from "@/components/dashboard/PresenceCalendar";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { BookOpen, TrendingUp, Calendar, FileText } from "lucide-react";
import { JOURS, JOURS_LABELS, getMonthStart } from "@/lib/constants/planning";

export const metadata = { title: "Tableau de bord" };

export default async function EleveDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = session.user.id;
  const mosqueeId = session.user.mosqueeId;
  const monthStart = getMonthStart();

  const eleve = await prisma.eleve.findFirst({
    where: { userId, mosqueeId },
    include: {
      classe: {
        select: { nom: true, niveau: true, id: true },
      },
    },
  });

  if (!eleve) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tableau de bord"
          breadcrumbs={[{ label: "Espace élève" }]}
        />
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            Votre compte n&apos;est pas encore lié à un dossier élève. Contactez
            l&apos;administration.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [notesRecentes, presencesMois, planning] = await Promise.all([
    prisma.note.findMany({
      where: { eleveId: eleve.id, mosqueeId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.presence.findMany({
      where: {
        eleveId: eleve.id,
        mosqueeId,
        date: { gte: monthStart },
      },
      select: { date: true, statut: true },
      orderBy: { date: "asc" },
    }),
    prisma.planning.findMany({
      where: { classeId: eleve.classe.id, mosqueeId },
      orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
    }),
  ]);

  const moyenne =
    notesRecentes.length > 0
      ? notesRecentes.reduce(
          (sum, n) => sum + (n.valeur / n.noteMax) * 20,
          0
        ) / notesRecentes.length
      : 0;

  const presentsMois = presencesMois.filter((p) => p.statut === "PRESENT").length;
  const tauxMois =
    presencesMois.length > 0
      ? Math.round((presentsMois / presencesMois.length) * 100)
      : 0;

  const planningSemaine = JOURS.filter((j) => j !== "DIMANCHE")
    .map((jour) => ({
      jour,
      label: JOURS_LABELS[jour],
      cours: planning.filter((p) => p.jour === jour),
    }))
    .filter((d) => d.cours.length > 0);

  const calendarData = presencesMois.map((p) => ({
    date: p.date.toISOString(),
    statut: p.statut,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue, ${session.user.name}`}
        breadcrumbs={[{ label: "Espace élève" }, { label: "Tableau de bord" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Ma classe"
          value={eleve.classe.nom}
          trend={eleve.classe.niveau}
          icon={BookOpen}
          variant="gold"
        />
        <StatCard
          title="Moyenne récente"
          value={moyenne > 0 ? moyenne.toFixed(1) : "—"}
          trend={`${notesRecentes.length} note(s)`}
          trendDirection={moyenne >= 12 ? "up" : moyenne >= 10 ? "neutral" : moyenne > 0 ? "down" : "neutral"}
          icon={TrendingUp}
          variant="blue"
        />
        <StatCard
          title="Présence ce mois"
          value={`${tauxMois}%`}
          trend={`${presentsMois}/${presencesMois.length} séances`}
          trendDirection={tauxMois >= 80 ? "up" : tauxMois >= 50 ? "neutral" : "down"}
          icon={Calendar}
          variant="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Notes récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Mes notes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notesRecentes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune note pour le moment</p>
            ) : (
              <div className="space-y-2">
                {notesRecentes.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{n.matiere}</p>
                      {n.commentaire && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {n.commentaire}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-sm font-bold">
                      {n.valeur}/{n.noteMax}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Link href="/eleve/notes">
              <Button variant="outline" size="sm" className="mt-3 w-full">
                Toutes mes notes
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Planning semaine */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Mon planning de la semaine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {planningSemaine.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun cours planifié</p>
            ) : (
              planningSemaine.map((jour) => (
                <div key={jour.jour}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {jour.label}
                  </p>
                  <div className="space-y-1">
                    {jour.cours.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{c.matiere}</span>
                        <span className="text-primary">
                          {c.heureDebut}–{c.heureFin}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
            <Link href="/eleve/planning">
              <Button variant="outline" size="sm" className="w-full">
                Planning complet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Calendrier présences */}
      <Card>
        <CardHeader>
          <CardTitle>Mes présences du mois</CardTitle>
        </CardHeader>
        <CardContent>
          {presencesMois.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune présence ce mois</p>
          ) : (
            <PresenceCalendar presences={calendarData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
