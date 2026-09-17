import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { DevoirCard } from "@/components/devoirs/DevoirCard";
import { BookOpenCheck } from "lucide-react";

export const metadata = { title: "Devoirs & cahier de texte" };

export default async function EleveDevoirsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const eleve = await prisma.eleve.findFirst({
    where: { userId: session.user.id, mosqueeId: session.user.mosqueeId },
    include: { classe: { select: { nom: true } } },
  });

  if (!eleve) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Devoirs & cahier de texte"
          breadcrumbs={[{ label: "Espace élève" }, { label: "Devoirs" }]}
        />
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            Votre compte n&apos;est pas lié à un dossier élève.
          </CardContent>
        </Card>
      </div>
    );
  }

  const devoirs = await prisma.devoir.findMany({
    where: { mosqueeId: session.user.mosqueeId, classeId: eleve.classeId },
    include: {
      professeur: { select: { prenom: true, nom: true } },
      classe: { select: { nom: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const cahierTexte = devoirs.filter((d) => d.type === "CAHIER_TEXTE");
  const devoirsList = devoirs.filter((d) => d.type === "DEVOIR");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoirs & cahier de texte"
        description={`Classe ${eleve.classe.nom} — travail publié par vos professeurs`}
        breadcrumbs={[
          { label: "Espace élève", href: "/eleve" },
          { label: "Devoirs" },
        ]}
      />

      {devoirs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpenCheck className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">Aucun devoir pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {cahierTexte.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Cahier de texte ({cahierTexte.length})
              </h2>
              {cahierTexte.map((d) => (
                <DevoirCard key={d.id} devoir={d} />
              ))}
            </section>
          )}
          {devoirsList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Devoirs ({devoirsList.length})
              </h2>
              {devoirsList.map((d) => (
                <DevoirCard key={d.id} devoir={d} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
