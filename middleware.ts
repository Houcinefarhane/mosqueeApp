import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const role = token.role as string;

    // Protection des routes selon le rôle
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (path.startsWith("/professeur") && role !== "PROFESSEUR") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (path.startsWith("/parent") && role !== "PARENT") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (path.startsWith("/eleve") && role !== "ELEVE") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/professeur/:path*",
    "/parent/:path*",
    "/eleve/:path*",
  ],
  // Exclure les routes d'API et d'authentification
  exclude: ["/api/:path*", "/auth/:path*"],
};
