"use client";

import { useState } from "react";
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
    <div className="overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-r from-green-50 to-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary/70">
            Votre mosquée
          </p>
          <p className="mt-1 text-xl font-semibold text-primary">{nom}</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <p className="text-xs text-gray-500">Code mosquée</p>
          <button
            type="button"
            onClick={handleCopy}
            className="group inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white/80 px-3 py-1.5 font-mono text-sm text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-white"
            title="Copier le code"
          >
            <span className="max-w-[200px] truncate sm:max-w-none">{code}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-colors group-hover:text-primary" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
