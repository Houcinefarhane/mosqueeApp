import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { homePathForRole } from "@/lib/auth-redirect";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path === "/") {
      if (!token) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
      return NextResponse.redirect(
        new URL(homePathForRole(token.role as string), req.url)
      );
    }

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const role = token.role as string;

    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(homePathForRole(role), req.url));
    }

    if (path.startsWith("/professeur") && role !== "PROFESSEUR") {
      return NextResponse.redirect(new URL(homePathForRole(role), req.url));
    }

    if (path.startsWith("/parent") && role !== "PARENT") {
      return NextResponse.redirect(new URL(homePathForRole(role), req.url));
    }

    if (path.startsWith("/eleve") && role !== "ELEVE") {
      return NextResponse.redirect(new URL(homePathForRole(role), req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === "/") return true;
        return !!token;
      },
    },
  }
);

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
