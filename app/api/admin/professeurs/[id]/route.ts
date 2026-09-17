import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const professeur = await prisma.user.findFirst({
      where: {
        id: params.id,
        mosqueeId: session.user.mosqueeId,
        role: "PROFESSEUR",
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        createdAt: true,
      },
    });

    if (!professeur) {
      return NextResponse.json(
        { error: "Professeur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(professeur);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
