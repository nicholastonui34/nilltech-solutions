import { Button } from "@/components/ui/button";

/**
 * Toolchain smoke-test placeholder only — proves Tailwind, shadcn/ui,
 * Poppins and the brand token theme compile and render correctly.
 * Real IA/route groups and page content are Phase 2 ("Public site v2"),
 * not part of this Phase 1 foundation commit.
 */
export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">
        {"[PHASE 1 FOUNDATION — ROUTES NOT YET BUILT]"}
      </h1>
      <p className="text-muted-foreground max-w-md">
        {"[PLACEHOLDER: Phase 2 replaces this page with the real home route and IA]"}
      </p>
      <Button>{"[PLACEHOLDER CTA]"}</Button>
    </main>
  );
}
