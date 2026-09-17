import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const parents = await prisma.user.findMany({
      where: {
        mosqueeId: session.user.mosqueeId,
        role: "PARENT",
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
      },
    });

    return NextResponse.json(parents);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
