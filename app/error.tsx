"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-destructive text-sm font-semibold">Something went wrong</p>
      <h1 className="text-3xl font-semibold">We hit an unexpected error</h1>
      <p className="text-muted-foreground max-w-sm">
        Please try again, or contact us if it persists.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
