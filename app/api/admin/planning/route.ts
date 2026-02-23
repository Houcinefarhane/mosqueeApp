import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const createPlanningSchema = z.object({
  classeId: z.string(),
  cours: z.array(
    z.object({
      jour: z.enum([
        "LUNDI",
        "MARDI",
        "MERCREDI",
        "JEUDI",
        "VENDREDI",
        "SAMEDI",
        "DIMANCHE",
      ]),
      heureDebut: z.string(),
      heureFin: z.string(),
      matiere: z.string().min(1, "La matière est requise"),
    })
  ),
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
    const { classeId, cours } = createPlanningSchema.parse(body);

    // Vérifier que la classe existe et appartient à la mosquée
    const classe = await prisma.classe.findFirst({
      where: {
        id: classeId,
        mosqueeId: session.user.mosqueeId,
      },
    });

    if (!classe) {
      return NextResponse.json(
        { error: "Classe non trouvée" },
        { status: 404 }
      );
    }

    // Créer tous les cours en transaction
    const planning = await prisma.$transaction(
      cours.map((c) =>
        prisma.planning.create({
          data: {
            jour: c.jour,
            heureDebut: c.heureDebut,
            heureFin: c.heureFin,
            matiere: c.matiere,
            classeId,
            mosqueeId: session.user.mosqueeId,
          },
        })
      )
    );

    // Revalider les pages concernées
    revalidatePath("/admin/planning");
    revalidatePath("/professeur/planning");
    revalidatePath("/parent/planning");
    revalidatePath("/eleve/planning");
    revalidatePath("/admin");
    revalidateTag("planning");

    return NextResponse.json(planning, { status: 201 });
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
