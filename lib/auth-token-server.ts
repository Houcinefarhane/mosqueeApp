import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homePathForRole } from "@/lib/auth-redirect";

function cookieHeaderFromStore(): string {
  return cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

/** Même source que le middleware (JWT), sans importer Prisma. */
export async function getAuthToken() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  return getToken({
    req: {
      headers: { cookie: cookieHeaderFromStore() },
    } as Parameters<typeof getToken>[0]["req"],
    secret,
  });
}

export async function requireDashboardRole(
  expectedRole: "ADMIN" | "PROFESSEUR" | "PARENT" | "ELEVE"
) {
  const token = await getAuthToken();
  if (!token) {
    redirect("/auth/login");
  }

  const role = token.role as string | undefined;
  if (role !== expectedRole) {
    redirect(homePathForRole(role));
  }

  return token;
}
