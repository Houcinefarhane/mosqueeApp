import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateClasseSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  niveau: z.string().min(1, "Le niveau est requis"),
});

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

    const classe = await prisma.classe.findFirst({
      where: {
        id: params.id,
        mosqueeId: session.user.mosqueeId,
      },
      include: {
        professeur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    if (!classe) {
      return NextResponse.json(
        { error: "Classe non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...classe,
      professeurId: classe.professeur?.id || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await req.json();
    const { nom, niveau } = updateClasseSchema.parse(body);

    const classe = await prisma.classe.findFirst({
      where: {
        id: params.id,
        mosqueeId: session.user.mosqueeId,
      },
    });

    if (!classe) {
      return NextResponse.json(
        { error: "Classe non trouvée" },
        { status: 404 }
      );
    }

    const updatedClasse = await prisma.classe.update({
      where: { id: params.id },
      data: { nom, niveau },
    });

    return NextResponse.json(updatedClasse);
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
