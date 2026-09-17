"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronDown } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants/status";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) return null;

  const roleLabel =
    ROLE_LABELS[session.user.role as keyof typeof ROLE_LABELS] ??
    session.user.role;

  const initials =
    session.user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="pl-10 lg:pl-0">
          <p className="text-lg font-semibold tracking-tight text-primary">
            MadrasaApp
          </p>
          <p className="hidden text-xs text-gray-500 sm:block">
            Gestion école coranique
          </p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50"
            aria-expanded={open}
            aria-haspopup="true"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-transparent transition-all hover:ring-primary/20">
              {initials}
            </div>
            <ChevronDown
              className={cn(
                "hidden h-4 w-4 text-gray-400 transition-transform sm:block",
                open && "rotate-180"
              )}
            />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3 sm:hidden">
                <p className="text-sm font-medium text-foreground">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500">{roleLabel}</p>
              </div>
              <div className="hidden border-b border-gray-100 px-4 py-2 sm:block">
                <p className="truncate text-xs text-gray-500">{session.user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
