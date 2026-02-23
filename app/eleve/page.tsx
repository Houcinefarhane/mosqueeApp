import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText, Calendar, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function EleveDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = session.user.id;
  const mosqueeId = session.user.mosqueeId;

  // Trouver l'élève lié à ce compte
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
        },
      },
      _count: {
        select: {
          presences: true,
          notes: true,
        },
      },
    },
  });

  if (!eleve) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
        </div>
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">
              Votre compte n'est pas encore lié à un dossier élève. Contactez l'administration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculer la moyenne des notes
  const notes = await prisma.note.findMany({
    where: {
      eleveId: eleve.id,
      mosqueeId,
    },
  });

  const moyenne =
    notes.length > 0
      ? notes.reduce((sum, note) => sum + (note.valeur / note.noteMax) * 20, 0) /
        notes.length
      : 0;

  // Compter les présences récentes
  const presencesRecentes = await prisma.presence.count({
    where: {
      eleveId: eleve.id,
      mosqueeId,
      date: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
  });

  const stats = [
    {
      title: "Ma classe",
      value: eleve.classe.nom,
      subtitle: eleve.classe.niveau,
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Moyenne générale",
      value: moyenne > 0 ? moyenne.toFixed(1) : "N/A",
      subtitle: `${notes.length} note(s)`,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Présences (30j)",
      value: presencesRecentes,
      subtitle: `${eleve._count.presences} au total`,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
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
            <Card key={stat.title} variant="elevated" className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">
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
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/eleve/notes">
          <Card variant="elevated" className="hover-lift cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Mes notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Consultez toutes vos notes et votre moyenne
              </p>
              <p className="text-sm text-primary mt-2 font-medium">
                {notes.length} note(s) enregistrée(s)
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/eleve/presences">
          <Card variant="elevated" className="hover-lift cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Mes présences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Consultez votre historique de présence
              </p>
              <p className="text-sm text-primary mt-2 font-medium">
                {eleve._count.presences} présence(s) enregistrée(s)
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
