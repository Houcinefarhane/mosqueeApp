import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { HeaderCreateLink } from "@/components/layout/HeaderActions";
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
      <PageHeader
        title="Parents"
        description={`Gérez les parents et leurs enfants (${total} au total)`}
        action={
          <HeaderCreateLink href="/admin/parents/nouveau" icon={UserPlus}>
            Nouveau parent
          </HeaderCreateLink>
        }
      />

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
            <ul className="divide-y divide-gray-100 md:hidden">
              {parents.map((parent) => (
                <li key={parent.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {parent.prenom} {parent.nom}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-600">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{parent.email}</span>
                      </div>
                      {parent.telephone && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          {parent.telephone}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {parent._count.eleves} enfant
                        {parent._count.eleves > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    <Link href={`/admin/parents/${parent.id}`}>
                      <Button variant="outline" className="w-full">
                        Voir
                      </Button>
                    </Link>
                    <Link href={`/admin/parents/${parent.id}/assigner-eleves`}>
                      <Button variant="ghost" className="w-full">
                        Assigner élèves
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
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
