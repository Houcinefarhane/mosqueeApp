import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { MESSAGING_ROLES } from "@/lib/messages/constants";
import type { Role } from "@prisma/client";

const ALLOWED_ROLES = MESSAGING_ROLES;

interface RouteParams {
  params: { id: string };
}

export async function PATCH(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const message = await withRetry(() =>
      prisma.message.findFirst({
        where: {
          id: params.id,
          mosqueeId: session.user.mosqueeId,
          receiverId: session.user.id,
        },
      })
    );

    if (!message) {
      return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
    }

    if (message.lu) {
      return NextResponse.json({ success: true });
    }

    await withRetry(() =>
      prisma.message.update({
        where: { id: params.id },
        data: { lu: true },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
