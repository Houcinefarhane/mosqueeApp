import DashboardShell from "@/components/layout/DashboardShell";
import { requireDashboardRole } from "@/lib/auth-token-server";

export default async function EleveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardRole("ELEVE");

  return <DashboardShell role="ELEVE">{children}</DashboardShell>;
}
