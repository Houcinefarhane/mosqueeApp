import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function EleveNotesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = session.user.id;
  const mosqueeId = session.user.mosqueeId;

  const eleve = await prisma.eleve.findFirst({
    where: {
      userId,
      mosqueeId,
    },
    include: {
      classe: {
        select: {
          nom: true,
        },
      },
      notes: {
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
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes notes</h1>
        </div>
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">
              Votre compte n&apos;est pas encore lié à un dossier élève.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const moyenne =
    eleve.notes.length > 0
      ? eleve.notes.reduce(
          (sum, note) => sum + (note.valeur / note.noteMax) * 20,
          0
        ) / eleve.notes.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes notes</h1>
        <p className="text-gray-600 mt-2">
          {eleve.prenom} {eleve.nom} - {eleve.classe.nom}
        </p>
      </div>

      {eleve.notes.length > 0 && (
        <Card variant="elevated" className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Moyenne générale</p>
                <p className="text-4xl font-bold text-primary mt-2">
                  {moyenne.toFixed(2)}/20
                </p>
              </div>
              <div className="p-4 bg-primary/20 rounded-lg">
                <TrendingUp className="w-12 h-12 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Toutes mes notes</CardTitle>
        </CardHeader>
        <CardContent>
          {eleve.notes.length > 0 ? (
            <div className="space-y-4">
              {eleve.notes.map((note) => {
                const pourcentage = (note.valeur / note.noteMax) * 100;
                const couleur =
                  pourcentage >= 80
                    ? "text-green-600"
                    : pourcentage >= 60
                    ? "text-yellow-600"
                    : "text-red-600";

                return (
                  <div
                    key={note.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-lg">{note.matiere}</p>
                        <p className="text-sm text-gray-600">
                          Par {note.professeur.prenom} {note.professeur.nom}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(note.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${couleur}`}>
                          {note.valeur}/{note.noteMax}
                        </p>
                        <p className={`text-sm ${couleur}`}>
                          {pourcentage.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    {note.commentaire && (
                      <p className="text-sm text-gray-700 mt-3 p-2 bg-gray-50 rounded">
                        {note.commentaire}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune note enregistrée pour le moment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
