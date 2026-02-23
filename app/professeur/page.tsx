import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Users, Calendar } from "lucide-react";

export default async function ProfesseurDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const professeurId = session.user.id;
  const mosqueeId = session.user.mosqueeId;

  const [classesCount, elevesCount, presencesAujourdhui] = await Promise.all([
    prisma.classe.count({
      where: {
        mosqueeId,
        professeurId,
      },
    }),
    prisma.eleve.count({
      where: {
        mosqueeId,
        classe: {
          professeurId,
        },
      },
    }),
    prisma.presence.count({
      where: {
        mosqueeId,
        professeurId,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ]);

  const stats = [
    {
      title: "Mes classes",
      value: classesCount,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      title: "Mes élèves",
      value: elevesCount,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Appels aujourd'hui",
      value: presencesAujourdhui,
      icon: Calendar,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">Bienvenue, {session.user.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`w-12 h-12 ${stat.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
