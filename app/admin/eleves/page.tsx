import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { HeaderCreateLink } from "@/components/layout/HeaderActions";
import { Users } from "lucide-react";
import ListSearchBar from "@/components/admin/ListSearchBar";
import ListPagination from "@/components/admin/ListPagination";
import {
  getPaginationMeta,
  parseListParams,
  type ListSearchParams,
} from "@/lib/admin/list-params";
import { buildEleveSearchWhere } from "@/lib/admin/search-filters";

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: ListSearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const mosqueeId = session.user.mosqueeId;
  const { q, page, pageSize } = parseListParams(searchParams);
  const where = buildEleveSearchWhere(mosqueeId, q);

  const total = await prisma.eleve.count({ where });
  const { totalPages, safePage, from, to } = getPaginationMeta(
    total,
    page,
    pageSize
  );
  const skip = (safePage - 1) * pageSize;

  const eleves = await prisma.eleve.findMany({
    where,
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
    skip,
    take: pageSize,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Élèves"
        description={`Gérez les élèves de votre mosquée (${total} au total)`}
        action={
          <HeaderCreateLink href="/admin/eleves/nouveau">
            Nouvel élève
          </HeaderCreateLink>
        }
      />

      <ListSearchBar
        action="/admin/eleves"
        defaultValue={q}
        placeholder="Nom, prénom, email, classe, parent…"
      />

      {eleves.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {q
                ? `Aucun élève trouvé pour « ${q} »`
                : "Aucun élève inscrit pour le moment"}
            </p>
            {!q && (
              <Link href="/admin/eleves/nouveau">
                <Button className="mt-4">Inscrire votre premier élève</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated">
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-100 md:hidden">
              {eleves.map((eleve) => (
                <li key={eleve.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {eleve.prenom} {eleve.nom}
                      </p>
                      {eleve.email && (
                        <p className="truncate text-[11px] text-gray-500">{eleve.email}</p>
                      )}
                      <p className="mt-0.5 text-xs text-gray-600">
                        {eleve.classe.nom}
                        {eleve.parent
                          ? ` · ${eleve.parent.prenom} ${eleve.parent.nom}`
                          : " · Aucun parent"}
                      </p>
                    </div>
                  </div>
                  <Link href={`/admin/eleves/${eleve.id}`} className="mt-2 block">
                    <Button variant="outline" className="w-full">
                      Voir la fiche
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
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
                            {eleve.email && (
                              <div className="text-xs text-gray-500">
                                {eleve.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {eleve.classe.nom}
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
            <ListPagination
              basePath="/admin/eleves"
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
