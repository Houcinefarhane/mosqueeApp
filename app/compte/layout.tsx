import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const homeByRole: Record<string, string> = {
  ADMIN: "/admin",
  PROFESSEUR: "/professeur",
  PARENT: "/parent",
  ELEVE: "/eleve",
};

export default async function CompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const home = homeByRole[session.user.role] ?? "/";

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
