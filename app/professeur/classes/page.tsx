import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/layout/PageHeader";
import Link from "next/link";
import { BookOpen, Users, Calendar, ChevronRight } from "lucide-react";

export default async function MesClassesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const professeurId = session.user.id;
  const mosqueeId = session.user.mosqueeId;

  const classes = await prisma.classe.findMany({
    where: {
      mosqueeId,
      professeurId,
    },
    include: {
      _count: {
        select: {
          eleves: true,
          planning: true,
        },
      },
    },
    orderBy: { nom: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes classes"
        description="Les classes qui vous sont assignées"
        breadcrumbs={[
          { label: "Espace professeur", href: "/professeur" },
          { label: "Classes" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classe) => (
          <Card key={classe.id} variant="elevated" className="flex flex-col">
            <Link
              href={`/professeur/classes/${classe.id}`}
              className="block transition-opacity hover:opacity-95"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <BookOpen className="h-5 w-5 shrink-0 text-or" />
                    <CardTitle className="truncate">{classe.nom}</CardTitle>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-brun-doux" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm text-brun-doux">Niveau : {classe.niveau}</p>
                  <div className="flex items-center gap-2 text-sm text-brun-doux">
                    <Users className="h-4 w-4" />
                    <span>{classe._count.eleves} élève(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brun-doux">
                    <Calendar className="h-4 w-4" />
                    <span>{classe._count.planning} cours au planning</span>
                  </div>
                  <p className="pt-1 text-xs font-semibold text-or">
                    Voir le détail des élèves →
                  </p>
                </div>
              </CardContent>
            </Link>
            <CardContent className="mt-auto border-t border-filet pt-4">
              <div className="flex gap-2">
                <Link href={`/professeur/appel?classeId=${classe.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full min-h-11">
                    Appel
                  </Button>
                </Link>
                <Link href={`/professeur/notes?classeId=${classe.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full min-h-11">
                    Notes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune classe assignée</p>
            <p className="text-sm text-gray-500 mt-2">
              Contactez l&apos;administrateur pour vous assigner une classe
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
