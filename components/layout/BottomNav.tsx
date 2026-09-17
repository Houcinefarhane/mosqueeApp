"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  if (items.length === 0) return null;

  const isActive = (href: string) => {
    const dashboards = ["/admin", "/professeur", "/parent", "/eleve"];
    if (dashboards.includes(href)) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/10 bg-surface/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = !item.openMenu && isActive(item.href);

          if (item.openMenu) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={open}
                className="flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-primary/60 transition-colors active:bg-surface-muted"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate text-[10px] font-medium">
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
                "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors active:bg-surface-muted",
                active ? "text-primary" : "text-primary/55"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-secondary-dark")} />
              <span className="max-w-full truncate text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
