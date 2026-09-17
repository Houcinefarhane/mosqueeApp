import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  ClipboardList,
  FileText,
  BookOpenCheck,
  Menu,
} from "lucide-react";

export interface MobileNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Ouvre le menu latéral au lieu de naviguer */
  openMenu?: boolean;
}

const MENU_ITEM: MobileNavItem = {
  label: "Menu",
  href: "#menu",
  icon: Menu,
  openMenu: true,
};

export function getMobileNavItems(role: string): MobileNavItem[] {
  switch (role) {
    case "ADMIN":
      return [
        { label: "Accueil", href: "/admin", icon: LayoutDashboard },
        { label: "Classes", href: "/admin/classes", icon: BookOpen },
        { label: "Élèves", href: "/admin/eleves", icon: Users },
        { label: "Messages", href: "/admin/messages", icon: MessageSquare },
        MENU_ITEM,
      ];
    case "PROFESSEUR":
      return [
        { label: "Accueil", href: "/professeur", icon: LayoutDashboard },
        { label: "Appel", href: "/professeur/appel", icon: ClipboardList },
        { label: "Notes", href: "/professeur/notes", icon: FileText },
        { label: "Messages", href: "/professeur/messages", icon: MessageSquare },
        MENU_ITEM,
      ];
    case "PARENT":
      return [
        { label: "Accueil", href: "/parent", icon: LayoutDashboard },
        { label: "Présences", href: "/parent/presences", icon: ClipboardList },
        { label: "Notes", href: "/parent/notes", icon: FileText },
        { label: "Messages", href: "/parent/messages", icon: MessageSquare },
        MENU_ITEM,
      ];
    case "ELEVE":
      return [
        { label: "Accueil", href: "/eleve", icon: LayoutDashboard },
        { label: "Devoirs", href: "/eleve/devoirs", icon: BookOpenCheck },
        { label: "Notes", href: "/eleve/notes", icon: FileText },
        { label: "Messages", href: "/eleve/messages", icon: MessageSquare },
        MENU_ITEM,
      ];
    default:
      return [];
  }
}
