import { redirect } from "next/navigation";
import LoginClient from "@/components/auth/LoginClient";
import { getServerAuthSession } from "@/lib/auth-token-server";
import { homePathForRole } from "@/lib/auth-redirect";

type LoginPageProps = {
  searchParams?: { message?: string; from?: string };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerAuthSession();
  const fromPath = searchParams?.from?.trim();

  if (session?.user?.role) {
    const dest = homePathForRole(session.user.role);
    if (dest !== "/auth/login") {
      if (fromPath && dest === fromPath) {
        console.warn(
          `[auth-login] session OK, redirect to dashboard ${dest} (from=${fromPath})`
        );
      }
      redirect(dest);
    }
  }

  return (
    <LoginClient
      message={searchParams?.message}
      fromPath={fromPath}
    />
  );
}
