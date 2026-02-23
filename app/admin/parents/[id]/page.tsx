import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { User, Mail, Phone, ArrowLeft, Users, Edit } from "lucide-react";

export default async function ParentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const mosqueeId = session.user.mosqueeId;

  const parent = await prisma.user.findFirst({
    where: {
      id: params.id,
      mosqueeId,
      role: "PARENT",
    },
    include: {
      eleves: {
        include: {
          classe: {
            select: {
              id: true,
              nom: true,
              niveau: true,
            },
          },
        },
        orderBy: {
          prenom: "asc",
        },
      },
      _count: {
        select: {
          eleves: true,
          paiements: true,
        },
      },
    },
  });

  if (!parent) {
    redirect("/admin/parents");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/parents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {parent.prenom} {parent.nom}
            </h1>
            <p className="text-gray-600 mt-2">Détails du parent</p>
          </div>
        </div>
        <Link href={`/admin/parents/${parent.id}/assigner-eleves`}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Assigner élèves
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{parent.email}</p>
              </div>
            </div>
            {parent.telephone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-semibold">{parent.telephone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Enfants</p>
                <p className="text-xl font-semibold">{parent._count.eleves}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {parent.eleves.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Enfants assignés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {parent.eleves.map((eleve) => (
                <Link
                  key={eleve.id}
                  href={`/admin/eleves/${eleve.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {eleve.prenom} {eleve.nom}
                      </p>
                      <p className="text-sm text-gray-600">
                        {eleve.classe.nom} - {eleve.classe.niveau}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Voir
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {parent.eleves.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun élève assigné</p>
            <Link href={`/admin/parents/${parent.id}/assigner-eleves`}>
              <Button className="mt-4">Assigner des élèves</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
