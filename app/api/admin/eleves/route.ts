import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withDevPerf } from "@/lib/dev/with-dev-perf";
import { parseListParams, getPaginationMeta } from "@/lib/admin/list-params";
import { buildEleveSearchWhere } from "@/lib/admin/search-filters";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";

const createEleveSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
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

async function getEleves(req: NextRequest) {
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
      const eleves = await prisma.eleve.findMany({
        where: { mosqueeId: session.user.mosqueeId },
        include: { classe: true, parent: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      });
      return NextResponse.json(eleves);
    }

    const { q, page, pageSize } = parseListParams({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });
    const where = buildEleveSearchWhere(session.user.mosqueeId, q);
    const total = await prisma.eleve.count({ where });
    const { safePage, totalPages } = getPaginationMeta(total, page, pageSize);

    const eleves = await prisma.eleve.findMany({
      where,
      include: { classe: true, parent: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: eleves,
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

export const GET = withDevPerf("GET /api/admin/eleves", getEleves);
