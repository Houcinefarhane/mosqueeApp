import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { homePathForRole, normalizeAuthRole } from "@/lib/auth-redirect";

/** Session serveur NextAuth (même source que /api/auth/session). */
export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function requireDashboardRole(
  expectedRole: "ADMIN" | "PROFESSEUR" | "PARENT" | "ELEVE"
) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    console.warn(
      `[auth] redirect login: no session (expected role ${expectedRole})`
    );
    redirect("/auth/login");
  }

  const role = normalizeAuthRole(session.user.role);
  if (role !== expectedRole) {
    const dest = homePathForRole(role);
    console.warn(
      `[auth] redirect role mismatch: got ${role ?? "(none)"}, expected ${expectedRole}, dest=${dest}`
    );
    redirect(dest);
  }

  return session;
}
