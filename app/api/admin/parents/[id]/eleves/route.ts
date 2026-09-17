import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const assignElevesSchema = z.object({
  eleveIds: z.array(z.string()).min(1, "Au moins un élève doit être sélectionné"),
});

// Assigner plusieurs élèves à un parent
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
    const data = assignElevesSchema.parse(body);

    // Vérifier que le parent existe et appartient à la mosquée
    const parent = await prisma.user.findFirst({
      where: {
        id: params.id,
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

    // Vérifier que tous les élèves existent et appartiennent à la mosquée
    const eleves = await prisma.eleve.findMany({
      where: {
        id: { in: data.eleveIds },
        mosqueeId: session.user.mosqueeId,
      },
    });

    if (eleves.length !== data.eleveIds.length) {
      return NextResponse.json(
        { error: "Certains élèves n'ont pas été trouvés" },
        { status: 404 }
      );
    }

    // Assigner tous les élèves au parent
    await prisma.eleve.updateMany({
      where: {
        id: { in: data.eleveIds },
        mosqueeId: session.user.mosqueeId,
      },
      data: {
        parentId: params.id,
      },
    });

    // Revalider les pages concernées
    revalidatePath("/admin/eleves");
    revalidatePath("/admin/parents");
    revalidatePath("/admin");
    revalidatePath("/parent");
    revalidateTag("eleves");

    return NextResponse.json({
      message: `${eleves.length} élève(s) assigné(s) au parent`,
      count: eleves.length,
    });
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

// Récupérer les élèves d'un parent
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

    // Vérifier que le parent existe et appartient à la mosquée
    const parent = await prisma.user.findFirst({
      where: {
        id: params.id,
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

    // Récupérer les élèves de ce parent
    const eleves = await prisma.eleve.findMany({
      where: {
        parentId: params.id,
        mosqueeId: session.user.mosqueeId,
      },
      include: {
        classe: {
          select: {
            id: true,
            nom: true,
            niveau: true,
          },
        },
      },
      orderBy: {
        prenom: "asc",
      },
    });

    return NextResponse.json(eleves);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
