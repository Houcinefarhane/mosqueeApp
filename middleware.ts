import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { homePathForRole, normalizeAuthRole } from "@/lib/auth-redirect";
import {
  getNextAuthSecret,
  getTokenOptionsFromRequest,
  inspectSessionCookies,
  shouldUseSecureAuthCookies,
} from "@/lib/auth-cookies";

function summarizeToken(
  token: Awaited<ReturnType<typeof getToken>>
): string {
  if (!token) return "null";
  const role = normalizeAuthRole(token.role as string) ?? "(no-role)";
  const sub = token.sub ? String(token.sub).slice(0, 8) : "?";
  return `role=${role} sub=${sub}…`;
}

function logAuthRedirect(
  reason: string,
  path: string,
  extra?: Record<string, string | undefined>
) {
  const detail = extra
    ? Object.entries(extra)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ")
    : "";
  console.warn(
    `[auth-middleware] redirect reason=${reason} path=${path}${detail ? ` ${detail}` : ""}`
  );
}

function logAuthRequest(
  path: string,
  cookieInfo: ReturnType<typeof inspectSessionCookies>,
  tokenSummary: string,
  hasSecret: boolean
) {
  console.warn(
    [
      "[auth-middleware] request",
      `path=${path}`,
      `hasSecret=${hasSecret}`,
      `secretLength=${hasSecret ? getNextAuthSecret()!.length : 0}`,
      `secureCookie=${shouldUseSecureAuthCookies()}`,
      `expectedCookie=${cookieInfo.expectedName}`,
      `presentCookie=${cookieInfo.presentSessionCookieName ?? "none"}`,
      `sessionValue=${cookieInfo.hasNextAuthSessionValue ? "yes" : "no"}`,
      `nextAuthCookies=[${cookieInfo.nextAuthCookieNames.join(",") || "none"}]`,
      `getToken=${tokenSummary}`,
    ].join(" ")
  );
}

function loginRedirect(req: NextRequest, fromPath: string, reason: string) {
  logAuthRedirect(reason, fromPath, { dest: "/auth/login" });
  const url = new URL("/auth/login", req.url);
  if (fromPath && fromPath !== "/auth/login") {
    url.searchParams.set("from", fromPath);
  }
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const cookieInfo = inspectSessionCookies(req);
  const hasSecret = Boolean(getNextAuthSecret());
  const tokenOpts = getTokenOptionsFromRequest(req);

  let token: Awaited<ReturnType<typeof getToken>> = null;
  if (tokenOpts) {
    token = await getToken({
      req,
      secret: tokenOpts.secret,
      secureCookie: tokenOpts.secureCookie,
    });
  }

  const tokenSummary = summarizeToken(token);
  logAuthRequest(path, cookieInfo, tokenSummary, hasSecret);

  if (!hasSecret) {
    return loginRedirect(req, path, "missing_NEXTAUTH_SECRET");
  }

  if (path === "/") {
    if (!token) {
      return loginRedirect(req, path, "unauthenticated_root");
    }
    const dest = homePathForRole(token.role as string);
    logAuthRedirect("root_to_role_home", path, {
      role: String(token.role),
      dest,
    });
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (!token) {
    const mismatch =
      cookieInfo.hasNextAuthSessionValue &&
      cookieInfo.presentSessionCookieName !== cookieInfo.expectedName
        ? "cookie_name_mismatch"
        : cookieInfo.hasNextAuthSessionValue
          ? "getToken_null_with_cookie"
          : "unauthenticated_no_session_cookie";
    return loginRedirect(req, path, mismatch);
  }

  const role = normalizeAuthRole(token.role as string) ?? "";

  if (!role) {
    return loginRedirect(req, path, "token_missing_role");
  }

  if (path.startsWith("/admin") && role !== "ADMIN") {
    const dest = homePathForRole(role);
    logAuthRedirect("role_mismatch", path, { role, expected: "ADMIN", dest });
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (path.startsWith("/professeur") && role !== "PROFESSEUR") {
    const dest = homePathForRole(role);
    logAuthRedirect("role_mismatch", path, {
      role,
      expected: "PROFESSEUR",
      dest,
    });
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (path.startsWith("/parent") && role !== "PARENT") {
    const dest = homePathForRole(role);
    logAuthRedirect("role_mismatch", path, { role, expected: "PARENT", dest });
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (path.startsWith("/eleve") && role !== "ELEVE") {
    const dest = homePathForRole(role);
    logAuthRedirect("role_mismatch", path, { role, expected: "ELEVE", dest });
    return NextResponse.redirect(new URL(dest, req.url));
  }

  console.warn(`[auth-middleware] allow path=${path} getToken=${tokenSummary}`);
  return NextResponse.next();
}

/** /api/auth/* est volontairement exclu (session, callback, csrf). */
export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/professeur/:path*",
    "/parent/:path*",
    "/eleve/:path*",
    "/compte/:path*",
  ],
};
