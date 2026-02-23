import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { BookOpen, Users, Calendar } from "lucide-react";

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes classes</h1>
        <p className="text-gray-600 mt-2">Les classes qui vous sont assignées</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classe) => (
          <Card key={classe.id} variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle>{classe.nom}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Niveau: {classe.niveau}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{classe._count.eleves} élève(s)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{classe._count.planning} cours au planning</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href="/professeur/appel" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Faire l&apos;appel
                    </Button>
                  </Link>
                  <Link href="/professeur/notes" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Ajouter note
                    </Button>
                  </Link>
                </div>
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
