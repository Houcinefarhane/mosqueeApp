import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { DevoirCard } from "@/components/devoirs/DevoirCard";

export const metadata = { title: "Devoirs des enfants" };

export default async function ParentDevoirsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const eleves = await prisma.eleve.findMany({
    where: { parentId: session.user.id, mosqueeId: session.user.mosqueeId },
    include: { classe: { select: { id: true, nom: true } } },
  });

  const classeIds = [...new Set(eleves.map((e) => e.classeId))];

  const devoirs = await prisma.devoir.findMany({
    where: {
      mosqueeId: session.user.mosqueeId,
      classeId: { in: classeIds },
    },
    include: {
      professeur: { select: { prenom: true, nom: true } },
      classe: { select: { id: true, nom: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoirs & cahier de texte"
        description="Travail à faire pour vos enfants"
        breadcrumbs={[
          { label: "Espace parent", href: "/parent" },
          { label: "Devoirs" },
        ]}
      />

      {eleves.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            Aucun enfant associé à votre compte
          </CardContent>
        </Card>
      ) : (
        eleves.map((eleve) => {
          const devoirsEleve = devoirs.filter(
            (d) => d.classeId === eleve.classeId
          );
          return (
            <Card key={eleve.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {eleve.prenom} {eleve.nom}
                  </span>
                  <Badge className="border-primary/20 bg-primary/10 text-primary">
                    {eleve.classe.nom}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {devoirsEleve.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun devoir publié</p>
                ) : (
                  devoirsEleve.map((d) => <DevoirCard key={d.id} devoir={d} />)
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
