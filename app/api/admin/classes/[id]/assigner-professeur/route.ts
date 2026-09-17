import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignerProfesseurSchema = z.object({
  professeurId: z.string().nullable(),
});

export async function POST(
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
    const { professeurId } = assignerProfesseurSchema.parse(body);

    // Vérifier que la classe existe et appartient à la mosquée
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

    // Si un professeur est assigné, vérifier qu'il existe et appartient à la mosquée
    if (professeurId) {
      const professeur = await prisma.user.findFirst({
        where: {
          id: professeurId,
          mosqueeId: session.user.mosqueeId,
          role: "PROFESSEUR",
        },
      });

      if (!professeur) {
        return NextResponse.json(
          { error: "Professeur non trouvé" },
          { status: 404 }
        );
      }
    }

    // Mettre à jour la classe
    const classeUpdated = await prisma.classe.update({
      where: { id: params.id },
      data: {
        professeurId: professeurId || null,
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

    return NextResponse.json(classeUpdated);
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
