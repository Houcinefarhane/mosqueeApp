import DashboardShell from "@/components/layout/DashboardShell";
import { requireDashboardRole } from "@/lib/auth-token-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardRole("ADMIN");

  return <DashboardShell role="ADMIN">{children}</DashboardShell>;
}
