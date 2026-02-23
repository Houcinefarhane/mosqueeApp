import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { User, BookOpen, Mail, Phone, Calendar, ArrowLeft, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function EleveDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const mosqueeId = session.user.mosqueeId;

  const eleve = await prisma.eleve.findFirst({
    where: {
      id: params.id,
      mosqueeId,
    },
    include: {
      classe: {
        select: {
          id: true,
          nom: true,
          niveau: true,
        },
      },
      parent: {
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
          presences: true,
          notes: true,
          paiements: true,
        },
      },
      presences: {
        take: 5,
        orderBy: { date: "desc" },
        include: {
          professeur: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      },
      notes: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          professeur: {
            select: {
              nom: true,
              prenom: true,
            },
          },
        },
      },
    },
  });

  if (!eleve) {
    redirect("/admin/eleves");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/eleves">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {eleve.prenom} {eleve.nom}
            </h1>
            <p className="text-gray-600 mt-2">Détails de l&apos;élève</p>
          </div>
        </div>
        <Link href={`/admin/eleves/${eleve.id}/modifier`}>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
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
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Classe</p>
                <Link href={`/admin/classes/${eleve.classe.id}`}>
                  <p className="font-semibold hover:text-primary cursor-pointer">
                    {eleve.classe.nom}
                  </p>
                </Link>
              </div>
            </div>
            {eleve.dateNaissance && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Date de naissance</p>
                  <p className="font-semibold">{formatDate(eleve.dateNaissance)}</p>
                </div>
              </div>
            )}
            {eleve.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{eleve.email}</p>
                </div>
              </div>
            )}
            {eleve.telephone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-semibold">{eleve.telephone}</p>
                </div>
              </div>
            )}
            {!eleve.userId && (
              <div className="mt-4 p-4 bg-primary/10 border-2 border-primary rounded-lg">
                <p className="text-sm font-semibold text-primary mb-2">
                  Code d&apos;inscription élève
                </p>
                <code className="text-lg font-bold text-primary block mb-2">
                  {eleve.id}
                </code>
                <p className="text-xs text-gray-600">
                  Partagez ce code avec l&apos;élève pour qu&apos;il puisse créer son compte sur{" "}
                  <span className="font-medium">/auth/inscription/eleve</span>
                </p>
              </div>
            )}
            {eleve.userId && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-700">
                  ✓ Compte élève créé
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  L&apos;élève a déjà un compte utilisateur
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {eleve.parent && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Parent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">
                  {eleve.parent.prenom} {eleve.parent.nom}
                </p>
                <p className="text-sm text-gray-600 mt-1">{eleve.parent.email}</p>
                {eleve.parent.telephone && (
                  <p className="text-sm text-gray-600">{eleve.parent.telephone}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Présences</p>
                <p className="text-xl font-semibold">{eleve._count.presences}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-xl font-semibold">{eleve._count.notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {eleve.presences.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Dernières présences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {eleve.presences.map((presence) => (
                <div
                  key={presence.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {formatDate(presence.date)} - {presence.statut}
                      </p>
                      <p className="text-sm text-gray-600">
                        Par {presence.professeur.prenom} {presence.professeur.nom}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {eleve.notes.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Dernières notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {eleve.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {note.matiere} : {note.valeur}/{note.noteMax}
                      </p>
                      <p className="text-sm text-gray-600">
                        Par {note.professeur.prenom} {note.professeur.nom}
                      </p>
                      {note.commentaire && (
                        <p className="text-sm text-gray-600 mt-1">{note.commentaire}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
