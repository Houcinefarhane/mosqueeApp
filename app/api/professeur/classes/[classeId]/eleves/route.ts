import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { classeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PROFESSEUR") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const classe = await prisma.classe.findFirst({
      where: {
        id: params.classeId,
        mosqueeId: session.user.mosqueeId,
        professeurId: session.user.id,
      },
    });

    if (!classe) {
      return NextResponse.json(
        { error: "Classe non trouvée" },
        { status: 404 }
      );
    }

    const eleves = await prisma.eleve.findMany({
      where: {
        classeId: params.classeId,
        mosqueeId: session.user.mosqueeId,
      },
      include: {
        classe: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return NextResponse.json(eleves);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
