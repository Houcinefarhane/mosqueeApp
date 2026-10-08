"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  /** Menu déroulant navbar (fond clair) vs barre brune */
  variant?: "menu" | "navbar";
};

export default function ThemeToggle({
  className,
  variant = "menu",
}: ThemeToggleProps) {
  const { theme, toggleTheme, ready } = useTheme();

  if (!ready) return null;

  const isDark = theme === "dark";
  const label = isDark ? "Mode clair" : "Mode sombre";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors",
        variant === "menu"
          ? "text-brun hover:bg-sable"
          : "text-white/90 hover:bg-white/10",
        className
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0 text-or" aria-hidden />
      ) : (
        <Moon className="h-4 w-4 shrink-0 text-or" aria-hidden />
      )}
      {label}
    </button>
  );
}
