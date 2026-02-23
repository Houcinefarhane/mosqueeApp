import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText, Calendar, CreditCard } from "lucide-react";

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parentId = session.user.id;
  const mosqueeId = session.user.mosqueeId;

  const eleves = await prisma.eleve.findMany({
    where: {
      mosqueeId,
      parentId,
    },
    include: {
      classe: true,
    },
  });

  const elevesIds = eleves.map((e) => e.id);

  const [presencesCount, notesCount, paiementsEnAttente] = await Promise.all([
    prisma.presence.count({
      where: {
        mosqueeId,
        eleveId: { in: elevesIds },
      },
    }),
    prisma.note.count({
      where: {
        mosqueeId,
        eleveId: { in: elevesIds },
      },
    }),
    prisma.paiement.count({
      where: {
        mosqueeId,
        eleveId: { in: elevesIds },
        statut: "EN_ATTENTE",
      },
    }),
  ]);

  const stats = [
    {
      title: "Présences",
      value: presencesCount,
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Notes",
      value: notesCount,
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Paiements en attente",
      value: paiementsEnAttente,
      icon: CreditCard,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">Bienvenue, {session.user.name}</p>
      </div>

      {eleves.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Mes enfants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {eleves.map((eleve) => (
                <div
                  key={eleve.id}
                  className="p-4 bg-gray-50 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {eleve.prenom} {eleve.nom}
                    </p>
                    <p className="text-sm text-gray-600">{eleve.classe.nom}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
