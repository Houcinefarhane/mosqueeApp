import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { User, Mail, Phone, BookOpen, Calendar, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ProfesseurDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const mosqueeId = session.user.mosqueeId;

  const professeur = await prisma.user.findFirst({
    where: {
      id: params.id,
      mosqueeId,
      role: "PROFESSEUR",
    },
    include: {
      classes: {
        include: {
          _count: {
            select: {
              eleves: true,
            },
          },
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

  if (!professeur) {
    redirect("/admin/professeurs");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/professeurs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {professeur.prenom} {professeur.nom}
          </h1>
          <p className="text-gray-600 mt-2">Détails du professeur</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Informations de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{professeur.email}</p>
              </div>
            </div>
            {professeur.telephone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-semibold">{professeur.telephone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Membre depuis</p>
                <p className="font-semibold">{formatDate(professeur.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Classes</p>
                  <p className="text-xl font-semibold">{professeur.classes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Appels</p>
                  <p className="text-xl font-semibold">{professeur._count.presences}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {professeur.classes.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Classes assignées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professeur.classes.map((classe) => (
                <Link key={classe.id} href={`/admin/classes/${classe.id}`}>
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{classe.nom}</p>
                        <p className="text-sm text-gray-600">{classe.niveau}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {classe._count.eleves} élève(s)
                        </p>
                      </div>
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {professeur.classes.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune classe assignée</p>
            <Link href={`/admin/professeurs/${professeur.id}/assigner-classes`}>
              <Button className="mt-4">Assigner une classe</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
