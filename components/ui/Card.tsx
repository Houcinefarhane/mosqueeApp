import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
}

export function Card({
  className,
  variant = "default",
  children,
  ...props
}: CardProps) {
  const variants = {
    default: "bg-white border border-gray-100 shadow-sm",
    elevated: "bg-white shadow-sm border border-gray-100",
    outlined: "bg-white border-2 border-primary/20",
  };

  return (
    <div className={cn("rounded-xl", variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-gray-600 mt-0.5", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 pb-6 pt-2 border-t border-gray-100", className)} {...props} />
  );
}
