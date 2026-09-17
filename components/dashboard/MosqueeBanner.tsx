"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy } from "lucide-react";
import toast from "react-hot-toast";

interface MosqueeBannerProps {
  nom: string;
  code: string;
}

export default function MosqueeBanner({ nom, code }: MosqueeBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-secondary/30 bg-gradient-to-r from-primary-dark via-primary to-primary-light shadow-elevated">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/15 blur-2xl" />
      <div className="absolute -bottom-4 left-1/3 h-24 w-24 rounded-full bg-white/5 blur-xl" />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md ring-1 ring-secondary/30">
            <Image
              src="/logo-mosquee.png"
              alt="Logo mosquée"
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary-light">
              Votre mosquée
            </p>
            <p className="text-xl font-semibold text-white">{nom}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <p className="text-xs font-medium text-white/60">Code mosquée</p>
          <button
            type="button"
            onClick={handleCopy}
            className="group inline-flex items-center gap-2 rounded-lg border border-secondary/40 bg-secondary/20 px-3 py-2 font-mono text-sm text-white backdrop-blur-sm transition-all hover:border-secondary hover:bg-secondary/30"
            title="Copier le code"
          >
            <span className="max-w-[200px] truncate sm:max-w-none">{code}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-secondary-light" />
            ) : (
              <Copy className="h-3.5 w-3.5 shrink-0 text-white/50 transition-colors group-hover:text-secondary-light" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
