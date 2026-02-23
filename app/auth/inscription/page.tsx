"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Link from "next/link";

export default function InscriptionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // Mosquée
    nomMosquee: "",
    adresseMosquee: "",
    telephoneMosquee: "",
    emailMosquee: "",
    // Admin
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeMosquee, setCodeMosquee] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      // Récupérer les données de la réponse
      const responseData = await response.json();
      
      // Afficher le code mosquée
      if (responseData.codeMosquee) {
        setCodeMosquee(responseData.codeMosquee);
      }

      // Connexion automatique après inscription
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        // Rediriger après 5 secondes si le code est affiché, sinon immédiatement
        if (responseData.codeMosquee) {
          setTimeout(() => {
            router.push("/admin");
          }, 5000);
        } else {
          router.push("/admin");
        }
      } else {
        router.push("/auth/login");
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-primary">
              Créer un compte mosquée
            </CardTitle>
            <CardDescription className="text-center">
              Inscrivez votre mosquée sur MadrasaApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-primary">
                  Informations de la mosquée
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Nom de la mosquée"
                    value={formData.nomMosquee}
                    onChange={(e) =>
                      setFormData({ ...formData, nomMosquee: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Adresse"
                    value={formData.adresseMosquee}
                    onChange={(e) =>
                      setFormData({ ...formData, adresseMosquee: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Téléphone"
                      type="tel"
                      value={formData.telephoneMosquee}
                      onChange={(e) =>
                        setFormData({ ...formData, telephoneMosquee: e.target.value })
                      }
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={formData.emailMosquee}
                      onChange={(e) =>
                        setFormData({ ...formData, emailMosquee: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-primary">
                  Informations administrateur
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Prénom"
                      value={formData.prenom}
                      onChange={(e) =>
                        setFormData({ ...formData, prenom: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Nom"
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Input
                    label="Email (identifiant de connexion)"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                  />
                  <Input
                    label="Mot de passe"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Confirmer le mot de passe"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600 bg-red-50 p-3 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Créer le compte
              </Button>

              <p className="text-center text-sm text-gray-600">
                Déjà un compte ?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </p>
            </form>

            {codeMosquee && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 bg-primary/10 border-2 border-primary rounded-lg"
              >
                <h3 className="font-semibold text-primary mb-2">
                  ✅ Compte créé avec succès !
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Votre code mosquée (à partager avec les parents et professeurs) :
                </p>
                <div className="bg-white p-3 rounded border-2 border-dashed border-primary">
                  <code className="text-lg font-bold text-primary">{codeMosquee}</code>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Redirection automatique dans 5 secondes...
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
