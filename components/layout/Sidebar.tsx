"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useMobileNav } from "@/components/layout/MobileNavContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Bell,
  X,
  ClipboardList,
  BookOpenCheck,
  MessageSquare,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "messages";
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const adminNavSections: NavSection[] = [
  {
    label: "Principal",
    items: [{ label: "Tableau de bord", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Gestion",
    items: [
      { label: "Classes", href: "/admin/classes", icon: BookOpen },
      { label: "Élèves", href: "/admin/eleves", icon: Users },
      { label: "Parents", href: "/admin/parents", icon: Users },
      { label: "Professeurs", href: "/admin/professeurs", icon: Users },
      { label: "Planning", href: "/admin/planning", icon: Calendar },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Annonces", href: "/admin/annonces", icon: Bell },
      { label: "Messages", href: "/admin/messages", icon: MessageSquare, badge: "messages" },
    ],
  },
];

const professeurNavSections: NavSection[] = [
  {
    label: "Principal",
    items: [{ label: "Tableau de bord", href: "/professeur", icon: LayoutDashboard }],
  },
  {
    label: "Pédagogie",
    items: [
      { label: "Mes classes", href: "/professeur/classes", icon: BookOpen },
      { label: "Appel", href: "/professeur/appel", icon: ClipboardList },
      { label: "Historique appels", href: "/professeur/appel/historique", icon: Calendar },
      { label: "Notes", href: "/professeur/notes", icon: FileText },
      { label: "Historique notes", href: "/professeur/notes/historique", icon: FileText },
      { label: "Devoirs", href: "/professeur/devoirs", icon: BookOpenCheck },
    ],
  },
  {
    label: "Organisation",
    items: [{ label: "Planning", href: "/professeur/planning", icon: Calendar }],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/professeur/messages", icon: MessageSquare, badge: "messages" },
    ],
  },
];

const parentNavSections: NavSection[] = [
  {
    label: "Principal",
    items: [{ label: "Tableau de bord", href: "/parent", icon: LayoutDashboard }],
  },
  {
    label: "Suivi",
    items: [
      { label: "Présences", href: "/parent/presences", icon: ClipboardList },
      { label: "Notes", href: "/parent/notes", icon: FileText },
      { label: "Devoirs", href: "/parent/devoirs", icon: BookOpenCheck },
      { label: "Planning", href: "/parent/planning", icon: Calendar },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/parent/messages", icon: MessageSquare, badge: "messages" },
    ],
  },
];

const eleveNavSections: NavSection[] = [
  {
    label: "Principal",
    items: [{ label: "Tableau de bord", href: "/eleve", icon: LayoutDashboard }],
  },
  {
    label: "Mon espace",
    items: [
      { label: "Mes notes", href: "/eleve/notes", icon: FileText },
      { label: "Devoirs", href: "/eleve/devoirs", icon: BookOpenCheck },
      { label: "Mes présences", href: "/eleve/presences", icon: ClipboardList },
      { label: "Mon planning", href: "/eleve/planning", icon: Calendar },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/eleve/messages", icon: MessageSquare, badge: "messages" },
    ],
  },
];

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useMobileNav();
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

  const getNavSections = (): NavSection[] => {
    switch (role) {
      case "ADMIN":
        return adminNavSections;
      case "PROFESSEUR":
        return professeurNavSections;
      case "PARENT":
        return parentNavSections;
      case "ELEVE":
        return eleveNavSections;
      default:
        return [];
    }
  };

  const sections = getNavSections();

  const isActive = (href: string) => {
    const dashboards = ["/admin", "/professeur", "/parent", "/eleve"];
    if (dashboards.includes(href)) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 z-40 w-[min(18rem,85vw)] shrink-0 border-r border-primary-dark/60 bg-gradient-to-b from-primary-dark to-[#2a1812] shadow-xl transition-transform duration-300 lg:sticky lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)] lg:w-60 lg:translate-x-0",
          "top-14 h-[calc(100dvh-3.5rem)] sm:top-16 sm:h-[calc(100dvh-4rem)]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
          <p className="text-sm font-medium text-white">Navigation</p>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex h-[calc(100%-3.25rem)] flex-col gap-1 overflow-y-auto p-3 lg:h-full">
          {sections.map((section, sectionIndex) => (
            <div key={section.label}>
              {sectionIndex > 0 && (
                <div className="mb-1.5 mt-1 border-t border-white/10" aria-hidden="true" />
              )}
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-secondary/60">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        close();
                        router.push(item.href);
                      }}
                      className={cn(
                        "relative flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all",
                        active
                          ? "bg-white/12 text-white shadow-sm ring-1 ring-white/10"
                          : "text-white/65 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-secondary" />
                      )}
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          active ? "text-secondary-light" : "text-white/40"
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge === "messages" && unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-bold text-primary-dark">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
    </>
  );
}
