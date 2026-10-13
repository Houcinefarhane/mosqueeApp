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
