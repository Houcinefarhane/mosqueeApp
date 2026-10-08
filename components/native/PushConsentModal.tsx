"use client";

import Button from "@/components/ui/Button";
import Logo from "@/components/brand/Logo";

type PushConsentModalProps = {
  onAccept: () => void;
  onDecline: () => void;
};

export default function PushConsentModal({
  onAccept,
  onDecline,
}: PushConsentModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-nuit/70 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="push-consent-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-filet bg-blanc p-6 shadow-elevated">
        <div className="mb-4 flex justify-center">
          <Logo size={48} withWordmark />
        </div>
        <h2
          id="push-consent-title"
          className="font-display text-lg font-extrabold text-foreground"
        >
          Recevoir les annonces et absences
        </h2>
        <p className="mt-2 text-sm text-brun-doux">
          MadrasApp peut vous envoyer des alertes pour les{" "}
          <strong>annonces</strong> de la mosquée, les <strong>messages</strong>{" "}
          et les <strong>absences ou retards</strong> à l&apos;appel. Aucune note
          ni donnée médicale n&apos;est incluse. Vous pourrez choisir les types
          dans{" "}
          <span className="font-semibold">Compte → Notifications</span>.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1"
            onClick={onDecline}
          >
            Plus tard
          </Button>
          <Button type="button" className="min-h-11 flex-1" onClick={onAccept}>
            Activer les notifications
          </Button>
        </div>
      </div>
    </div>
  );
}
