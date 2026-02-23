import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(
  req: NextRequest,
  { params }: { params: { paiementId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const paiement = await prisma.paiement.findFirst({
      where: {
        id: params.paiementId,
        mosqueeId: session.user.mosqueeId,
        parentId: session.user.id,
        statut: { in: ["EN_ATTENTE", "EN_RETARD"] },
      },
      include: {
        eleve: true,
      },
    });

    if (!paiement) {
      return NextResponse.json(
        { error: "Paiement non trouvé ou déjà payé" },
        { status: 404 }
      );
    }

    // Créer une session de paiement Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Cotisation - ${paiement.eleve.prenom} ${paiement.eleve.nom}`,
            },
            unit_amount: Math.round(paiement.montant * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/parent/paiements?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/parent/paiements?canceled=true`,
      metadata: {
        paiementId: paiement.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Erreur Stripe:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
