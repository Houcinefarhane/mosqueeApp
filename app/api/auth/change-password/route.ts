import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, "Au moins 10 caractères"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!ok) {
    return NextResponse.json(
      { error: "Mot de passe actuel incorrect" },
      { status: 403 }
    );
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, mustChangePassword: false },
  });

  return NextResponse.json({ ok: true });
}
