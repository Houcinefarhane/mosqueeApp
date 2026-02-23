import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignerClassesSchema = z.object({
  classesIds: z.array(z.string()),
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
    const { classesIds } = assignerClassesSchema.parse(body);

    // Vérifier que le professeur existe et appartient à la mosquée
    const professeur = await prisma.user.findFirst({
      where: {
        id: params.id,
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

    // Vérifier que toutes les classes existent et appartiennent à la mosquée
    if (classesIds.length > 0) {
      const classes = await prisma.classe.findMany({
        where: {
          id: { in: classesIds },
          mosqueeId: session.user.mosqueeId,
        },
      });

      if (classes.length !== classesIds.length) {
        return NextResponse.json(
          { error: "Certaines classes n'ont pas été trouvées" },
          { status: 404 }
        );
      }
    }

    // Retirer l'assignation de toutes les classes de ce professeur
    await prisma.classe.updateMany({
      where: {
        mosqueeId: session.user.mosqueeId,
        professeurId: params.id,
      },
      data: {
        professeurId: null,
      },
    });

    // Assigner les nouvelles classes
    if (classesIds.length > 0) {
      await prisma.classe.updateMany({
        where: {
          id: { in: classesIds },
          mosqueeId: session.user.mosqueeId,
        },
        data: {
          professeurId: params.id,
        },
      });
    }

    return NextResponse.json({ success: true });
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
