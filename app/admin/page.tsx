import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, BookOpen, CreditCard, Calendar, UserCheck, Clock } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    elevesCount,
    classesCount,
    professeursCount,
    paiementsPayes,
    paiementsEnAttente,
    presencesAujourdhui,
    elevesTotal,
    paiementsTotal,
    mosquee,
  ] = await Promise.all([
    prisma.eleve.count({ where: { mosqueeId } }),
    prisma.classe.count({ where: { mosqueeId } }),
    prisma.user.count({ where: { mosqueeId, role: "PROFESSEUR" } }),
    prisma.paiement.count({ where: { mosqueeId, statut: "PAYE" } }),
    prisma.paiement.count({
      where: {
        mosqueeId,
        statut: { in: ["EN_ATTENTE", "EN_RETARD"] },
      },
    }),
    prisma.presence.count({
      where: {
        mosqueeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
    prisma.eleve.count({ where: { mosqueeId } }),
    prisma.paiement.aggregate({
      where: { mosqueeId, statut: "PAYE" },
      _sum: { montant: true },
    }),
    prisma.mosquee.findUnique({
      where: { id: mosqueeId },
      select: { id: true, nom: true },
    }),
  ]);

  const tauxPresence = elevesTotal > 0
    ? Math.round((presencesAujourdhui / elevesTotal) * 100)
    : 0;

  const stats = [
    {
      title: "Élèves",
      value: elevesCount,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/eleves",
    },
    {
      title: "Classes",
      value: classesCount,
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/classes",
    },
    {
      title: "Professeurs",
      value: professeursCount,
      icon: UserCheck,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/professeurs",
    },
    {
      // eslint-disable-next-line react/no-unescaped-entities
      title: "Présences aujourd'hui",
      value: `${presencesAujourdhui}/${elevesTotal}`,
      subtitle: `${tauxPresence}%`,
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
      link: "/admin/planning",
    },
  ];

  const paiementsStats = [
    {
      title: "Paiements payés",
      value: paiementsPayes,
      amount: paiementsTotal._sum.montant || 0,
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "En attente",
      value: paiementsEnAttente,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">Bienvenue, {session.user.name}</p>
      </div>

      {mosquee && (
        <Card variant="elevated" className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Votre mosquée</p>
                <p className="text-xl font-bold text-primary">{mosquee.nom}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">Code mosquée</p>
                <code className="text-sm font-mono bg-white px-3 py-1 rounded border border-primary text-primary">
                  {mosquee.id}
                </code>
                <p className="text-xs text-gray-500 mt-1">
                  Partagez ce code avec les parents et professeurs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.link}>
              <Card variant="elevated" className="hover-lift cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      {stat.subtitle && (
                        <p className="text-sm text-gray-500 mt-1">
                          {stat.subtitle}
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paiementsStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className={`p-4 rounded-lg ${stat.bgColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                        <div>
                          <p className="text-sm text-gray-600">{stat.title}</p>
                          <p className="text-xl font-bold text-foreground">
                            {stat.value}
                          </p>
                          {stat.amount !== undefined && stat.amount > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              {stat.amount.toFixed(2)}€
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/admin/paiements" className="block mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Voir tous les paiements
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/eleves/nouveau">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Ajouter un élève
                </Button>
              </Link>
              <Link href="/admin/classes/nouvelle">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Créer une classe
                </Button>
              </Link>
              <Link href="/admin/professeurs/nouveau">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Ajouter un professeur
                </Button>
              </Link>
              <Link href="/admin/planning/nouveau">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Créer un planning
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
