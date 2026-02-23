"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  CreditCard,
  Bell,
  Menu,
  X
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNavItems: NavItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Classes", href: "/admin/classes", icon: BookOpen },
  { label: "Élèves", href: "/admin/eleves", icon: Users },
  { label: "Professeurs", href: "/admin/professeurs", icon: Users },
  { label: "Planning", href: "/admin/planning", icon: Calendar },
  { label: "Paiements", href: "/admin/paiements", icon: CreditCard },
  { label: "Annonces", href: "/admin/annonces", icon: Bell },
];

const professeurNavItems: NavItem[] = [
  { label: "Tableau de bord", href: "/professeur", icon: LayoutDashboard },
  { label: "Mes classes", href: "/professeur/classes", icon: BookOpen },
  { label: "Appel", href: "/professeur/appel", icon: FileText },
  { label: "Historique appels", href: "/professeur/appel/historique", icon: Calendar },
  { label: "Notes", href: "/professeur/notes", icon: FileText },
  { label: "Historique notes", href: "/professeur/notes/historique", icon: FileText },
  { label: "Planning", href: "/professeur/planning", icon: Calendar },
];

const parentNavItems: NavItem[] = [
  { label: "Tableau de bord", href: "/parent", icon: LayoutDashboard },
  { label: "Présences", href: "/parent/presences", icon: FileText },
  { label: "Notes", href: "/parent/notes", icon: FileText },
  { label: "Planning", href: "/parent/planning", icon: Calendar },
  { label: "Paiements", href: "/parent/paiements", icon: CreditCard },
];

const eleveNavItems: NavItem[] = [
  { label: "Tableau de bord", href: "/eleve", icon: LayoutDashboard },
  { label: "Mes notes", href: "/eleve/notes", icon: FileText },
  { label: "Mes présences", href: "/eleve/presences", icon: FileText },
  { label: "Mon planning", href: "/eleve/planning", icon: Calendar },
];

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getNavItems = () => {
    switch (role) {
      case "ADMIN":
        return adminNavItems;
      case "PROFESSEUR":
        return professeurNavItems;
      case "PARENT":
        return parentNavItems;
      case "ELEVE":
        return eleveNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMobileOpen(!isMobileOpen);
        }}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-primary" />
        ) : (
          <Menu className="w-6 h-6 text-primary" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 w-64 bg-white border-r border-gray-200 min-h-screen p-4 transition-transform duration-300 ease-in-out",
          // Mobile : cachée par défaut, visible quand isMobileOpen
          // Desktop (lg+) : toujours visible
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="mb-6 pt-4 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              MadrasaApp
            </h2>
            <p className="text-xs text-gray-500 mt-1">Gestion de mosquée</p>
          </motion.div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <motion.button
                key={item.href}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileOpen(false);
                  setTimeout(() => {
                    router.push(item.href);
                  }, 150);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "text-left",
                  isActive
                    ? "bg-primary text-white shadow-primary"
                    : "text-gray-700 hover:bg-primary/10 hover:text-primary"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          onTouchStart={(e) => {
            e.preventDefault();
            setIsMobileOpen(false);
          }}
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          style={{ touchAction: "none" }}
        />
      )}
    </>
  );
}
