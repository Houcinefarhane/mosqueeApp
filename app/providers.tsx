"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import AnalyticsWithConsent from "@/components/legal/AnalyticsWithConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <AnalyticsWithConsent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#1A1A2E",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          },
          success: {
            iconTheme: { primary: "#C8962E", secondary: "#1E110A" },
          },
          error: {
            iconTheme: { primary: "#DC2626", secondary: "#fff" },
          },
        }}
      />
    </SessionProvider>
  );
}
