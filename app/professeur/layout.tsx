import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function ProfesseurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PROFESSEUR") {
    redirect("/auth/login");
  }

  return <DashboardShell role="PROFESSEUR">{children}</DashboardShell>;
}
