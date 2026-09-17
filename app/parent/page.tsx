import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { AlertTriangle, Bell, BookOpen, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getJourFromDate, JOURS_LABELS } from "@/lib/constants/planning";
import { PRESENCE_STATUS } from "@/lib/constants/status";
import { subDays } from "date-fns";

export const metadata = { title: "Tableau de bord" };

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parentId = session.user.id;
  const mosqueeId = session.user.mosqueeId;
  const todayJour = getJourFromDate();
  const sevenDaysAgo = subDays(new Date(), 7);

  const eleves = await prisma.eleve.findMany({
    where: { mosqueeId, parentId },
    include: {
      classe: {
        include: {
          planning: {
            where: { jour: todayJour },
            orderBy: { heureDebut: "asc" },
            take: 1,
          },
        },
      },
      presences: { orderBy: { date: "desc" }, take: 3 },
      notes: { orderBy: { createdAt: "desc" }, take: 2 },
    },
  });

  const elevesIds = eleves.map((e) => e.id);

  const [annonces, absencesRecentes] = await Promise.all([
    prisma.annonce.findMany({
      where: { mosqueeId },
      include: { auteur: { select: { prenom: true, nom: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.presence.findMany({
      where: {
        mosqueeId,
        eleveId: { in: elevesIds },
        statut: { in: ["ABSENT", "RETARD"] },
        date: { gte: sevenDaysAgo },
      },
      include: { eleve: { select: { prenom: true, nom: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue, ${session.user.name}`}
        breadcrumbs={[{ label: "Espace parent" }, { label: "Tableau de bord" }]}
      />

      {absencesRecentes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-orange-800">
                  Absences récentes non justifiées
                </p>
                {absencesRecentes.map((a) => (
                  <p key={a.id} className="text-sm text-orange-700">
                    {a.eleve.prenom} {a.eleve.nom} —{" "}
                    {PRESENCE_STATUS[a.statut].label} le {formatDate(a.date)}
                  </p>
                ))}
                <Link href="/parent/presences">
                  <Button variant="outline" size="sm" className="mt-1">
                    Voir les présences
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {eleves.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            Aucun enfant associé à votre compte
          </CardContent>
        </Card>
      ) : (
        eleves.map((eleve) => {
          const prochainCours = eleve.classe.planning[0];
          return (
            <Card key={eleve.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{eleve.prenom} {eleve.nom}</span>
                  <Badge className="border-primary/20 bg-primary/10 text-primary">
                    {eleve.classe.nom}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Présences récentes
                    </p>
                    {eleve.presences.length === 0 ? (
                      <p className="text-sm text-gray-400">Aucune</p>
                    ) : (
                      <div className="space-y-1.5">
                        {eleve.presences.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{formatDate(p.date)}</span>
                            <Badge className={PRESENCE_STATUS[p.statut].color}>
                              {PRESENCE_STATUS[p.statut].label}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <BookOpen className="h-3.5 w-3.5" />
                      Dernières notes
                    </p>
                    {eleve.notes.length === 0 ? (
                      <p className="text-sm text-gray-400">Aucune note</p>
                    ) : (
                      <div className="space-y-1.5">
                        {eleve.notes.map((n) => (
                          <div key={n.id} className="text-sm">
                            <span className="font-medium">{n.valeur}/{n.noteMax}</span>
                            <span className="ml-2 text-gray-500">{n.matiere}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Prochain cours ({JOURS_LABELS[todayJour]})
                    </p>
                    {prochainCours ? (
                      <div className="text-sm">
                        <p className="font-medium">{prochainCours.matiere}</p>
                        <p className="text-gray-500">
                          {prochainCours.heureDebut}–{prochainCours.heureFin}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Pas de cours aujourd&apos;hui</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Dernières annonces
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {annonces.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune annonce</p>
          ) : (
            annonces.map((a) => (
              <div key={a.id} className="rounded-lg border border-gray-100 px-3 py-2">
                <p className="text-sm font-medium">{a.titre}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{a.contenu}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDate(a.createdAt)} · {a.auteur.prenom} {a.auteur.nom}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
