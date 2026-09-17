import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { BookOpen, Users, Calendar, ArrowLeft, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ClasseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const mosqueeId = session.user.mosqueeId;

  const classe = await prisma.classe.findFirst({
    where: {
      id: params.id,
      mosqueeId,
    },
    include: {
      professeur: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
        },
      },
      _count: {
        select: {
          eleves: true,
          planning: true,
        },
      },
      eleves: {
        take: 10,
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
        include: {
          parent: {
            select: {
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!classe) {
    redirect("/admin/classes");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/classes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{classe.nom}</h1>
            <p className="text-gray-600 mt-2">Détails de la classe</p>
          </div>
        </div>
        <Link href={`/admin/classes/${classe.id}/modifier`}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Niveau</p>
                <p className="text-xl font-semibold">{classe.niveau}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Élèves</p>
                <p className="text-xl font-semibold">{classe._count.eleves}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Cours au planning</p>
                <p className="text-xl font-semibold">{classe._count.planning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Professeur assigné</CardTitle>
            <Link href={`/admin/classes/${classe.id}/assigner-professeur`}>
              <Button size="sm" variant={classe.professeur ? "outline" : "primary"}>
                {classe.professeur ? "Modifier" : "Assigner un professeur"}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {classe.professeur ? (
            <div className="space-y-2">
              <Link href={`/admin/professeurs/${classe.professeur.id}`}>
                <p className="font-semibold hover:text-primary cursor-pointer">
                  {classe.professeur.prenom} {classe.professeur.nom}
                </p>
              </Link>
              <p className="text-sm text-gray-600">{classe.professeur.email}</p>
              {classe.professeur.telephone && (
                <p className="text-sm text-gray-600">{classe.professeur.telephone}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              Aucun professeur assigné
            </p>
          )}
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Élèves ({classe._count.eleves})</CardTitle>
            <Link href="/admin/eleves/nouveau">
              <Button size="sm">Ajouter un élève</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {classe.eleves.length > 0 ? (
            <div className="space-y-3">
              {classe.eleves.map((eleve) => (
                <div
                  key={eleve.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {eleve.prenom} {eleve.nom}
                    </p>
                    {eleve.parent && (
                      <p className="text-sm text-gray-600">
                        Parent: {eleve.parent.prenom} {eleve.parent.nom}
                      </p>
                    )}
                  </div>
                  <Link href={`/admin/eleves/${eleve.id}`}>
                    <Button variant="ghost" size="sm">
                      Voir
                    </Button>
                  </Link>
                </div>
              ))}
              {classe._count.eleves > 10 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  ... et {classe._count.eleves - 10} autre(s) élève(s)
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              Aucun élève dans cette classe
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
