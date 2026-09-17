import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const updateEleveSchema = z.object({
  parentId: z.string().nullable().optional(),
});

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
    const data = updateEleveSchema.parse(body);

    // Vérifier que l'élève existe et appartient à la mosquée
    const eleve = await prisma.eleve.findFirst({
      where: {
        id: params.id,
        mosqueeId: session.user.mosqueeId,
      },
    });

    if (!eleve) {
      return NextResponse.json(
        { error: "Élève non trouvé" },
        { status: 404 }
      );
    }

    // Si un parent est spécifié, vérifier qu'il existe et appartient à la mosquée
    if (data.parentId) {
      const parent = await prisma.user.findFirst({
        where: {
          id: data.parentId,
          mosqueeId: session.user.mosqueeId,
          role: "PARENT",
        },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent non trouvé" },
          { status: 404 }
        );
      }
    }

    // Mettre à jour l'élève
    const updatedEleve = await prisma.eleve.update({
      where: { id: params.id },
      data: {
        parentId: data.parentId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    // Revalider les pages concernées
    revalidatePath("/admin/eleves");
    revalidatePath(`/admin/eleves/${params.id}`);
    revalidatePath("/admin");
    revalidatePath("/parent");
    revalidateTag("eleves");

    return NextResponse.json(updatedEleve);
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
