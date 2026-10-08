"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type HistoriqueDeleteButtonProps = {
  label: string;
  disabled?: boolean;
  onDelete: () => void;
  className?: string;
};

export default function HistoriqueDeleteButton({
  label,
  disabled,
  onDelete,
  className,
}: HistoriqueDeleteButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      className={cn(
        "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl border border-filet bg-blanc text-brun-doux transition-colors hover:border-brun-doux hover:bg-sable hover:text-brun disabled:opacity-50",
        className
      )}
      aria-label={label}
      title={label}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
