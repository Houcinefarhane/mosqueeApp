import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const createPaiementSchema = z.object({
  eleveId: z.string(),
  montant: z.number().positive("Le montant doit être positif"),
  dateEcheance: z.string(),
  description: z.string().optional(),
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
    const { eleveId, montant, dateEcheance, description } =
      createPaiementSchema.parse(body);

    // Vérifier que l'élève existe et appartient à la mosquée
    const eleve = await prisma.eleve.findFirst({
      where: {
        id: eleveId,
        mosqueeId: session.user.mosqueeId,
      },
      include: {
        parent: true,
      },
    });

    if (!eleve) {
      return NextResponse.json(
        { error: "Élève non trouvé" },
        { status: 404 }
      );
    }

    const paiement = await prisma.paiement.create({
      data: {
        montant,
        dateEcheance: new Date(dateEcheance),
        description,
        statut: "EN_ATTENTE",
        eleveId,
        parentId: eleve.parentId,
        mosqueeId: session.user.mosqueeId,
      },
    });

    // Revalider les pages concernées
    revalidatePath("/admin/paiements");
    revalidatePath("/parent/paiements");
    revalidatePath("/admin");
    revalidateTag("paiements");

    return NextResponse.json(paiement, { status: 201 });
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
