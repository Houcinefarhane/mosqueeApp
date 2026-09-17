"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ChevronDown, Menu } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants/status";
import { cn } from "@/lib/utils";
import { useMobileNav } from "@/components/layout/MobileNavContext";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toggle: toggleSidebar } = useMobileNav();

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
    <header
      className="sticky top-0 z-50 border-b border-primary-dark/40 bg-gradient-to-r from-primary-dark via-primary to-primary-light shadow-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image
            src="/logo-mosquee.png"
            alt="AMP Mosquée de Plaisir"
            width={36}
            height={36}
            className="h-8 w-8 shrink-0 rounded-md bg-white/95 p-0.5 shadow-sm sm:h-10 sm:w-10"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
              MadrasaApp
            </p>
            <p className="hidden truncate text-[10px] tracking-widest text-secondary-light/90 sm:block">
              MOSQUÉE DE PLAISIR
            </p>
          </div>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/10 sm:gap-2 sm:px-2 sm:py-1.5"
            aria-expanded={open}
            aria-haspopup="true"
          >
            <div className="hidden text-right sm:block">
              <p className="max-w-[120px] truncate text-sm font-medium text-white lg:max-w-none">
                {session.user.name}
              </p>
              <p className="text-xs text-secondary-light/80">{roleLabel}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary-dark ring-2 ring-white/20">
              {initials}
            </div>
            <ChevronDown
              className={cn(
                "hidden h-4 w-4 text-white/60 transition-transform sm:block",
                open && "rotate-180"
              )}
            />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-secondary/20 bg-surface py-1 shadow-elevated">
              <div className="border-b border-surface-muted px-4 py-3 sm:hidden">
                <p className="text-sm font-medium text-foreground">{session.user.name}</p>
                <p className="text-xs text-primary/60">{roleLabel}</p>
              </div>
              <div className="hidden border-b border-surface-muted px-4 py-2 sm:block">
                <p className="truncate text-xs text-primary/60">{session.user.email}</p>
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
