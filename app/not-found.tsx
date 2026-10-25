import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-nilltech-purple text-sm font-semibold">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-sm">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
