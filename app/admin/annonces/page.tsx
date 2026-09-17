import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Plus, Bell, User } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function AnnoncesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;

  const annonces = await prisma.annonce.findMany({
    where: { mosqueeId },
    include: {
      auteur: {
        select: {
          nom: true,
          prenom: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Annonces</h1>
          <p className="text-gray-600 mt-2">Gérez les annonces pour les parents</p>
        </div>
        <Link href="/admin/annonces/nouvelle">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle annonce
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {annonces.map((annonce) => (
          <Card key={annonce.id} variant="elevated">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{annonce.titre}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Par {annonce.auteur.prenom} {annonce.auteur.nom}
                    </span>
                    <span className="text-sm text-gray-500">
                      • {formatDateTime(annonce.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{annonce.contenu}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {annonces.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune annonce pour le moment</p>
            <Link href="/admin/annonces/nouvelle">
              <Button className="mt-4">Créer votre première annonce</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
