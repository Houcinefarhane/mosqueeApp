"use client";

import Button from "@/components/ui/Button";

interface SegmentErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SegmentError({ error, reset }: SegmentErrorProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        Une erreur est survenue
      </h2>
      <p className="max-w-md text-sm text-gray-600">{error.message}</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
