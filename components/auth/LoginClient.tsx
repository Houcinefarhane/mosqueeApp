"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { homePathForRole } from "@/lib/auth-redirect";
import { motion } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/Card";
import Link from "next/link";
import Logo from "@/components/brand/Logo";

type LoginClientProps = {
  message?: string;
};

async function goToRoleHome(): Promise<boolean> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  if (!res.ok) return false;
  const data = (await res.json()) as { user?: { role?: string } };
  const dest = homePathForRole(data.user?.role);
  if (dest === "/auth/login") return false;
  window.location.replace(dest);
  return true;
}

export default function LoginClient({ message }: LoginClientProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void goToRoleHome();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        await new Promise((r) => setTimeout(r, 300));
        if (!(await goToRoleHome())) {
          window.location.replace("/auth/login");
        }
        return;
      }

      setError("Une erreur est survenue lors de la connexion");
      setIsLoading(false);
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-nuit p-3 sm:p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 h-72 w-72 rounded-full bg-or/20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-or/15 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card variant="elevated" className="border-filet bg-blanc shadow-elevated">
          <CardHeader className="pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 flex justify-center"
            >
              <Logo size={72} withWordmark onDark={false} />
            </motion.div>
            <CardDescription className="mt-2 text-center">
              Connectez-vous à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3"
              >
                <p className="text-center text-sm text-green-700">{message}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Input
                  label="Mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </motion.div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                      />
                      Connexion...
                    </span>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 space-y-3 border-t border-gray-200 pt-6"
            >
              <p className="text-center text-sm font-medium text-gray-600">
                Pas encore de compte ?
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/auth/inscription">
                  <Button variant="outline" size="sm" className="w-full">
                    Créer un compte mosquée (Admin)
                  </Button>
                </Link>
                <Link href="/auth/inscription/professeur">
                  <Button variant="outline" size="sm" className="w-full">
                    Inscription Professeur
                  </Button>
                </Link>
                <Link href="/auth/inscription/parent">
                  <Button variant="outline" size="sm" className="w-full">
                    Inscription Parent
                  </Button>
                </Link>
                <Link href="/auth/inscription/eleve">
                  <Button variant="outline" size="sm" className="w-full">
                    Inscription Élève
                  </Button>
                </Link>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
