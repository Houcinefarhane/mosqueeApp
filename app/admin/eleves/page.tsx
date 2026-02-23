import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ElevesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;

  const eleves = await prisma.eleve.findMany({
    where: { mosqueeId },
    include: {
      classe: {
        select: {
          nom: true,
          niveau: true,
        },
      },
      parent: {
        select: {
          nom: true,
          prenom: true,
          email: true,
        },
      },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Élèves</h1>
          <p className="text-gray-600 mt-2">Gérez les élèves de votre mosquée</p>
        </div>
        <Link href="/admin/eleves/nouveau">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel élève
          </Button>
        </Link>
      </div>

      <Card variant="elevated">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom complet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de naissance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eleves.map((eleve) => (
                  <tr key={eleve.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-primary mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {eleve.prenom} {eleve.nom}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{eleve.classe.nom}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {eleve.dateNaissance ? formatDate(eleve.dateNaissance) : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {eleve.parent ? (
                        <div className="text-sm text-gray-900">
                          {eleve.parent.prenom} {eleve.parent.nom}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Aucun</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/admin/eleves/${eleve.id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {eleves.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun élève inscrit pour le moment</p>
            <Link href="/admin/eleves/nouveau">
              <Button className="mt-4">Inscrire votre premier élève</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
