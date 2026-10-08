"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import toast from "react-hot-toast";
import { Download, Shield, Trash2 } from "lucide-react";

export default function DonneesPersonnellesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl p-6 text-sm text-brun-doux">
        Chargement…
      </div>
    );
  }

  if (!session) {
    router.replace("/auth/login");
    return null;
  }

  const role = session.user.role;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/me/data-export");
      if (!res.ok) throw new Error("Export impossible");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "madrasapp-donnees.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé");
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Supprimer définitivement votre compte ? Cette action est irréversible. Les messages associés seront supprimés."
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/me/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data.code === "ADMIN_CONTACT") {
        toast.error(
          `Compte admin : contactez ${data.contactEmail ?? "le support"}.`
        );
        return;
      }
      if (!res.ok) throw new Error(data.error || "Suppression impossible");
      toast.success("Compte supprimé");
      await signOut({ callbackUrl: "/auth/login" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-0">
      <PageHeader
        title="Mes données personnelles"
        description="Exercice de vos droits RGPD sur votre compte MadrasApp"
      />

      <Card variant="elevated">
        <CardContent className="space-y-4 p-5">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 shrink-0 text-or" aria-hidden />
            <p className="text-sm text-brun-doux">
              Les notes, présences et dossiers élèves sont aussi traités par votre
              mosquée (responsable de traitement). Pour ces données, contactez
              l&apos;administration de votre établissement en complément.
            </p>
          </div>
          <p className="text-xs text-brun-doux">
            Rôle actuel : <span className="font-semibold">{role}</span>
          </p>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-display text-lg font-extrabold text-foreground">
            Droit d&apos;accès et portabilité
          </h2>
          <p className="text-sm text-brun-doux">
            Téléchargez une copie JSON des informations liées à votre compte et
            à votre messagerie.
          </p>
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full sm:w-auto"
            onClick={handleExport}
            isLoading={exporting}
          >
            <Download className="h-4 w-4" />
            Télécharger mes données
          </Button>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-display text-lg font-extrabold text-foreground">
            Droit à l&apos;effacement
          </h2>
          <p className="text-sm text-brun-doux">
            {role === "ADMIN"
              ? "Les comptes administrateur de mosquée ne peuvent pas être supprimés en self-service. Contactez le support pour une demande d'effacement de l'espace mosquée."
              : role === "PROFESSEUR"
                ? "Votre compte sera désactivé et anonymisé. Les données pédagogiques déjà enregistrées (notes, présences) peuvent être conservées par la mosquée."
                : "Votre compte et vos messages seront supprimés. Les dossiers élèves restent gérés par la mosquée."}
          </p>
          {role !== "ADMIN" && (
            <Button
              type="button"
              variant="danger"
              className="min-h-12 w-full sm:w-auto"
              onClick={handleDelete}
              isLoading={deleting}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer mon compte
            </Button>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-brun-doux">
        <Link href="/legal/confidentialite" className="text-or hover:underline">
          Politique de confidentialité
        </Link>
      </p>
    </div>
  );
}
