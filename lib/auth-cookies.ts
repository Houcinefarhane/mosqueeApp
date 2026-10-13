import type { NextRequest } from "next/server";

/** Même règle que NextAuth : cookies __Secure-* quand NEXTAUTH_URL est en HTTPS. */
export function shouldUseSecureAuthCookies(): boolean {
  const url = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "");
  if (url) {
    return url.startsWith("https://");
  }
  return process.env.NODE_ENV === "production";
}

export function getNextAuthSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET?.trim();
}

export type GetTokenFromRequestOptions = {
  secret: string;
  secureCookie: boolean;
};

export function getTokenOptionsFromRequest(
  req: NextRequest
): GetTokenFromRequestOptions | null {
  const secret = getNextAuthSecret();
  if (!secret) return null;
  return {
    secret,
    secureCookie: shouldUseSecureAuthCookies(),
  };
}

const SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
  "__Host-next-auth.session-token",
] as const;

export function expectedSessionCookieName(): string {
  return shouldUseSecureAuthCookies()
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

/** Noms de cookies présents (sans valeurs) pour diagnostic middleware Edge. */
export function inspectSessionCookies(req: NextRequest): {
  expectedName: string;
  presentSessionCookieName: string | null;
  nextAuthCookieNames: string[];
  hasNextAuthSessionValue: boolean;
} {
  const expectedName = expectedSessionCookieName();
  const allNames = req.cookies.getAll().map((c) => c.name);
  const nextAuthCookieNames = allNames.filter((n) => n.includes("next-auth"));

  let presentSessionCookieName: string | null = null;
  for (const name of SESSION_COOKIE_NAMES) {
    if (req.cookies.has(name)) {
      presentSessionCookieName = name;
      break;
    }
  }

  const sessionCookie = presentSessionCookieName
    ? req.cookies.get(presentSessionCookieName)
    : undefined;

  return {
    expectedName,
    presentSessionCookieName,
    nextAuthCookieNames,
    hasNextAuthSessionValue: Boolean(sessionCookie?.value?.length),
  };
}
