import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const eleves = await prisma.eleve.findMany({
      where: {
        mosqueeId: session.user.mosqueeId,
        parentId: session.user.id,
      },
      select: { id: true },
    });

    const elevesIds = eleves.map((e) => e.id);

    const paiements = await prisma.paiement.findMany({
      where: {
        mosqueeId: session.user.mosqueeId,
        eleveId: { in: elevesIds },
      },
      include: {
        eleve: {
          include: {
            classe: {
              select: {
                nom: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(paiements);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
