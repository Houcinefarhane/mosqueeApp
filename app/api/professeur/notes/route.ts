import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const createNotesSchema = z.object({
  classeId: z.string(),
  matiere: z.string().min(1, "La matière est requise"),
  noteMax: z.number().min(0).default(20),
  commentaireSeance: z.string().nullable().optional(),
  notes: z
    .array(
      z.object({
        eleveId: z.string(),
        valeur: z.number().min(0),
        commentaire: z.string().nullable().optional(),
      })
    )
    .min(1, "Veuillez saisir au moins une note"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PROFESSEUR") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = createNotesSchema.parse(body);

    // Vérifier que la classe appartient bien au professeur
    const classe = await prisma.classe.findFirst({
      where: {
        id: data.classeId,
        mosqueeId: session.user.mosqueeId,
        professeurId: session.user.id,
      },
    });

    if (!classe) {
      return NextResponse.json(
        { error: "Classe non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Vérifier que les élèves appartiennent bien à cette classe
    const eleves = await prisma.eleve.findMany({
      where: {
        mosqueeId: session.user.mosqueeId,
        classeId: classe.id,
      },
      select: { id: true },
    });
    const elevesIdsAutorises = new Set(eleves.map((e) => e.id));

    const notesInvalides = data.notes.filter(
      (n) => !elevesIdsAutorises.has(n.eleveId)
    );

    if (notesInvalides.length > 0) {
      return NextResponse.json(
        {
          error:
            "Un ou plusieurs élèves ne font pas partie de cette classe ou ne vous sont pas attribués",
        },
        { status: 400 }
      );
    }

    // Créer la session de notes et les notes en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer la session de notes
      const sessionNote = await tx.noteSession.create({
        data: {
          classeId: data.classeId,
          professeurId: session.user.id,
          mosqueeId: session.user.mosqueeId,
          matiere: data.matiere,
          noteMax: data.noteMax,
          commentaireSeance: data.commentaireSeance || null,
        },
      });

      // Créer toutes les notes
      const notesCreees = await Promise.all(
        data.notes.map((note) =>
          tx.note.create({
            data: {
              valeur: note.valeur,
              noteMax: data.noteMax,
              matiere: data.matiere,
              commentaire: note.commentaire || null,
              eleveId: note.eleveId,
              professeurId: session.user.id,
              mosqueeId: session.user.mosqueeId,
              sessionId: sessionNote.id,
            },
          })
        )
      );

      return { session: sessionNote, notes: notesCreees };
    });

    // Revalider les pages concernées pour synchronisation temps réel
    revalidatePath("/professeur/notes");
    revalidatePath("/professeur/notes/historique");
    revalidatePath("/parent/notes");
    revalidatePath("/eleve/notes");
    revalidatePath("/admin");
    revalidateTag("notes");

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
