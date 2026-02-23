"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  useEffect(() => {
    if (message) {
      // Afficher le message de succès temporairement
      setTimeout(() => {
        // Le message disparaîtra après 5 secondes
      }, 5000);
    }
  }, [message]);

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
        // Attendre que la session soit créée et revalider
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Utiliser router.push avec refresh pour mettre à jour la session
        router.push("/");
        router.refresh();
        
        // Fallback : si après 1 seconde on est toujours sur la page de login, forcer le rechargement
        setTimeout(() => {
          if (window.location.pathname === "/auth/login") {
            window.location.href = "/";
          }
        }, 1000);
      } else {
        setError("Une erreur est survenue lors de la connexion");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
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
        className="w-full max-w-md relative z-10"
      >
        <Card variant="elevated" className="backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg"
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl text-center text-primary mb-2">
              MadrasaApp
            </CardTitle>
            <CardDescription className="text-center">
              Connectez-vous à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-sm text-green-700 text-center">{message}</p>
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
                  className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
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
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
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
              className="space-y-3 mt-6 pt-6 border-t border-gray-200"
            >
              <p className="text-center text-sm text-gray-600 font-medium">
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
