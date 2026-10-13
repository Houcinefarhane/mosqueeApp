import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth-token-server";
import { homePathForRole } from "@/lib/auth-redirect";

export default async function CompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/auth/login");

  const home = homePathForRole(session.user.role);

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
