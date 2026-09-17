import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Plus, BookOpen, Users } from "lucide-react";

export default async function ClassesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;

  const classes = await prisma.classe.findMany({
    where: { mosqueeId },
    include: {
      _count: {
        select: { eleves: true },
      },
      professeur: {
        select: {
          nom: true,
          prenom: true,
        },
      },
    },
    orderBy: { nom: "asc" },
  });

  const totalEleves = classes.reduce((sum, c) => sum + c._count.eleves, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classes</h1>
          <p className="text-gray-600 mt-2">
            {classes.length} classe(s) • {totalEleves} élève(s) au total
          </p>
        </div>
        <Link href="/admin/classes/nouvelle">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle classe
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classe) => (
          <Card key={classe.id} variant="elevated" className="hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>{classe.nom}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    {classe.niveau}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{classe._count.eleves} élève(s)</span>
                </div>
                {classe.professeur && (
                  <p className="text-sm text-gray-600">
                    Professeur: <span className="font-medium">{classe.professeur.prenom} {classe.professeur.nom}</span>
                  </p>
                )}
                <Link href={`/admin/classes/${classe.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Voir détails
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
            <p className="text-gray-600">Aucune classe créée pour le moment</p>
            <Link href="/admin/classes/nouvelle">
              <Button className="mt-4">Créer votre première classe</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
