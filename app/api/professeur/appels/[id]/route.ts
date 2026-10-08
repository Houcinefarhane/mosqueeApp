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

    const appel = await withRetry(() =>
      prisma.appel.findFirst({
        where: {
          id: params.id,
          mosqueeId: session.user.mosqueeId,
          professeurId: session.user.id,
        },
      })
    );

    if (!appel) {
      return NextResponse.json({ error: "Appel non trouvé" }, { status: 404 });
    }

    await withRetry(() =>
      prisma.$transaction([
        prisma.presence.deleteMany({ where: { appelId: appel.id } }),
        prisma.appel.delete({ where: { id: appel.id } }),
      ])
    );

    revalidatePath("/professeur/appel");
    revalidatePath("/professeur/appel/historique");
    revalidatePath("/professeur");
    revalidatePath("/parent/presences");
    revalidatePath("/eleve/presences");
    revalidatePath("/admin");
    revalidateTag("presences");

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
