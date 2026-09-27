import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseListParams, getPaginationMeta } from "@/lib/admin/list-params";
import { buildParentSearchWhere } from "@/lib/admin/search-filters";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const paginated =
      searchParams.has("page") || searchParams.has("q");

    if (!paginated) {
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
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      });
      return NextResponse.json(parents);
    }

    const { q, page, pageSize } = parseListParams({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });
    const where = buildParentSearchWhere(session.user.mosqueeId, q);
    const total = await prisma.user.count({ where });
    const { safePage, totalPages } = getPaginationMeta(total, page, pageSize);

    const parents = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: parents,
      total,
      page: safePage,
      pageSize,
      totalPages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
