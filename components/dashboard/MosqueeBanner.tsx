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
      <div className="relative flex items-center justify-between gap-2 p-3 sm:gap-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 shadow-md ring-1 ring-secondary/30 sm:h-14 sm:w-14 sm:rounded-xl sm:p-1">
            <Image
              src="/logo-mosquee.png"
              alt="Logo mosquée"
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="hidden text-xs font-semibold uppercase tracking-widest text-secondary-light sm:block">
              Votre mosquée
            </p>
            <p className="truncate text-sm font-semibold text-white sm:text-xl">{nom}</p>
          </div>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="group inline-flex max-w-[7.5rem] items-center gap-1 rounded-lg border border-secondary/40 bg-secondary/20 px-2 py-1.5 font-mono text-[10px] text-white backdrop-blur-sm transition-all hover:border-secondary hover:bg-secondary/30 sm:max-w-none sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            title="Copier le code mosquée"
          >
            <span className="truncate">{code}</span>
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
