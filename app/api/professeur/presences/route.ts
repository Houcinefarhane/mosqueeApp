import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const createPresencesSchema = z.object({
  classeId: z.string(),
  date: z.string(),
  commentaireSeance: z.string().nullable().optional(),
  presences: z.array(
    z.object({
      eleveId: z.string(),
      statut: z.enum(["PRESENT", "ABSENT", "RETARD", "EXCUSE"]),
      commentaire: z.string().nullable().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PROFESSEUR") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = createPresencesSchema.parse(body);

    // Vérifier que la classe appartient au professeur
    const classe = await prisma.classe.findFirst({
      where: {
        id: data.classeId,
        mosqueeId: session.user.mosqueeId,
        professeurId: session.user.id,
      },
    });

    if (!classe) {
      return NextResponse.json(
        { error: "Classe non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Normaliser la date à minuit pour éviter les problèmes de comparaison
    const dateInput = new Date(data.date);
    const dateNormalized = new Date(
      dateInput.getFullYear(),
      dateInput.getMonth(),
      dateInput.getDate(),
      0,
      0,
      0,
      0
    );

    // Créer l'appel et les présences en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier si un appel existe déjà pour cette classe et cette date
      const existingAppel = await tx.appel.findFirst({
        where: {
          classeId: data.classeId,
          date: dateNormalized,
        },
      });

      // Créer ou mettre à jour l'appel
      let appel;
      if (existingAppel) {
        appel = await tx.appel.update({
          where: { id: existingAppel.id },
          data: {
            commentaireSeance: data.commentaireSeance || null,
          },
        });
      } else {
        appel = await tx.appel.create({
          data: {
            date: dateNormalized,
            classeId: data.classeId,
            professeurId: session.user.id,
            mosqueeId: session.user.mosqueeId,
            commentaireSeance: data.commentaireSeance || null,
          },
        });
      }

      // Supprimer les anciennes présences pour cette date et cette classe
      await tx.presence.deleteMany({
        where: {
          classeId: data.classeId,
          appelId: appel.id,
        },
      });

      // Créer les nouvelles présences
      const presences = await Promise.all(
        data.presences.map((presence) =>
          tx.presence.create({
            data: {
              date: dateNormalized,
              statut: presence.statut,
              commentaire: presence.commentaire || null,
              eleveId: presence.eleveId,
              classeId: data.classeId,
              professeurId: session.user.id,
              mosqueeId: session.user.mosqueeId,
              appelId: appel.id,
            },
          })
        )
      );

      return { appel, presences };
    });

    console.log("Appel créé/mis à jour:", result.appel.id, "Date:", result.appel.date);

    // Revalider les pages concernées pour synchronisation temps réel
    revalidatePath("/professeur/appel");
    revalidatePath("/professeur/appel/historique");
    revalidatePath("/parent/presences");
    revalidatePath("/eleve/presences");
    revalidatePath("/admin");
    revalidateTag("presences");

    return NextResponse.json(result, { status: 201 });
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
