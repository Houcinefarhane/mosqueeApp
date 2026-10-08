import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { NOTE_SCORE_CLASS } from "@/lib/ui/note-score";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parentId = session.user.id;
  const mosqueeId = session.user.mosqueeId;

  const eleves = await prisma.eleve.findMany({
    where: {
      mosqueeId,
      parentId,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notes</h1>
        <p className="text-gray-600 mt-2">Consultez les notes de vos enfants</p>
      </div>

      {eleves.map((eleve) => (
        <Card key={eleve.id} variant="elevated">
          <CardHeader>
            <CardTitle>
              {eleve.prenom} {eleve.nom} - {eleve.classe.nom}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eleve.notes.length > 0 ? (
              <div className="space-y-3">
                {eleve.notes.map((note) => {
                  const pourcentage = (note.valeur / note.noteMax) * 100;

                  return (
                    <div
                      key={note.id}
                      className="rounded-2xl border border-filet p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-lg">{note.matiere}</p>
                          <p className="text-sm text-brun-doux">
                            Par {note.professeur.prenom} {note.professeur.nom}
                          </p>
                          <p className="text-xs text-brun-doux/80 mt-1">
                            {formatDate(note.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={NOTE_SCORE_CLASS}>
                            {note.valeur}/{note.noteMax}
                          </p>
                          <p className="text-sm tabular-nums text-brun-doux">
                            {pourcentage.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      {note.commentaire && (
                        <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                          {note.commentaire}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Aucune note enregistrée pour le moment
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {eleves.length === 0 && (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun enfant inscrit</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
