"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "PROFESSEUR":
        return "Professeur";
      case "PARENT":
        return "Parent";
      case "ELEVE":
        return "Élève";
      default:
        return role;
    }
  };

  const getDashboardPath = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "PROFESSEUR":
        return "/professeur";
      case "PARENT":
        return "/parent";
      case "ELEVE":
        return "/eleve";
      default:
        return "/";
    }
  };

  if (!session) return null;

  return (
    <motion.nav
      className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(getDashboardPath(session.user.role))}
              className="text-2xl font-bold gradient-primary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              MadrasaApp
            </button>
            <span className="hidden sm:inline text-sm text-gray-600 px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
              {getRoleLabel(session.user.role)}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">
                {session.user.email}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="whitespace-nowrap"
            >
              <span className="hidden sm:inline">Déconnexion</span>
              <span className="sm:hidden">Déco</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
