import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Users, Mail, Phone, UserPlus } from "lucide-react";
import ListSearchBar from "@/components/admin/ListSearchBar";
import ListPagination from "@/components/admin/ListPagination";
import {
  getPaginationMeta,
  parseListParams,
  type ListSearchParams,
} from "@/lib/admin/list-params";
import { buildParentSearchWhere } from "@/lib/admin/search-filters";

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: ListSearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const mosqueeId = session.user.mosqueeId;
  const { q, page, pageSize } = parseListParams(searchParams);
  const where = buildParentSearchWhere(mosqueeId, q);

  const total = await prisma.user.count({ where });
  const { totalPages, safePage, from, to } = getPaginationMeta(
    total,
    page,
    pageSize
  );
  const skip = (safePage - 1) * pageSize;

  const parents = await prisma.user.findMany({
    where,
    include: {
      _count: {
        select: {
          eleves: true,
        },
      },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    skip,
    take: pageSize,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parents</h1>
          <p className="text-gray-600 mt-2">
            Gérez les parents et leurs enfants ({total} au total)
          </p>
        </div>
        <Link href="/admin/parents/nouveau">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Nouveau parent
          </Button>
        </Link>
      </div>

      <ListSearchBar
        action="/admin/parents"
        defaultValue={q}
        placeholder="Nom, prénom, email, téléphone…"
      />

      {parents.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {q
                ? `Aucun parent trouvé pour « ${q} »`
                : "Aucun parent enregistré"}
            </p>
            {!q && (
              <Link href="/admin/parents/nouveau">
                <Button className="mt-4">Créer un parent</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enfants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parents.map((parent) => (
                    <tr key={parent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-primary mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {parent.prenom} {parent.nom}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {parent.email}
                          </div>
                          {parent.telephone && (
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {parent.telephone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {parent._count.eleves} enfant(s)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Link href={`/admin/parents/${parent.id}`}>
                            <Button variant="ghost" size="sm">
                              Voir
                            </Button>
                          </Link>
                          <Link
                            href={`/admin/parents/${parent.id}/assigner-eleves`}
                          >
                            <Button variant="outline" size="sm">
                              Assigner élèves
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPagination
              basePath="/admin/parents"
              q={q}
              page={safePage}
              totalPages={totalPages}
              from={from}
              to={to}
              total={total}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
