import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { getNextAuthSecret, shouldUseSecureAuthCookies } from "./auth-cookies";

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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { mosquee: true },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: user.role,
            mosqueeId: user.mosqueeId,
          };
        } catch (error) {
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
          typeof user.role === "string"
            ? user.role.trim().toUpperCase()
            : user.role;
        token.mosqueeId = user.mosqueeId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id || token.sub) as string;
        session.user.role = token.role as string;
        session.user.mosqueeId = token.mosqueeId as string;
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
