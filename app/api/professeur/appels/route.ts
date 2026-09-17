import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PROFESSEUR") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classeId = searchParams.get("classeId");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");

    const where: any = {
      professeurId: session.user.id,
      mosqueeId: session.user.mosqueeId,
    };

    if (classeId) {
      where.classeId = classeId;
    }

    if (dateDebut || dateFin) {
      where.date = {};
      if (dateDebut) {
        where.date.gte = new Date(dateDebut);
      }
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);
        where.date.lte = fin;
      }
    }

    const appels = await prisma.appel.findMany({
      where,
      include: {
        classe: {
          select: {
            id: true,
            nom: true,
            niveau: true,
          },
        },
        presences: {
          include: {
            eleve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        _count: {
          select: {
            presences: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    console.log("Appels trouvés:", appels.length, "pour professeur:", session.user.id);

    return NextResponse.json(appels);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
