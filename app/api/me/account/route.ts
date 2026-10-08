import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  AccountDeletionError,
  deleteUserAccount,
} from "@/lib/gdpr/delete-user-account";
import { getLegalConfig } from "@/lib/legal/config";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    await deleteUserAccount(session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AccountDeletionError) {
      if (err.code === "ADMIN_CONTACT") {
        const { contactNotice } = getLegalConfig();
        return NextResponse.json(
          {
            error: err.message,
            code: err.code,
            contactNotice,
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
