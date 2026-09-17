import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import type { TypeDevoir } from "@prisma/client";

const createDevoirSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  contenu: z.string().min(1, "Le contenu est requis"),
  matiere: z.string().min(1, "La matière est requise"),
  type: z.enum(["DEVOIR", "CAHIER_TEXTE"]).default("DEVOIR"),
  dateLimite: z.string().optional().nullable(),
  classeId: z.string().min(1),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PROFESSEUR") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const devoirs = await withRetry(() =>
      prisma.devoir.findMany({
        where: {
          mosqueeId: session.user.mosqueeId,
          professeurId: session.user.id,
        },
        include: {
          classe: { select: { id: true, nom: true, niveau: true } },
          professeur: { select: { prenom: true, nom: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return NextResponse.json(devoirs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PROFESSEUR") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const data = createDevoirSchema.parse(body);

    const classe = await withRetry(() =>
      prisma.classe.findFirst({
        where: {
          id: data.classeId,
          mosqueeId: session.user.mosqueeId,
          professeurId: session.user.id,
        },
      })
    );

    if (!classe) {
      return NextResponse.json(
        { error: "Classe non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    const devoir = await withRetry(() =>
      prisma.devoir.create({
        data: {
          titre: data.titre,
          contenu: data.contenu,
          matiere: data.matiere,
          type: data.type as TypeDevoir,
          dateLimite: data.dateLimite ? new Date(data.dateLimite) : null,
          classeId: data.classeId,
          professeurId: session.user.id,
          mosqueeId: session.user.mosqueeId,
        },
        include: {
          classe: { select: { id: true, nom: true } },
          professeur: { select: { prenom: true, nom: true } },
        },
      })
    );

    revalidatePath("/professeur/devoirs");
    revalidatePath("/eleve/devoirs");
    revalidatePath("/parent/devoirs");
    revalidateTag("devoirs");

    return NextResponse.json(devoir, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
