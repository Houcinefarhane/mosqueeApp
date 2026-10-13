import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { normalizeAuthRole } from "./auth-redirect";
import { getNextAuthSecret, shouldUseSecureAuthCookies } from "./auth-cookies";
import {
  isPhoneLikeIdentifier,
  normalizePhoneFR,
  phoneToLoginEmail,
} from "./phone/fr";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  loginRateLimitKey,
} from "./login-rate-limit";

const useSecureCookies = shouldUseSecureAuthCookies();

export const authOptions: NextAuthOptions = {
  secret: getNextAuthSecret(),
  useSecureCookies,
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email ou téléphone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim();
        const password = credentials?.password;

        if (!identifier || !password) {
          return null;
        }

        const headerList = headers();
        const ip =
          headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          headerList.get("x-real-ip") ??
          null;

        const rateKey = loginRateLimitKey(ip, identifier);
        const rate = await checkLoginRateLimit(rateKey);
        if (!rate.allowed) {
          throw new Error(`RATE_LIMIT:${rate.retryAfterSec ?? 900}`);
        }

        try {
          let user = null;

          if (isPhoneLikeIdentifier(identifier)) {
            const phone = normalizePhoneFR(identifier);
            if (!phone.ok) {
              return null;
            }
            user = await prisma.user.findFirst({
              where: { telephoneNormalized: phone.normalized },
              include: { mosquee: true },
            });
          } else {
            const email = identifier.toLowerCase();
            user = await prisma.user.findUnique({
              where: { email },
              include: { mosquee: true },
            });
          }

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          await clearLoginRateLimit(rateKey);

          return {
            id: user.id,
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: user.role,
            mosqueeId: user.mosqueeId,
            mustChangePassword: user.mustChangePassword,
          };
        } catch (error) {
          if (error instanceof Error && error.message.startsWith("RATE_LIMIT:")) {
            throw error;
          }
          console.error("[Auth] Erreur base de données:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role =
          normalizeAuthRole(String(user.role)) ?? String(user.role).toUpperCase();
        token.mosqueeId = user.mosqueeId;
        token.mustChangePassword = Boolean(
          (user as { mustChangePassword?: boolean }).mustChangePassword
        );
      } else if (typeof token.role === "string") {
        token.role = normalizeAuthRole(token.role) ?? token.role.trim().toUpperCase();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id || token.sub) as string;
        session.user.role =
          typeof token.role === "string"
            ? token.role.trim().toUpperCase()
            : (token.role as string);
        session.user.mosqueeId = token.mosqueeId as string;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
};

