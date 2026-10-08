import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const backBase =
  "inline-flex min-h-11 max-w-full items-center gap-2 rounded-2xl border border-filet bg-sable px-3.5 py-2 text-sm font-semibold text-brun transition-[transform,background-color] hover:bg-filet/60 active:scale-[0.98]";

const createBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-2xl bg-or px-4 py-2.5 text-sm font-semibold text-nuit shadow-sm transition-[transform,background-color] hover:bg-or-clair active:scale-[0.98]";

const secondaryBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-2xl bg-brun px-4 py-2.5 text-sm font-semibold text-blanc transition-[transform,background-color] hover:bg-nuit active:scale-[0.98]";

type BackLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function BackLink({ href, children, className }: BackLinkProps) {
  return (
    <Link href={href} className={cn(backBase, className)}>
      <ArrowLeft className="h-4 w-4 shrink-0 text-or" aria-hidden />
      <span className="truncate">{children}</span>
    </Link>
  );
}

type HeaderCreateLinkProps = {
  href: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function HeaderCreateLink({
  href,
  children,
  icon: Icon = Plus,
  className,
}: HeaderCreateLinkProps) {
  return (
    <Link href={href} className={cn(createBase, className)}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{children}</span>
    </Link>
  );
}

type HeaderSecondaryLinkProps = {
  href: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

const outlineBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-2xl border border-filet bg-blanc px-4 py-2.5 text-sm font-semibold text-brun transition-[transform,background-color] hover:bg-sable active:scale-[0.98]";

type HeaderOutlineLinkProps = {
  href: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function HeaderOutlineLink({
  href,
  children,
  icon: Icon,
  className,
}: HeaderOutlineLinkProps) {
  return (
    <Link href={href} className={cn(outlineBase, className)}>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-or" aria-hidden />}
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function HeaderSecondaryLink({
  href,
  children,
  icon: Icon,
  className,
}: HeaderSecondaryLinkProps) {
  return (
    <Link href={href} className={cn(secondaryBase, className)}>
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      <span className="truncate">{children}</span>
    </Link>
  );
}
