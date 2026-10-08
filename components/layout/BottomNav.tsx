"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getMobileNavItems } from "@/lib/navigation/mobile-nav";
import { useMobileNav } from "@/components/layout/MobileNavContext";

interface BottomNavProps {
  role: string;
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const { open } = useMobileNav();
  const items = getMobileNavItems(role);
  const [unreadCount, setUnreadCount] = useState(0);

  const hasMessaging =
    role === "ADMIN" ||
    role === "PROFESSEUR" ||
    role === "PARENT" ||
    role === "ELEVE";

  useEffect(() => {
    if (!hasMessaging) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/messages/non-lus");
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        setUnreadCount(data.count);
      } catch {
        // silencieux
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    const onUpdate = () => fetchUnread();
    window.addEventListener("messages-updated", onUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("messages-updated", onUpdate);
    };
  }, [hasMessaging]);

  if (items.length === 0) return null;

  const isActive = (href: string) => {
    const dashboards = ["/admin", "/professeur", "/parent", "/eleve"];
    if (dashboards.includes(href)) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isMessagesHref = (href: string) => href.includes("/messages");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-filet bg-blanc lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = !item.openMenu && isActive(item.href);
          const showBadge = isMessagesHref(item.href) && unreadCount > 0;

          if (item.openMenu) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={open}
                className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-brun-doux transition-colors active:bg-sable"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate text-xs font-medium leading-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors active:bg-sable",
                active ? "text-or" : "text-brun-doux"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5 shrink-0" />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-or px-1 text-[10px] font-bold text-nuit">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate text-xs font-medium leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
