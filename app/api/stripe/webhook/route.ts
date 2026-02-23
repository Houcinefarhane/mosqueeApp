import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY n'est pas configuré");
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json(
      { error: "Signature manquante" },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET n'est pas configuré" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Erreur webhook:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Gérer l'événement de paiement réussi
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const paiementId = session.metadata?.paiementId;

    if (paiementId) {
      await prisma.paiement.update({
        where: { id: paiementId },
        data: {
          statut: "PAYE",
          datePaiement: new Date(),
          stripePaymentId: session.payment_intent as string,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
