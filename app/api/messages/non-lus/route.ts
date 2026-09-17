import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { MESSAGING_ROLES } from "@/lib/messages/constants";
import type { Role } from "@prisma/client";

const ALLOWED_ROLES = MESSAGING_ROLES;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const count = await withRetry(() =>
      prisma.message.count({
        where: {
          mosqueeId: session.user.mosqueeId,
          receiverId: session.user.id,
          lu: false,
        },
      })
    );

    return NextResponse.json({ count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
