import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const createAnnonceSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  contenu: z.string().min(1, "Le contenu est requis"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { titre, contenu } = createAnnonceSchema.parse(body);

    const annonce = await prisma.annonce.create({
      data: {
        titre,
        contenu,
        auteurId: session.user.id,
        mosqueeId: session.user.mosqueeId,
      },
    });

    // Revalider les pages concernées
    revalidatePath("/admin/annonces");
    revalidatePath("/admin");
    revalidateTag("annonces");

    return NextResponse.json(annonce, { status: 201 });
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const annonces = await prisma.annonce.findMany({
      where: { mosqueeId: session.user.mosqueeId },
      include: {
        auteur: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(annonces);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
