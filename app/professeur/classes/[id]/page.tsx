import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import PageHeader from "@/components/layout/PageHeader";
import ClasseElevesList from "@/components/professeur/ClasseElevesList";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { ClipboardList, FileText, MapPin, Users } from "lucide-react";

export default async function ProfesseurClasseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const classe = await prisma.classe.findFirst({
    where: {
      id: params.id,
      mosqueeId: session.user.mosqueeId,
      professeurId: session.user.id,
    },
    include: {
      eleves: {
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
        include: {
          parent: {
            select: {
              prenom: true,
              nom: true,
            },
          },
        },
      },
      _count: {
        select: { planning: true },
      },
    },
  });

  if (!classe) {
    redirect("/professeur/classes");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={classe.nom}
        description={`Niveau ${classe.niveau}${classe.salle ? ` · Salle ${classe.salle}` : ""}`}
        back={{ href: "/professeur/classes", label: "Retour aux classes" }}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/professeur/appel?classeId=${classe.id}`}>
              <Button size="md" className="min-h-11">
                <ClipboardList className="h-4 w-4" />
                Appel
              </Button>
            </Link>
            <Link href={`/professeur/notes?classeId=${classe.id}`}>
              <Button variant="secondary" size="md" className="min-h-11">
                <FileText className="h-4 w-4" />
                Notes
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card variant="outlined">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-or" aria-hidden />
            <div>
              <p className="label-caps">Élèves</p>
              <p className="font-display text-2xl font-extrabold tabular-nums text-brun">
                {classe.eleves.length}
              </p>
            </div>
          </CardContent>
        </Card>
        {classe.salle && (
          <Card variant="outlined" className="col-span-1 sm:col-span-2">
            <CardContent className="flex items-center gap-3 p-4">
              <MapPin className="h-5 w-5 text-or" aria-hidden />
              <div>
                <p className="label-caps">Salle</p>
                <p className="font-semibold text-foreground">{classe.salle}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <p className="label-caps mb-3">Liste des élèves</p>
        <ClasseElevesList eleves={classe.eleves} />
      </div>
    </div>
  );
}
