"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/Card";

export default function ChangePasswordClient() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Impossible de mettre à jour le mot de passe."
        );
        setLoading(false);
        return;
      }
      await signOut({ callbackUrl: "/auth/login?message=Mot de passe mis à jour" });
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="mx-auto w-full max-w-md border-filet">
      <CardHeader>
        <CardDescription className="text-center text-base text-primary">
          Pour des raisons de sécurité, choisissez un nouveau mot de passe
          personnel (minimum 10 caractères).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mot de passe"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={10}
            autoComplete="new-password"
          />
          <Input
            label="Retaper le mot de passe"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={10}
            autoComplete="new-password"
          />
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" isLoading={loading}>
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
