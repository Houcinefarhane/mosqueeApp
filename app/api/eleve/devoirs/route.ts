import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ELEVE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const eleve = await withRetry(() =>
      prisma.eleve.findFirst({
        where: { userId: session.user.id, mosqueeId: session.user.mosqueeId },
        select: { classeId: true },
      })
    );

    if (!eleve) {
      return NextResponse.json({ error: "Profil élève non trouvé" }, { status: 404 });
    }

    const devoirs = await withRetry(() =>
      prisma.devoir.findMany({
        where: {
          mosqueeId: session.user.mosqueeId,
          classeId: eleve.classeId,
        },
        include: {
          professeur: { select: { prenom: true, nom: true } },
          classe: { select: { nom: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return NextResponse.json(devoirs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
