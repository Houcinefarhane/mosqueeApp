import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const createEleveSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  dateNaissance: z.string().nullable().optional(),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  classeId: z.string().min(1, "La classe est requise"),
  parentId: z.string().nullable().optional(),
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
    const data = createEleveSchema.parse(body);

    const eleve = await prisma.eleve.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
        telephone: data.telephone || null,
        email: data.email,
        classeId: data.classeId,
        parentId: data.parentId || null,
        mosqueeId: session.user.mosqueeId,
      },
    });

    // Revalider les pages concernées
    revalidatePath("/admin/eleves");
    revalidatePath("/admin");
    revalidatePath("/parent");
    revalidateTag("eleves");

    return NextResponse.json(eleve, { status: 201 });
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

    const eleves = await prisma.eleve.findMany({
      where: { mosqueeId: session.user.mosqueeId },
      include: {
        classe: true,
        parent: true,
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
