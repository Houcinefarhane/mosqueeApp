import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportUserPersonalData } from "@/lib/gdpr/export-user-data";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const data = await exportUserPersonalData(session.user.id);
  if (!data) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }

  const filename = `madrasapp-donnees-${session.user.id.slice(0, 8)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
