import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth-token-server";
import { homePathForRole } from "@/lib/auth-redirect";

export default async function CompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/auth/login");

  const home = homePathForRole(token.role as string);

  return (
    <div className="app-background min-h-[100dvh]">
      <div className="border-b border-filet bg-blanc px-4 py-3">
        <Link
          href={home}
          className="text-sm font-semibold text-or hover:underline"
        >
          ← Retour à l&apos;application
        </Link>
      </div>
      {children}
    </div>
  );
}
