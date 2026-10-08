import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const pref = await prisma.pushNotificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    annoncesEnabled: pref?.annoncesEnabled ?? true,
    messagesEnabled: pref?.messagesEnabled ?? true,
    absencesEnabled: pref?.absencesEnabled ?? true,
    pushPromptSeenAt: pref?.pushPromptSeenAt ?? null,
  });
}

const patchSchema = z.object({
  annoncesEnabled: z.boolean().optional(),
  messagesEnabled: z.boolean().optional(),
  absencesEnabled: z.boolean().optional(),
  pushPromptSeenAt: z.string().datetime().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const pref = await prisma.pushNotificationPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        annoncesEnabled: data.annoncesEnabled ?? true,
        messagesEnabled: data.messagesEnabled ?? true,
        absencesEnabled: data.absencesEnabled ?? true,
        pushPromptSeenAt: data.pushPromptSeenAt
          ? new Date(data.pushPromptSeenAt)
          : undefined,
      },
      update: {
        ...(data.annoncesEnabled !== undefined
          ? { annoncesEnabled: data.annoncesEnabled }
          : {}),
        ...(data.messagesEnabled !== undefined
          ? { messagesEnabled: data.messagesEnabled }
          : {}),
        ...(data.absencesEnabled !== undefined
          ? { absencesEnabled: data.absencesEnabled }
          : {}),
        ...(data.pushPromptSeenAt
          ? { pushPromptSeenAt: new Date(data.pushPromptSeenAt) }
          : {}),
      },
    });

    return NextResponse.json(pref);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
