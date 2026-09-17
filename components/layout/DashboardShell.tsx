"use client";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import { MobileNavProvider } from "@/components/layout/MobileNavContext";

interface DashboardShellProps {
  role: string;
  children: React.ReactNode;
}

export default function DashboardShell({ role, children }: DashboardShellProps) {
  return (
    <MobileNavProvider>
      <div className="app-background flex min-h-screen min-h-[100dvh] flex-col">
        <Navbar />
        <div className="flex min-h-0 flex-1">
          <Sidebar role={role} />
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:px-5 sm:py-5 lg:px-8 lg:py-8 lg:pb-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
        <BottomNav role={role} />
      </div>
    </MobileNavProvider>
  );
}
