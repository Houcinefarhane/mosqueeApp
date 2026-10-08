"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import toast from "react-hot-toast";
import { isNativePlatform } from "@/lib/native/is-native";

type Prefs = {
  annoncesEnabled: boolean;
  messagesEnabled: boolean;
  absencesEnabled: boolean;
};

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const native = isNativePlatform();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetch("/api/push/preferences")
      .then((r) => r.json())
      .then(setPrefs)
      .catch(() => toast.error("Impossible de charger les préférences"));
  }, [status]);

  const update = async (patch: Partial<Prefs>) => {
    if (!prefs) return;
    setSaving(true);
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      const res = await fetch("/api/push/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      toast.success("Préférences enregistrées");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !prefs) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-sm text-brun-doux">
        Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-0">
      <PageHeader
        title="Notifications"
        description="Alertes push MadrasApp (application mobile)"
      />

      {!native && (
        <p className="rounded-2xl border border-filet bg-sable/50 p-4 text-sm text-brun-doux">
          Les notifications push sont disponibles dans l&apos;application mobile
          iOS ou Android. Sur le site web, cette page enregistre vos préférences
          pour lorsque vous utilisez l&apos;app.
        </p>
      )}

      <Card variant="elevated">
        <CardContent className="space-y-4 p-5">
          <ToggleRow
            label="Annonces de la mosquée"
            description="Nouvelles annonces pour parents et enseignants"
            checked={prefs.annoncesEnabled}
            disabled={saving}
            onChange={(v) => void update({ annoncesEnabled: v })}
          />
          <ToggleRow
            label="Messages"
            description="Nouveau message reçu"
            checked={prefs.messagesEnabled}
            disabled={saving}
            onChange={(v) => void update({ messagesEnabled: v })}
          />
          <ToggleRow
            label="Absences et retards"
            description="Alerte après l'appel (sans détail sensible)"
            checked={prefs.absencesEnabled}
            disabled={saving}
            onChange={(v) => void update({ absencesEnabled: v })}
          />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-brun-doux">
        <Link href="/compte/donnees-personnelles" className="text-or hover:underline">
          Mes données personnelles
        </Link>
        {" · "}
        <Link href="/legal/confidentialite" className="text-or hover:underline">
          Confidentialité
        </Link>
      </p>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-filet pb-4 last:border-0 last:pb-0">
      <span>
        <span className="block font-semibold text-foreground">{label}</span>
        <span className="text-sm text-brun-doux">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 rounded border-filet text-or focus:ring-or"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
