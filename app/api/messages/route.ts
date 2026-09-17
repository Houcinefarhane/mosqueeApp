import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { z } from "zod";
import { createMessageSchema } from "@/lib/validators/messages";
import { isDestinataireAutorise } from "@/lib/messages/destinataires";
import { MESSAGING_ROLES } from "@/lib/messages/constants";
import { withDevPerf } from "@/lib/dev/with-dev-perf";
import type { Role } from "@prisma/client";

const ALLOWED_ROLES = MESSAGING_ROLES;

const messageInclude = {
  sender: { select: { id: true, prenom: true, nom: true, role: true } },
  receiver: { select: { id: true, prenom: true, nom: true, role: true } },
} as const;

const boxSchema = z.enum(["received", "sent"]).default("received");

async function getMessages(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const box = boxSchema.parse(searchParams.get("box") ?? "received");

    const where =
      box === "sent"
        ? { mosqueeId: session.user.mosqueeId, senderId: session.user.id }
        : { mosqueeId: session.user.mosqueeId, receiverId: session.user.id };

    const messages = await withRetry(() =>
      prisma.message.findMany({
        where,
        include: messageInclude,
        orderBy: { createdAt: "desc" },
      })
    );

    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Paramètre invalide" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withDevPerf("GET /api/messages", getMessages);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const data = createMessageSchema.parse(body);

    if (data.receiverId === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous envoyer un message" },
        { status: 400 }
      );
    }

    const autorise = await isDestinataireAutorise(
      session.user.id,
      role,
      session.user.mosqueeId,
      data.receiverId
    );

    if (!autorise) {
      return NextResponse.json(
        { error: "Destinataire non autorisé" },
        { status: 403 }
      );
    }

    const message = await withRetry(() =>
      prisma.message.create({
        data: {
          objet: data.objet,
          contenu: data.contenu,
          senderId: session.user.id,
          receiverId: data.receiverId,
          mosqueeId: session.user.mosqueeId,
        },
        include: messageInclude,
      })
    );

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
