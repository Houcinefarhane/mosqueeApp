import DashboardShell from "@/components/layout/DashboardShell";
import { requireDashboardRole } from "@/lib/auth-token-server";

export default async function ProfesseurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardRole("PROFESSEUR");

  return <DashboardShell role="PROFESSEUR">{children}</DashboardShell>;
}
