import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

interface DashboardShellProps {
  role: string;
  children: React.ReactNode;
}

export default function DashboardShell({ role, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar role={role} />
        <main className="min-h-[calc(100vh-4rem)] flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
