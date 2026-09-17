import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath, revalidateTag } from "next/cache";

const createProfesseurSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().nullable().optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
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
    const data = createProfesseurSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const professeur = await prisma.user.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone || null,
        password: hashedPassword,
        role: "PROFESSEUR",
        mosqueeId: session.user.mosqueeId,
      },
    });

    // Ne pas retourner le mot de passe
    const { password, ...professeurWithoutPassword } = professeur;

    // Revalider les pages concernées
    revalidatePath("/admin/professeurs");
    revalidatePath("/admin");
    revalidateTag("professeurs");

    return NextResponse.json(professeurWithoutPassword, { status: 201 });
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

    const professeurs = await prisma.user.findMany({
      where: {
        mosqueeId: session.user.mosqueeId,
        role: "PROFESSEUR",
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(professeurs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
