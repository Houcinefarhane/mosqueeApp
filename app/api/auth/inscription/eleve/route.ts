import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const inscriptionEleveSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  codeEleve: z.string().min(1, "Le code élève est requis"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, prenom, email, telephone, password, codeEleve } =
      inscriptionEleveSchema.parse(body);

    // Vérifier que le code élève existe (l'ID de l'élève)
    const eleve = await prisma.eleve.findUnique({
      where: { id: codeEleve },
      include: {
        mosquee: true,
      },
    });

    if (!eleve) {
      return NextResponse.json(
        { error: "Code élève invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'élève n'a pas déjà un compte
    if (eleve.userId) {
      return NextResponse.json(
        { error: "Cet élève a déjà un compte" },
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

    // Vérifier que le nom et prénom correspondent
    if (
      eleve.nom.toLowerCase() !== nom.toLowerCase() ||
      eleve.prenom.toLowerCase() !== prenom.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Le nom et prénom ne correspondent pas à votre dossier" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur élève et lier à l'élève
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        telephone,
        role: "ELEVE",
        mosqueeId: eleve.mosqueeId,
      },
    });

    // Lier le compte à l'élève
    await prisma.eleve.update({
      where: { id: eleve.id },
      data: { userId: user.id },
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
