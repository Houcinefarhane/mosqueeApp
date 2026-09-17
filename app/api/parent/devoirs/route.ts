import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const eleves = await withRetry(() =>
      prisma.eleve.findMany({
        where: { parentId: session.user.id, mosqueeId: session.user.mosqueeId },
        select: { id: true, prenom: true, nom: true, classeId: true },
      })
    );

    const classeIds = [...new Set(eleves.map((e) => e.classeId))];

    const devoirs = await withRetry(() =>
      prisma.devoir.findMany({
        where: {
          mosqueeId: session.user.mosqueeId,
          classeId: { in: classeIds },
        },
        include: {
          professeur: { select: { prenom: true, nom: true } },
          classe: { select: { id: true, nom: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return NextResponse.json({ eleves, devoirs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
