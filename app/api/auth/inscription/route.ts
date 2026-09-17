import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const inscriptionSchema = z.object({
  nomMosquee: z.string().min(1, "Le nom de la mosquée est requis"),
  adresseMosquee: z.string().optional(),
  telephoneMosquee: z.string().optional(),
  emailMosquee: z.string().email().optional().or(z.literal("")),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = inscriptionSchema.parse(body);

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Créer la mosquée et l'admin en transaction avec retry
    const result = await withRetry(async () => {
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error("Cet email est déjà utilisé");
      }

      // Créer la mosquée et l'admin en transaction
      return await prisma.$transaction(async (tx) => {
        // Créer la mosquée
        const mosquee = await tx.mosquee.create({
          data: {
            nom: data.nomMosquee,
            adresse: data.adresseMosquee || null,
            telephone: data.telephoneMosquee || null,
            email: data.emailMosquee || null,
          },
        });

        // Créer l'admin
        const admin = await tx.user.create({
          data: {
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            telephone: data.telephone || null,
            password: hashedPassword,
            role: "ADMIN",
            mosqueeId: mosquee.id,
          },
        });

        return { mosquee, admin };
      });
    });

    // Ne pas retourner le mot de passe
    const { password, ...adminWithoutPassword } = result.admin;

    return NextResponse.json(
      { 
        mosquee: result.mosquee, 
        admin: adminWithoutPassword,
        codeMosquee: result.mosquee.id // Le code mosquée est l'ID
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
    
    // Gérer les erreurs spécifiques
    if (error.message === "Cet email est déjà utilisé") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
