import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { homePathForRole, normalizeAuthRole } from "@/lib/auth-redirect";
import {
  getTokenOptionsFromRequest,
  shouldUseSecureAuthCookies,
} from "@/lib/auth-cookies";

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
    `[auth-middleware] redirect reason=${reason} path=${path} secureCookie=${shouldUseSecureAuthCookies()}${detail ? ` ${detail}` : ""}`
  );
}

function loginRedirect(req: NextRequest, fromPath: string) {
  const url = new URL("/auth/login", req.url);
  if (fromPath && fromPath !== "/auth/login") {
    url.searchParams.set("from", fromPath);
  }
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const tokenOpts = getTokenOptionsFromRequest(req);

  let token: Awaited<ReturnType<typeof getToken>> = null;
  if (tokenOpts) {
    token = await getToken({
      req,
      secret: tokenOpts.secret,
      secureCookie: tokenOpts.secureCookie,
    });
  } else {
    logAuthRedirect("missing_NEXTAUTH_SECRET", path);
  }

  if (path === "/") {
    if (!token) {
      logAuthRedirect("unauthenticated_root", path);
      return loginRedirect(req, path);
    }
    const dest = homePathForRole(token.role as string);
    logAuthRedirect("root_to_role_home", path, { role: String(token.role), dest });
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (!token) {
    logAuthRedirect("unauthenticated", path);
    return loginRedirect(req, path);
  }

  const role = normalizeAuthRole(token.role as string) ?? "";

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

  return NextResponse.next();
}

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
