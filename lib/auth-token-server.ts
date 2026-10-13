import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  homePathForRole,
  normalizeAuthRole,
} from "@/lib/auth-redirect";
import {
  getNextAuthSecret,
  shouldUseSecureAuthCookies,
} from "@/lib/auth-cookies";

function cookieHeaderFromStore(): string {
  return cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

/** Même source que le middleware (JWT), sans importer Prisma. */
export async function getAuthToken() {
  const secret = getNextAuthSecret();
  if (!secret) return null;

  return getToken({
    req: {
      headers: { cookie: cookieHeaderFromStore() },
    } as Parameters<typeof getToken>[0]["req"],
    secret,
    secureCookie: shouldUseSecureAuthCookies(),
  });
}

export async function requireDashboardRole(
  expectedRole: "ADMIN" | "PROFESSEUR" | "PARENT" | "ELEVE"
) {
  const token = await getAuthToken();
  if (!token) {
    console.warn(
      `[auth] redirect login: no JWT (expected role ${expectedRole}, secureCookie=${shouldUseSecureAuthCookies()})`
    );
    redirect("/auth/login");
  }

  const role = normalizeAuthRole(token.role as string);
  if (role !== expectedRole) {
    const dest = homePathForRole(role);
    console.warn(
      `[auth] redirect role mismatch: got ${role ?? "(none)"}, expected ${expectedRole}, dest=${dest}`
    );
    redirect(dest);
  }

  return token;
}
