import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const inscriptionProfesseurSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  codeMosquee: z.string().min(1, "Le code mosquée est requis"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, prenom, email, telephone, password, codeMosquee } =
      inscriptionProfesseurSchema.parse(body);

    // Vérifier que le code mosquée existe
    const mosquee = await prisma.mosquee.findFirst({
      where: {
        OR: [
          { id: codeMosquee },
        ],
      },
    });

    if (!mosquee) {
      return NextResponse.json(
        { error: "Code mosquée invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur professeur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        telephone,
        role: "PROFESSEUR",
        mosqueeId: mosquee.id,
      },
    });

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        userId: user.id,
      },
      { status: 201 }
    );
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
