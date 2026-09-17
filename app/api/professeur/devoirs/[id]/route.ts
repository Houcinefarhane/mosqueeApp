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

    const devoir = await withRetry(() =>
      prisma.devoir.findFirst({
        where: {
          id: params.id,
          mosqueeId: session.user.mosqueeId,
          professeurId: session.user.id,
        },
      })
    );

    if (!devoir) {
      return NextResponse.json({ error: "Devoir non trouvé" }, { status: 404 });
    }

    await withRetry(() => prisma.devoir.delete({ where: { id: params.id } }));

    revalidatePath("/professeur/devoirs");
    revalidatePath("/eleve/devoirs");
    revalidatePath("/parent/devoirs");
    revalidateTag("devoirs");

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
