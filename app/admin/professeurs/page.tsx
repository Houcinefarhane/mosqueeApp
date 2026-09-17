import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Plus, Users, Mail, Phone } from "lucide-react";

export default async function ProfesseursPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;

  const professeurs = await prisma.user.findMany({
    where: {
      mosqueeId,
      role: "PROFESSEUR",
    },
    include: {
      _count: {
        select: { presences: true },
      },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Professeurs</h1>
          <p className="text-gray-600 mt-2">Gérez les professeurs de votre mosquée</p>
        </div>
        <Link href="/admin/professeurs/nouveau">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau professeur
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professeurs.map((professeur) => (
          <Card key={professeur.id} variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>
                  {professeur.prenom} {professeur.nom}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{professeur.email}</span>
                </div>
                {professeur.telephone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{professeur.telephone}</span>
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-4">
                  {professeur._count.presences} appels effectués
                </p>
                <Link href={`/admin/professeurs/${professeur.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Voir détails
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {professeurs.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun professeur enregistré pour le moment</p>
            <Link href="/admin/professeurs/nouveau">
              <Button className="mt-4">Ajouter votre premier professeur</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
