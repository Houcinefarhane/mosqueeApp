import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PROFESSEUR") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const noteSession = await withRetry(() =>
      prisma.noteSession.findFirst({
        where: {
          id: params.id,
          mosqueeId: session.user.mosqueeId,
          professeurId: session.user.id,
        },
      })
    );

    if (!noteSession) {
      return NextResponse.json(
        { error: "Session de notes non trouvée" },
        { status: 404 }
      );
    }

    await withRetry(() =>
      prisma.$transaction([
        prisma.note.deleteMany({ where: { sessionId: noteSession.id } }),
        prisma.noteSession.delete({ where: { id: noteSession.id } }),
      ])
    );

    revalidatePath("/professeur/notes");
    revalidatePath("/professeur/notes/historique");
    revalidatePath("/parent/notes");
    revalidatePath("/eleve/notes");
    revalidatePath("/admin");
    revalidateTag("notes");

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
