import DashboardShell from "@/components/layout/DashboardShell";
import { requireDashboardRole } from "@/lib/auth-token-server";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardRole("PARENT");

  return <DashboardShell role="PARENT">{children}</DashboardShell>;
}
