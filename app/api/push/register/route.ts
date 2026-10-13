import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isApnsDeviceTokenHex } from "@/lib/push/token-format";
import { z } from "zod";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { token, platform } = registerSchema.parse(body);

    if (platform === "ios" && isApnsDeviceTokenHex(token)) {
      console.warn(
        "[push] register refusé: token APNs hex (FCM requis). Mettre à jour l'app iOS avec Firebase Messaging."
      );
      return NextResponse.json(
        {
          error:
            "Token push iOS obsolète. Mettez à jour l'application MadrasApp depuis l'App Store / Xcode puis reconnectez-vous.",
          code: "APNS_NOT_FCM",
        },
        { status: 400 }
      );
    }

    await prisma.deviceToken.upsert({
      where: { token },
      create: {
        token,
        platform,
        userId: session.user.id,
        mosqueeId: session.user.mosqueeId,
      },
      update: {
        userId: session.user.id,
        mosqueeId: session.user.mosqueeId,
        platform,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
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

const deleteSchema = z.object({
  token: z.string().optional(),
});

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { token } = deleteSchema.parse(body);

    if (token) {
      await prisma.deviceToken.deleteMany({
        where: { token, userId: session.user.id },
      });
    } else {
      await prisma.deviceToken.deleteMany({
        where: { userId: session.user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
