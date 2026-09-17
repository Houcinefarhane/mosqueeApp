import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const createClasseSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  niveau: z.string().min(1, "Le niveau est requis"),
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
    const { nom, niveau } = createClasseSchema.parse(body);

    const classe = await prisma.classe.create({
      data: {
        nom,
        niveau,
        mosqueeId: session.user.mosqueeId,
      },
    });

    // Revalider les pages concernées
    revalidatePath("/admin/classes");
    revalidatePath("/admin");
    revalidatePath("/professeur/classes");
    revalidateTag("classes");

    return NextResponse.json(classe, { status: 201 });
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

    const classes = await prisma.classe.findMany({
      where: { mosqueeId: session.user.mosqueeId },
      include: {
        _count: {
          select: { eleves: true },
        },
      },
    });

    return NextResponse.json(classes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
